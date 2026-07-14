import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { space, type } from "@/constants/theme";

type Specimen = { id: string; species: string; est_value_cents: number | null; created_at: string };

export default function Home() {
  const [valueCents, setValueCents] = useState(0);
  const [recent, setRecent] = useState<Specimen[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("specimens")
          .select("id, species, est_value_cents, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        const rows = (data as Specimen[]) ?? [];
        setRecent(rows);
        setValueCents(rows.reduce((sum, r) => sum + (r.est_value_cents ?? 0), 0));
        // Full collection value — separate query for SUM accuracy
        const { data: all } = await supabase.from("specimens").select("est_value_cents");
        const total = ((all as { est_value_cents: number | null }[]) ?? []).reduce(
          (s, r) => s + (r.est_value_cents ?? 0),
          0,
        );
        setValueCents(total);
      })();
    }, []),
  );

  return (
    <Screen style={{ gap: space.lg }}>
      <View style={{ gap: space.xs }}>
        <Eyebrow>Collection value</Eyebrow>
        <Text style={type.display}>${(valueCents / 100).toLocaleString()}</Text>
        <Text style={type.caption}>{COPY.tagline}</Text>
      </View>

      <Button label="Run a Visual Check" onPress={() => router.push("/(tabs)/check")} />

      <View style={{ gap: space.sm }}>
        <Text style={type.h2}>Recent activity</Text>
        {recent.length === 0 ? (
          <Card>
            <Text style={type.body}>Nothing yet. Add a specimen or run a Visual Check.</Text>
          </Card>
        ) : (
          recent.map((r) => (
            <Pressable key={r.id} onPress={() => router.push(`/specimen/${r.id}`)}>
              <Card>
                <Text style={type.body}>{r.species} added to catalog</Text>
                <Text style={type.caption}>
                  {r.est_value_cents != null
                    ? `Est. $${(r.est_value_cents / 100).toLocaleString()}`
                    : "Value pending"}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
