import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { SellerBadge } from "@/components/SellerBadge";
import { SearchField } from "@/components/InventoryControls";
import { formatMoney } from "@/lib/format";
import { space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  species: string;
  locality: string | null;
  price_cents: number;
  sellers?: { credibility_score: number | null; tier: string | null } | null;
};

export default function Market() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [rows, setRows] = useState<Listing[]>([]);
  const [query, setQuery] = useState(q ?? "");

  useFocusEffect(
    useCallback(() => {
      if (q) setQuery(q);
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select("id, title, species, locality, price_cents, sellers(credibility_score, tier)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(80);
        setRows((data as unknown as Listing[]) ?? []);
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
    <Screen style={{ paddingBottom: 0 }}>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md, gap: space.sm }}>
            <Text style={type.h1}>Marketplace</Text>
            <Text style={type.caption}>
              Credibility-backed listings. Payment held in escrow until delivery.
            </Text>
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
          <Pressable onPress={() => router.push(`/listing/${item.id}`)}>
            <Card>
              <Eyebrow>{item.species}</Eyebrow>
              <Text style={type.h2}>{item.title}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={type.caption}>{item.locality ?? "Locality unknown"}</Text>
                <Text style={type.body}>{formatMoney(item.price_cents)}</Text>
              </View>
              <SellerBadge score={item.sellers?.credibility_score} tier={item.sellers?.tier} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
