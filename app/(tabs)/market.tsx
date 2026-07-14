import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Eyebrow } from "@/components/ui";
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
  const [rows, setRows] = useState<Listing[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select("id, title, species, locality, price_cents, sellers(credibility_score, tier)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(40);
        setRows((data as unknown as Listing[]) ?? []);
      })();
    }, []),
  );

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md, gap: space.xs }}>
            <Text style={type.h1}>Marketplace</Text>
            <Text style={type.caption}>
              Listings from sellers with credibility scores. Escrow shipping in Phase 4.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>
              No active listings yet. Seller onboarding and escrow ship in Phase 4.
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
                <Text style={type.body}>${(item.price_cents / 100).toLocaleString()}</Text>
              </View>
              {item.sellers?.credibility_score != null && (
                <Text style={type.caption}>
                  Seller {item.sellers.credibility_score.toFixed(1)}/10 · {item.sellers.tier}
                </Text>
              )}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
