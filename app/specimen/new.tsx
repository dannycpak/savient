import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { uploadSpecimenPhoto } from "@/lib/photos";
import { Screen, Button, Field, Card, Eyebrow } from "@/components/ui";
import { FREE_TIER } from "@/constants/copy";
import { formatMoney } from "@/lib/format";
import { radius, space, type } from "@/constants/theme";

export default function NewSpecimen() {
  const {
    species: preset,
    checkId,
    estLow,
    estHigh,
  } = useLocalSearchParams<{
    species?: string;
    checkId?: string;
    estLow?: string;
    estHigh?: string;
  }>();

  const midEstimate =
    estLow && estHigh && Number(estLow) && Number(estHigh)
      ? String(Math.round((Number(estLow) + Number(estHigh)) / 2) / 100)
      : "";

  const [species, setSpecies] = useState(preset ?? "");
  const [variety, setVariety] = useState("");
  const [locality, setLocality] = useState("");
  const [formation, setFormation] = useState("");
  const [matrix, setMatrix] = useState("");
  const [dims, setDims] = useState("");
  const [provenance, setProvenance] = useState("");
  const [rarity, setRarity] = useState("");
  const [condition, setCondition] = useState("");
  const [value, setValue] = useState(midEstimate);
  const [paid, setPaid] = useState("");
  const [wasPurchase, setWasPurchase] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const save = async () => {
    if (!species.trim()) {
      Alert.alert("Species required");
      return;
    }
    setBusy(true);
    try {
      const { data: prof } = await supabase.from("profiles").select("plan").single();
      const { count } = await supabase
        .from("specimens")
        .select("id", { count: "exact", head: true });
      if (prof?.plan === "free" && (count ?? 0) >= FREE_TIER.catalogCap) {
        Alert.alert("Catalog full", "Upgrade to Sage+ for unlimited cataloging.", [
          { text: "Maybe later" },
          { text: "See Sage+", onPress: () => router.push("/paywall") },
        ]);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const est = value.trim() ? Math.round(parseFloat(value) * 100) : null;
      const acq = paid.trim() ? Math.round(parseFloat(paid) * 100) : null;
      const parts = dims.trim().split(/[x×]/i).map((s) => s.trim()).filter(Boolean);
      const unitMatch = dims.match(/\b(cm|mm|in)\b/i);
      const dimsJson =
        parts.length > 0
          ? {
              length: parts[0] ?? null,
              width: parts[1] ?? null,
              height: parts[2]?.replace(/\s*(cm|mm|in)\s*/i, "") ?? null,
              unit: unitMatch?.[1]?.toLowerCase() ?? "cm",
            }
          : null;

      const { data, error } = await supabase
        .from("specimens")
        .insert({
          owner_id: user.id,
          species: species.trim(),
          variety: variety.trim() || null,
          locality: locality.trim() || null,
          formation: formation.trim() || null,
          matrix: matrix.trim() || null,
          dims: dimsJson,
          provenance: provenance.trim() || null,
          rarity: rarity.trim() || null,
          condition: condition.trim() || null,
          est_value_cents: Number.isFinite(est) ? est : null,
          acquisition_price_cents: Number.isFinite(acq) ? acq : null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (photoUri) await uploadSpecimenPhoto(photoUri, data.id);

      if (wasPurchase) {
        Alert.alert(
          "Rate this purchase?",
          "Seller credibility improves when buyers rate material accuracy.",
          [
            {
              text: "Later",
              onPress: () => router.replace(`/specimen/${data.id}`),
            },
            {
              text: "My purchases",
              onPress: () => router.replace("/account/orders"),
            },
          ],
        );
        return;
      }

      router.replace(`/specimen/${data.id}`);
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>Add specimen</Text>
        {checkId ? (
          <Card>
            <Eyebrow>From Visual Check</Eyebrow>
            <Text style={type.caption}>
              Prefilling from check {checkId.slice(0, 8)}…
              {estLow && estHigh
                ? ` Suggested range ${formatMoney(Number(estLow))} – ${formatMoney(Number(estHigh))}.`
                : ""}
            </Text>
          </Card>
        ) : null}

        <Pressable onPress={pick}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: 200, borderRadius: radius.lg }}
            />
          ) : (
            <Card style={{ height: 160, alignItems: "center", justifyContent: "center" }}>
              <Text style={type.h2}>Tap to add a photo</Text>
              <Text style={type.caption}>EXIF/GPS stripped before upload.</Text>
            </Card>
          )}
        </Pressable>

        <Field label="Species" value={species} onChangeText={setSpecies} autoCapitalize="words" />
        <Field label="Variety" value={variety} onChangeText={setVariety} autoCapitalize="words" />
        <Field label="Locality" value={locality} onChangeText={setLocality} autoCapitalize="words" />
        <Field label="Formation" value={formation} onChangeText={setFormation} />
        <Field label="Matrix" value={matrix} onChangeText={setMatrix} />
        <Field label="Dimensions (L x W x H cm)" value={dims} onChangeText={setDims} />
        <Field label="Provenance" value={provenance} onChangeText={setProvenance} />
        <Field label="Rarity" value={rarity} onChangeText={setRarity} />
        <Field label="Condition" value={condition} onChangeText={setCondition} />
        <Field
          label="Estimated value (USD)"
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
        <Field
          label="Acquisition price (USD)"
          value={paid}
          onChangeText={setPaid}
          keyboardType="decimal-pad"
        />

        <Card>
          <Eyebrow>Purchase?</Eyebrow>
          <Pressable onPress={() => setWasPurchase((v) => !v)}>
            <Text style={type.body}>
              {wasPurchase ? "● " : "○ "}This specimen was a purchase (prompt to rate seller)
            </Text>
          </Pressable>
        </Card>

        <Button label="Save to catalog" onPress={save} loading={busy} />
      </ScrollView>
    </Screen>
  );
}
