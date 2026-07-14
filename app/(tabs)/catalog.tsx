import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button } from "@/components/ui";
import { Swatch } from "@/components/Swatch";
import { COPY, FREE_TIER } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

type Row = {
  id: string;
  species: string;
  locality: string | null;
  est_value_cents: number | null;
  rarity: string | null;
};

export default function Catalog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [plan, setPlan] = useState<"free" | "plus">("free");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("specimens")
          .select("id, species, locality, est_value_cents, rarity")
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
    <Screen style={{ paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md, gap: space.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={type.h1}>My collection</Text>
              <Pressable
                onPress={add}
                style={{
                  height: 38,
                  paddingHorizontal: 16,
                  borderRadius: 19,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.onDark, fontFamily: "InstrumentSans_600SemiBold", fontSize: 14 }}>
                  + Add
                </Text>
              </Pressable>
            </View>
            <Text style={type.caption}>
              {rows.length} specimen{rows.length === 1 ? "" : "s"}
              {plan === "free" ? ` · Free cap ${FREE_TIER.catalogCap}` : " · Unlimited with Sage+"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>{COPY.emptyCatalog}</Text>
            <Button label="Add specimen" onPress={add} />
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/specimen/${item.id}`)}>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Swatch name={item.species} height={56} rounded={radius.sm} style={{ width: 56 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 20, color: colors.ink }}>
                  {item.species}
                </Text>
                <Text style={type.caption}>{item.locality ?? "Locality unknown"}</Text>
                {item.rarity ? <Text style={type.label}>{item.rarity}</Text> : null}
              </View>
              <Text style={type.body}>
                {item.est_value_cents != null ? `$${(item.est_value_cents / 100).toLocaleString()}` : "—"}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
