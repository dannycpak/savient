import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { signedPhotoUrl, uploadPrivateImage } from "@/lib/photos";
import { Screen, Card, Button, Eyebrow, Field } from "@/components/ui";
import { Swatch } from "@/components/Swatch";
import { colors, radius, space, type } from "@/constants/theme";

type Specimen = {
  id: string;
  species: string;
  variety: string | null;
  locality: string | null;
  formation: string | null;
  matrix: string | null;
  provenance: string | null;
  rarity: string | null;
  condition: string | null;
  est_value_cents: number | null;
};

type Photo = { id: string; storage_path: string; is_primary: boolean; url?: string };

export default function SpecimenDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<Specimen | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [species, setSpecies] = useState("");
  const [locality, setLocality] = useState("");
  const [provenance, setProvenance] = useState("");
  const [value, setValue] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("specimens").select("*").eq("id", id).single();
    const specimen = (data as Specimen) ?? null;
    setRow(specimen);
    if (specimen) {
      setSpecies(specimen.species);
      setLocality(specimen.locality ?? "");
      setProvenance(specimen.provenance ?? "");
      setValue(specimen.est_value_cents != null ? String(specimen.est_value_cents / 100) : "");
    }
    const { data: photoRows } = await supabase
      .from("specimen_photos")
      .select("id, storage_path, is_primary")
      .eq("specimen_id", id)
      .order("uploaded_at", { ascending: true });
    const withUrls: Photo[] = [];
    for (const p of photoRows ?? []) {
      try {
        const url = await signedPhotoUrl("specimen-photos", p.storage_path);
        withUrls.push({ ...p, url });
      } catch {
        withUrls.push(p as Photo);
      }
    }
    setPhotos(withUrls);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos permission needed");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1, mediaTypes: ["images"] });
    if (res.canceled) return;
    setBusy(true);
    try {
      const path = await uploadPrivateImage("specimen-photos", res.assets[0].uri, `${id}-${Date.now()}.jpg`);
      const { error } = await supabase.from("specimen_photos").insert({
        specimen_id: id,
        storage_path: path,
        is_primary: photos.length === 0,
      });
      if (error) throw error;
      await load();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!species.trim()) {
      Alert.alert("Species required");
      return;
    }
    setBusy(true);
    try {
      const est = value.trim() ? Math.round(parseFloat(value) * 100) : null;
      const { error } = await supabase
        .from("specimens")
        .update({
          species: species.trim(),
          locality: locality.trim() || null,
          provenance: provenance.trim() || null,
          est_value_cents: Number.isFinite(est as number) ? est : null,
        })
        .eq("id", id);
      if (error) throw error;
      setEditing(false);
      await load();
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    Alert.alert("Delete specimen?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("specimens").delete().eq("id", id);
          router.replace("/(tabs)/catalog");
        },
      },
    ]);
  };

  if (!row) {
    return (
      <Screen>
        <Text style={type.body}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}>
        {photos[0]?.url ? (
          <Image source={{ uri: photos[0].url }} style={{ width: "100%", height: 220, borderRadius: radius.lg }} />
        ) : (
          <Swatch name={row.species} height={200} rounded={radius.lg} />
        )}

        {editing ? (
          <>
            <Field label="Species" value={species} onChangeText={setSpecies} autoCapitalize="words" />
            <Field label="Locality" value={locality} onChangeText={setLocality} autoCapitalize="words" />
            <Field label="Provenance" value={provenance} onChangeText={setProvenance} />
            <Field label="Estimated value (USD)" value={value} onChangeText={setValue} keyboardType="decimal-pad" />
            <Button label="Save changes" onPress={saveEdit} loading={busy} />
            <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
          </>
        ) : (
          <>
            <View style={{ gap: 6 }}>
              <Text style={type.h1}>{row.species}</Text>
              {row.rarity ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: colors.chip,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ ...type.label, color: colors.muted }}>{row.rarity}</Text>
                </View>
              ) : null}
            </View>

            <View
              style={{
                backgroundColor: colors.primaryHover,
                borderRadius: radius.lg,
                padding: 20,
                gap: 6,
              }}
            >
              <Eyebrow onDark>Estimated value</Eyebrow>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 36, color: colors.onDark }}>
                {row.est_value_cents != null ? `$${(row.est_value_cents / 100).toLocaleString()}` : "—"}
              </Text>
            </View>

            <Card>
              <Row label="Locality" value={row.locality} />
              <Row label="Formation" value={row.formation} />
              <Row label="Matrix" value={row.matrix} />
              <Row label="Provenance" value={row.provenance} />
              <Row label="Condition" value={row.condition} />
            </Card>

            <Eyebrow>Buy similar</Eyebrow>
            <Button label="Browse marketplace" variant="ghost" onPress={() => router.push("/(tabs)/market")} />
            <Button label="Add photo" onPress={addPhoto} loading={busy} />
            <Button label="Edit" variant="ghost" onPress={() => setEditing(true)} />
            <Button label="Delete" variant="danger" onPress={remove} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={{ gap: 2, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
      <Text style={type.label}>{label}</Text>
      <Text style={type.body}>{value ?? "—"}</Text>
    </View>
  );
}
