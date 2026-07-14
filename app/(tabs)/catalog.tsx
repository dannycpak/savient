import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Swatch } from "@/components/ui";
import { FREE_TIER, COPY } from "@/constants/copy";
import { DEMO_SPECIMENS } from "@/constants/demo";
import { colors, money } from "@/constants/theme";

type Row = {
  id: string;
  species: string;
  locality: string | null;
  est_value_cents: number | null;
  rarity?: string | null;
  swatch?: [string, string];
};

export default function Catalog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [plan, setPlan] = useState<"free" | "plus">("free");
  const [usingDemo, setUsingDemo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("specimens")
          .select("id, species, locality, est_value_cents, rarity")
          .order("created_at", { ascending: false });
        const live = (data as Row[]) ?? [];
        if (live.length > 0) {
          setRows(live);
          setUsingDemo(false);
        } else {
          setRows(
            DEMO_SPECIMENS.map((s) => ({
              id: s.id,
              species: s.name,
              locality: s.locality,
              est_value_cents: s.value * 100,
              rarity: s.rarity,
              swatch: s.swatch,
            })),
          );
          setUsingDemo(true);
        }
        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
      })();
    }, []),
  );

  const total = rows.reduce((s, r) => s + (r.est_value_cents ?? 0), 0);
  const add = () => {
    if (plan === "free" && !usingDemo && rows.length >= FREE_TIER.catalogCap) {
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
    <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.ink }}>
                My collection
              </Text>
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
                <Text style={{ color: colors.cream, fontFamily: "InstrumentSans_600SemiBold", fontSize: 14 }}>
                  + Add
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: 14 }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                <Text style={{ color: colors.ink, fontFamily: "InstrumentSans_600SemiBold" }}>{rows.length}</Text>{" "}
                specimens
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                <Text style={{ color: colors.ink, fontFamily: "InstrumentSans_600SemiBold" }}>
                  {money(Math.round(total / 100))}
                </Text>{" "}
                est. value
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View
            style={{
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 18,
            }}
          >
            <Text style={{ fontSize: 15, color: colors.ink, lineHeight: 22 }}>{COPY.emptyCatalog}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const demo = DEMO_SPECIMENS.find((s) => s.id === item.id || s.name === item.species);
          const swatch = item.swatch ?? demo?.swatch ?? (["#8A8078", "#4E463E"] as [string, string]);
          const value =
            item.est_value_cents != null
              ? money(Math.round(item.est_value_cents / 100))
              : demo
                ? money(demo.value)
                : "";
          return (
            <Pressable
              onPress={() => router.push(`/specimen/${item.id}`)}
              style={{
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 12,
                flexDirection: "row",
                gap: 14,
                alignItems: "center",
              }}
            >
              <Swatch colors={swatch} style={{ width: 56, height: 56, borderRadius: 12 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: colors.ink }}>
                  {item.species}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 13, color: colors.muted }}>
                  {item.locality ?? "Locality unknown"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15 }}>{value}</Text>
                <Text style={{ fontSize: 12, color: colors.faint }}>{item.rarity ?? demo?.rarity ?? ""}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
