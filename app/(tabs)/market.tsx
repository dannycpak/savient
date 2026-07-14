import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Swatch } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { DEMO_LISTINGS, DEMO_SELLERS } from "@/constants/demo";
import { colors, money } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  species: string;
  locality: string | null;
  price_cents: number;
  sellers?: { credibility_score: number | null; tier: string | null; business_name?: string | null } | null;
};

export default function Market() {
  const { width } = useWindowDimensions();
  const gap = 12;
  const pad = 20;
  const cardW = (width - pad * 2 - gap) / 2;
  const [rows, setRows] = useState<
    {
      id: string;
      name: string;
      priceLabel: string;
      seller: string;
      score: string;
      tierColor: string;
      swatch: [string, string];
    }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select("id, title, species, locality, price_cents, sellers(credibility_score, tier, business_name)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(40);
        const live = (data as unknown as Listing[]) ?? [];
        if (live.length > 0) {
          setRows(
            live.map((l) => ({
              id: l.id,
              name: l.title || l.species,
              priceLabel: money(l.price_cents / 100),
              seller: l.sellers?.business_name ?? "Seller",
              score: (l.sellers?.credibility_score ?? 0).toFixed(1),
              tierColor: "#3E7A4E",
              swatch: (DEMO_LISTINGS.find((d) => d.name === l.title)?.swatch ??
                ["#8A8078", "#4E463E"]) as [string, string],
            })),
          );
        } else {
          setRows(
            DEMO_LISTINGS.map((l) => {
              const seller = DEMO_SELLERS[l.sellerId];
              return {
                id: l.id,
                name: l.name,
                priceLabel: money(l.price),
                seller: seller.name,
                score: seller.score,
                tierColor: seller.tierColor,
                swatch: l.swatch,
              };
            }),
          );
        }
      })();
    }, []),
  );

  return (
    <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ paddingHorizontal: pad, paddingTop: 16, paddingBottom: 32, gap }}
        ListHeaderComponent={
          <View style={{ gap: 6, marginBottom: 8 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.ink }}>
              Marketplace
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 6 }}>{COPY.marketSub}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/listing/${item.id}`)}
            style={{
              width: cardW,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Swatch colors={item.swatch} style={{ height: 110, width: "100%" }} />
            <View style={{ padding: 12 }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 16.5, color: colors.ink }}>
                {item.name}
              </Text>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, marginTop: 2 }}>
                {item.priceLabel}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.tierColor }} />
                <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, flex: 1 }}>
                  {item.seller} · {item.score}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
