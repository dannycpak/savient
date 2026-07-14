import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { uploadSpecimenPhoto } from "@/lib/photos";
import { Screen, Button, Field, Card } from "@/components/ui";
import { FREE_TIER } from "@/constants/copy";
import { radius, space, type } from "@/constants/theme";

export default function NewSpecimen() {
  const { species: preset } = useLocalSearchParams<{ species?: string }>();
  const [species, setSpecies] = useState(preset ?? "");
  const [locality, setLocality] = useState("");
  const [provenance, setProvenance] = useState("");
  const [value, setValue] = useState("");
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

      if (photoUri) {
        await uploadSpecimenPhoto(photoUri, data.id);
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
        <Field label="Locality" value={locality} onChangeText={setLocality} autoCapitalize="words" />
        <Field label="Provenance" value={provenance} onChangeText={setProvenance} />
        <Field
          label="Estimated value (USD)"
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
        <Button label="Save to catalog" onPress={save} loading={busy} />
      </ScrollView>
    </Screen>
  );
}
