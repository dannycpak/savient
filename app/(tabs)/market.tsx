import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { signedPhotoUrl } from "@/lib/photos";
import { Screen, Card, Button, Swatch } from "@/components/ui";
import { SellerBadge } from "@/components/SellerBadge";
import { SearchField } from "@/components/InventoryControls";
import { DEMO_LISTINGS } from "@/constants/demo";
import { formatMoney } from "@/lib/format";
import { colors, space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  species: string;
  locality: string | null;
  price_cents: number;
  photoUrl?: string | null;
  swatch?: [string, string];
  sellers?: { credibility_score: number | null; tier: string | null; business_name?: string | null } | null;
};

export default function Market() {
  const { width } = useWindowDimensions();
  const gap = 12;
  const pad = 20;
  const cardW = (width - pad * 2 - gap) / 2;
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [rows, setRows] = useState<Listing[]>([]);
  const [query, setQuery] = useState(q ?? "");

  useFocusEffect(
    useCallback(() => {
      if (q) setQuery(q);
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select(
            "id, title, species, locality, price_cents, sellers(credibility_score, tier, business_name), listing_photos(storage_path, is_primary)",
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(80);
        const live = (data as unknown as (Listing & {
          listing_photos?: { storage_path: string; is_primary: boolean }[];
        })[]) ?? [];

        if (live.length === 0) {
          setRows(
            DEMO_LISTINGS.map((l) => ({
              id: l.id,
              title: l.name,
              species: l.name.split(",")[0],
              locality: l.locality,
              price_cents: l.price * 100,
              swatch: l.swatch,
              sellers: { credibility_score: 8.5, tier: "documented", business_name: "Demo seller" },
            })),
          );
          return;
        }

        const withPhotos = await Promise.all(
          live.map(async (l) => {
            const primary =
              l.listing_photos?.find((p) => p.is_primary)?.storage_path ??
              l.listing_photos?.[0]?.storage_path;
            let photoUrl: string | null = null;
            if (primary) {
              try {
                photoUrl = await signedPhotoUrl(primary);
              } catch {
                photoUrl = null;
              }
            }
            return { ...l, photoUrl };
          }),
        );
        setRows(withPhotos);
      })();
    }, [q]),
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.species.toLowerCase().includes(needle) ||
        (r.locality ?? "").toLowerCase().includes(needle),
    );
  }, [rows, query]);

  return (
    <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ paddingHorizontal: pad, paddingTop: 16, paddingBottom: 32, gap }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.sm, gap: space.sm }}>
            <Text style={type.h1}>Marketplace</Text>
            <Text style={type.caption}>Every seller credibility-scored. Every listing photo-verified.</Text>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search species, title, locality…"
            />
            <Button label="Sell on Sage" variant="ghost" onPress={() => router.push("/seller/onboarding")} />
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>
              {query
                ? "No listings match your search."
                : "No active listings yet. Complete Stripe Connect onboarding to publish."}
            </Text>
          </Card>
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
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={{ height: 110, width: "100%" }} />
            ) : (
              <Swatch
                colors={item.swatch ?? ["#8A8078", "#4E463E"]}
                style={{ height: 110, width: "100%" }}
              />
            )}
            <View style={{ padding: 12, gap: 4 }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 16.5 }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15 }}>
                {formatMoney(item.price_cents)}
              </Text>
              <SellerBadge score={item.sellers?.credibility_score} tier={item.sellers?.tier} />
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
