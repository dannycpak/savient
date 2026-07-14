import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Swatch } from "@/components/ui";
import { DEMO_SPECIMENS, DEMO_SELLERS, DEMO_LISTINGS } from "@/constants/demo";
import { colors, money } from "@/constants/theme";

type Specimen = {
  id: string;
  species: string;
  variety: string | null;
  locality: string | null;
  formation: string | null;
  matrix: string | null;
  dims: Record<string, unknown> | string | null;
  provenance: string | null;
  rarity: string | null;
  condition: string | null;
  est_value_cents: number | null;
};

export default function SpecimenDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const demo = DEMO_SPECIMENS.find((s) => s.id === id);
  const [row, setRow] = useState<Specimen | null>(
    demo
      ? {
          id: demo.id,
          species: demo.name,
          variety: null,
          locality: demo.locality,
          formation: demo.formation,
          matrix: demo.matrix,
          dims: demo.dims,
          provenance: demo.provenance,
          rarity: demo.rarity,
          condition: null,
          est_value_cents: demo.value * 100,
        }
      : null,
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase.from("specimens").select("*").eq("id", id).single();
        if (data) setRow(data as Specimen);
      })();
    }, [id]),
  );

  const remove = () => {
    if (demo && !row?.est_value_cents) {
      router.back();
      return;
    }
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

  if (!row && !demo) {
    return (
      <Screen>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </Screen>
    );
  }

  const s = demo ?? {
    name: row!.species,
    locality: row!.locality ?? "",
    value: Math.round((row!.est_value_cents ?? 0) / 100),
    swatch: ["#8A8078", "#4E463E"] as [string, string],
    rarity: row!.rarity ?? "—",
    range: "—",
    comps: 0,
    formation: row!.formation ?? "—",
    matrix: row!.matrix ?? "—",
    dims: typeof row!.dims === "string" ? row!.dims : "—",
    provenance: row!.provenance ?? "—",
    acquired: "—",
  };

  const fields = [
    { k: "Formation", v: s.formation },
    { k: "Matrix", v: s.matrix },
    { k: "Dimensions", v: s.dims },
    { k: "Provenance", v: s.provenance },
    { k: "Acquired", v: "acquired" in s ? s.acquired : "—" },
  ];

  const similar = DEMO_LISTINGS.filter((l) =>
    l.name.toLowerCase().includes(s.name.split(" ")[0].toLowerCase()),
  ).slice(0, 2);
  const buySimilar =
    similar.length > 0
      ? similar
      : DEMO_LISTINGS.slice(0, 2);

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            alignSelf: "flex-start",
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.white,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: "InstrumentSans_500Medium" }}>← Collection</Text>
        </Pressable>

        <Swatch colors={s.swatch} style={{ height: 200, borderRadius: 22 }} />

        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ flex: 1, fontFamily: "InstrumentSerif_400Regular", fontSize: 32, lineHeight: 36, color: colors.ink }}>
              {s.name}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 6,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 14,
                backgroundColor: colors.surfaceSoft,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: "InstrumentSans_600SemiBold", color: colors.primary }}>
                {s.rarity}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14.5, color: colors.muted, marginTop: 4 }}>{s.locality}</Text>
        </View>

        <View style={{ backgroundColor: colors.primaryHover, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.4, color: colors.sageMist }}>
            Estimated value
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 32, color: colors.cream }}>
              {money(s.value)}
            </Text>
            <Text style={{ fontSize: 13.5, color: colors.sageMist }}>range {s.range}</Text>
          </View>
          <Text style={{ fontSize: 12.5, color: colors.mint, marginTop: 4 }}>
            Based on {s.comps} logged purchases of similar pieces
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            paddingHorizontal: 18,
          }}
        >
          {fields.map((f, i) => (
            <View
              key={f.k}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 16,
                paddingVertical: 11,
                borderBottomWidth: i < fields.length - 1 ? 1 : 0,
                borderBottomColor: colors.borderSoft,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 14.5 }}>{f.k}</Text>
              <Text style={{ flex: 1, textAlign: "right", fontFamily: "InstrumentSans_500Medium", fontSize: 14.5 }}>
                {f.v}
              </Text>
            </View>
          ))}
        </View>

        <View>
          <Text style={{ fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: colors.faint, marginBottom: 10 }}>
            Buy similar
          </Text>
          <View style={{ gap: 10 }}>
            {buySimilar.map((b) => {
              const seller = DEMO_SELLERS[b.sellerId];
              return (
                <Pressable
                  key={b.id}
                  onPress={() => router.push(`/listing/${b.id}`)}
                  style={{
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seller.tierColor }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14.5 }}>{seller.name}</Text>
                    <Text style={{ fontSize: 12.5, color: colors.muted }}>
                      {seller.tier} · credibility {seller.score}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.primary }}>
                    from {money(b.price)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!demo && <Button label="Delete" variant="danger" onPress={remove} />}
      </ScrollView>
    </Screen>
  );
}
