import { useCallback, useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field, Card } from "@/components/ui";
import { space, type } from "@/constants/theme";

export default function EditSpecimen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [species, setSpecies] = useState("");
  const [variety, setVariety] = useState("");
  const [locality, setLocality] = useState("");
  const [formation, setFormation] = useState("");
  const [matrix, setMatrix] = useState("");
  const [dims, setDims] = useState("");
  const [provenance, setProvenance] = useState("");
  const [rarity, setRarity] = useState("");
  const [condition, setCondition] = useState("");
  const [value, setValue] = useState("");
  const [paid, setPaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data, error } = await supabase.from("specimens").select("*").eq("id", id).single();
        if (error || !data) {
          Alert.alert("Not found");
          router.back();
          return;
        }
        setSpecies(data.species ?? "");
        setVariety(data.variety ?? "");
        setLocality(data.locality ?? "");
        setFormation(data.formation ?? "");
        setMatrix(data.matrix ?? "");
        const d = data.dims as { length?: string; width?: string; height?: string; unit?: string } | null;
        setDims(
          d
            ? [d.length, d.width, d.height].filter(Boolean).join(" x ") + (d.unit ? ` ${d.unit}` : "")
            : "",
        );
        setProvenance(data.provenance ?? "");
        setRarity(data.rarity ?? "");
        setCondition(data.condition ?? "");
        setValue(data.est_value_cents != null ? String(data.est_value_cents / 100) : "");
        setPaid(
          data.acquisition_price_cents != null ? String(data.acquisition_price_cents / 100) : "",
        );
        setLoaded(true);
      })();
    }, [id]),
  );

  const save = async () => {
    if (!species.trim()) {
      Alert.alert("Species required");
      return;
    }
    setBusy(true);
    try {
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

      const { error } = await supabase
        .from("specimens")
        .update({
          species: species.trim(),
          variety: variety.trim() || null,
          locality: locality.trim() || null,
          formation: formation.trim() || null,
          matrix: matrix.trim() || null,
          dims: dimsJson,
          provenance: provenance.trim() || null,
          rarity: rarity.trim() || null,
          condition: condition.trim() || null,
          est_value_cents: Number.isFinite(est as number) ? est : null,
          acquisition_price_cents: Number.isFinite(acq as number) ? acq : null,
        })
        .eq("id", id);
      if (error) throw error;
      router.replace(`/specimen/${id}`);
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <Screen>
        <Text style={type.body}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>Edit specimen</Text>
        <Field label="Species" value={species} onChangeText={setSpecies} autoCapitalize="words" />
        <Field label="Variety" value={variety} onChangeText={setVariety} autoCapitalize="words" />
        <Field label="Locality" value={locality} onChangeText={setLocality} autoCapitalize="words" />
        <Field label="Formation" value={formation} onChangeText={setFormation} />
        <Field label="Matrix" value={matrix} onChangeText={setMatrix} />
        <Field
          label="Dimensions (L x W x H cm)"
          value={dims}
          onChangeText={setDims}
          placeholder="12 x 8 x 5 cm"
        />
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
          <Text style={type.caption}>
            Photos are managed on the specimen detail screen. EXIF/GPS is stripped on upload.
          </Text>
        </Card>
        <Button label="Save changes" onPress={save} loading={busy} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
