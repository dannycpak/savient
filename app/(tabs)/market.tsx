import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Eyebrow } from "@/components/ui";
import { Swatch } from "@/components/Swatch";
import { COPY, DEMO_LISTINGS, TIER_COLOR, TIER_LABEL } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  species: string;
  locality: string | null;
  price_cents: number;
  demo?: boolean;
  rangeNote?: string;
  sellers?: { credibility_score: number | null; tier: string | null; business_name?: string | null } | null;
};

export default function Market() {
  const [live, setLive] = useState<Listing[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select("id, title, species, locality, price_cents, sellers(credibility_score, tier, business_name)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(40);
        setLive((data as unknown as Listing[]) ?? []);
      })();
    }, []),
  );

  const rows = useMemo<Listing[]>(() => {
    if (live.length > 0) return live;
    return DEMO_LISTINGS.map((d) => ({
      id: d.id,
      title: d.title,
      species: d.species,
      locality: d.locality,
      price_cents: d.price_cents,
      demo: true,
      rangeNote: d.rangeNote,
      sellers: {
        credibility_score: d.seller.score,
        tier: d.seller.tier,
        business_name: d.seller.name,
      },
    }));
  }, [live]);

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: space.xxl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md, gap: 6 }}>
            <Text style={type.h1}>Marketplace</Text>
            <Text style={type.caption}>{COPY.marketSub}</Text>
            {live.length === 0 && (
              <Text style={{ ...type.caption, color: colors.amberText }}>
                Preview listings — escrow checkout opens in a later release.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              if (item.demo) router.push("/checkout/demo");
              else router.push(`/listing/${item.id}`);
            }}
          >
            <Card style={{ padding: 10, gap: 8 }}>
              <Swatch name={item.species || item.title} height={110} rounded={radius.md} />
              <Eyebrow>{item.species}</Eyebrow>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 14.5, color: colors.ink }} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={type.caption} numberOfLines={1}>
                {item.locality ?? "Locality unknown"}
              </Text>
              <Text style={type.body}>${(item.price_cents / 100).toLocaleString()}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: TIER_COLOR[item.sellers?.tier ?? "self_certified"] ?? colors.faint,
                  }}
                />
                <Text style={{ ...type.caption, fontSize: 11.5 }} numberOfLines={1}>
                  {item.sellers?.credibility_score?.toFixed(1) ?? "—"} ·{" "}
                  {TIER_LABEL[item.sellers?.tier ?? ""] ?? item.sellers?.tier ?? "Seller"}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
