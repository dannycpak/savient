import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { uploadSpecimenPhoto, signedPhotoUrl } from "@/lib/photos";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { formatMoney, parseDims } from "@/lib/format";
import { colors, radius, space, type } from "@/constants/theme";

type Specimen = {
  id: string;
  species: string;
  variety: string | null;
  locality: string | null;
  formation: string | null;
  matrix: string | null;
  dims: Record<string, unknown> | null;
  provenance: string | null;
  rarity: string | null;
  condition: string | null;
  est_value_cents: number | null;
  acquisition_price_cents: number | null;
  visibility: string;
  created_at: string;
};

type Photo = { id: string; storage_path: string; is_primary: boolean; url?: string };

const WIDTH = Dimensions.get("window").width;

export default function SpecimenDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<Specimen | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("specimens").select("*").eq("id", id).single();
    setRow((data as Specimen) ?? null);
    const { data: ph } = await supabase
      .from("specimen_photos")
      .select("id, storage_path, is_primary")
      .eq("specimen_id", id)
      .order("uploaded_at", { ascending: true });
    const withUrls: Photo[] = [];
    for (const p of (ph as Photo[]) ?? []) {
      try {
        withUrls.push({ ...p, url: await signedPhotoUrl(p.storage_path) });
      } catch {
        withUrls.push(p);
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
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (res.canceled) return;
    setBusy(true);
    try {
      await uploadSpecimenPhoto(res.assets[0].uri, id);
      await load();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (photoId: string) => {
    setBusy(true);
    try {
      await supabase.from("specimen_photos").update({ is_primary: false }).eq("specimen_id", id);
      await supabase.from("specimen_photos").update({ is_primary: true }).eq("id", photoId);
      await load();
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (photoId: string, path: string) => {
    Alert.alert("Remove photo?", "This deletes the image from your cabinet.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await supabase.from("specimen_photos").delete().eq("id", photoId);
          await supabase.storage.from("specimen-photos").remove([path]);
          await load();
        },
      },
    ]);
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

  const primary = photos.find((p) => p.is_primary) ?? photos[0];

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {primary?.url ? (
          <Image
            source={{ uri: primary.url }}
            style={{ width: "100%", height: 260, borderRadius: radius.lg }}
          />
        ) : (
          <Card style={{ height: 180, alignItems: "center", justifyContent: "center" }}>
            <Text style={type.caption}>No photos yet</Text>
          </Card>
        )}

        {photos.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {photos.map((p) =>
                p.url ? (
                  <Pressable
                    key={p.id}
                    onPress={() => setPrimary(p.id)}
                    onLongPress={() => removePhoto(p.id, p.storage_path)}
                    style={{
                      borderWidth: p.is_primary ? 2 : 1,
                      borderColor: p.is_primary ? colors.primary : colors.border,
                      borderRadius: radius.md,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: p.url }}
                      style={{ width: WIDTH * 0.22, height: WIDTH * 0.22 }}
                    />
                  </Pressable>
                ) : null,
              )}
            </View>
          </ScrollView>
        ) : null}

        <View style={{ gap: 2 }}>
          {row.rarity ? <Eyebrow>{row.rarity}</Eyebrow> : null}
          <Text style={type.h1}>{row.species}</Text>
          {row.variety ? <Text style={type.caption}>{row.variety}</Text> : null}
        </View>

        <Card>
          <Eyebrow>Estimated value</Eyebrow>
          <Text style={type.display}>{formatMoney(row.est_value_cents)}</Text>
          {row.acquisition_price_cents != null ? (
            <Text style={type.caption}>Paid {formatMoney(row.acquisition_price_cents)}</Text>
          ) : null}
        </Card>

        <Card>
          <Fact label="Locality" value={row.locality} />
          <Fact label="Formation" value={row.formation} />
          <Fact label="Matrix" value={row.matrix} />
          <Fact label="Dimensions" value={parseDims(row.dims)} />
          <Fact label="Provenance" value={row.provenance} />
          <Fact label="Condition" value={row.condition} />
          <Fact label="Visibility" value={row.visibility} />
        </Card>

        <Button label="Add photo" variant="ghost" onPress={addPhoto} loading={busy} />
        <Button
          label="Edit details"
          variant="ghost"
          onPress={() => router.push(`/specimen/edit/${id}`)}
        />
        <Button
          label="Buy similar"
          variant="ghost"
          onPress={() => router.push("/(tabs)/market")}
        />
        <Button label="Delete" variant="danger" onPress={remove} />
      </ScrollView>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={type.label}>{label}</Text>
      <Text style={type.body}>{value ?? "—"}</Text>
    </View>
  );
}
