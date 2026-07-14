import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

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
};

export default function SpecimenDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<Specimen | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase.from("specimens").select("*").eq("id", id).single();
        setRow((data as Specimen) ?? null);
      })();
    }, [id]),
  );

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
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>{row.species}</Text>
        {row.variety && <Text style={type.caption}>{row.variety}</Text>}

        <Card>
          <Eyebrow>Estimated value</Eyebrow>
          <Text style={type.display}>
            {row.est_value_cents != null
              ? `$${(row.est_value_cents / 100).toLocaleString()}`
              : "—"}
          </Text>
        </Card>

        <Card>
          <Row label="Locality" value={row.locality} />
          <Row label="Formation" value={row.formation} />
          <Row label="Matrix" value={row.matrix} />
          <Row label="Provenance" value={row.provenance} />
          <Row label="Rarity" value={row.rarity} />
          <Row label="Condition" value={row.condition} />
        </Card>

        <Button label="Buy similar" variant="ghost" onPress={() => router.push("/(tabs)/market")} />
        <Button label="Delete" variant="danger" onPress={remove} />
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={type.label}>{label}</Text>
      <Text style={type.body}>{value ?? "—"}</Text>
    </View>
  );
}
