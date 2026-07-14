// My collection — list + add; free tier capped at 25 specimens (server enforces too).
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button } from "@/components/ui";
import { FREE_TIER, COPY } from "@/constants/copy";
import { space, type } from "@/constants/theme";

type Row = {
  id: string;
  species: string;
  locality: string | null;
  est_value_cents: number | null;
};

export default function Catalog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [plan, setPlan] = useState<"free" | "plus">("free");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("specimens")
          .select("id, species, locality, est_value_cents")
          .order("created_at", { ascending: false });
        setRows((data as Row[]) ?? []);
        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
      })();
    }, []),
  );

  const add = () => {
    if (plan === "free" && rows.length >= FREE_TIER.catalogCap) {
      Alert.alert(
        "Catalog full",
        `Free accounts hold ${FREE_TIER.catalogCap} specimens. Sage+ removes the cap.`,
        [
          { text: "Maybe later" },
          { text: "See Sage+", onPress: () => router.push("/paywall") },
        ],
      );
      return;
    }
    router.push("/specimen/new");
  };

  return (
    <Screen style={{ gap: space.md, paddingBottom: 0 }}>
      <Button label="Add specimen" onPress={add} />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xl }}
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>{COPY.emptyCatalog}</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/specimen/${item.id}`)}>
            <Card>
              <Text style={type.h2}>{item.species}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={type.caption}>{item.locality ?? "Locality unknown"}</Text>
                <Text style={type.caption}>
                  {item.est_value_cents != null
                    ? `$${(item.est_value_cents / 100).toLocaleString()}`
                    : ""}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
