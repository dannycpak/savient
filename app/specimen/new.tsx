import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { Screen, Button, SoftInput } from "@/components/ui";
import { FREE_TIER } from "@/constants/copy";
import { colors, space } from "@/constants/theme";

export default function NewSpecimen() {
  const { species: preset } = useLocalSearchParams<{ species?: string }>();
  const [species, setSpecies] = useState(preset ?? "");
  const [locality, setLocality] = useState("");
  const [provenance, setProvenance] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

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
      const { data, error } = await supabase
        .from("specimens")
        .insert({
          owner_id: user.id,
          species: species.trim(),
          locality: locality.trim() || null,
          provenance: provenance.trim() || null,
          est_value_cents: Number.isFinite(est) ? est : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      router.replace(`/specimen/${data.id}`);
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: space.md, paddingBottom: space.xl, gap: 14 }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 30, color: colors.ink }}>
          Add specimen
        </Text>
        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 18,
            gap: 12,
          }}
        >
          <SoftInput placeholder="Species" value={species} onChangeText={setSpecies} autoCapitalize="words" />
          <SoftInput placeholder="Locality" value={locality} onChangeText={setLocality} autoCapitalize="words" />
          <SoftInput placeholder="Provenance" value={provenance} onChangeText={setProvenance} />
          <SoftInput
            placeholder="Estimated value (USD)"
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
          />
          <Text style={{ fontSize: 12.5, color: colors.muted, lineHeight: 18 }}>
            Photos can be added from the specimen detail screen. EXIF/GPS is stripped before upload.
          </Text>
          <Button label="Save to catalog" onPress={save} loading={busy} />
        </View>
      </ScrollView>
    </Screen>
  );
}
