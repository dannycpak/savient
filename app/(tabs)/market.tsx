import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { SellerBadge } from "@/components/SellerBadge";
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
          <View style={{ marginBottom: space.md, gap: space.sm }}>
            <Text style={type.h1}>Marketplace</Text>
            <Text style={type.caption}>
              Credibility-backed listings. Payment held in escrow until delivery.
            </Text>
            <Button label="Sell on Sage" variant="ghost" onPress={() => router.push("/seller/onboarding")} />
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>
              No active listings yet. Complete Stripe Connect onboarding to publish.
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
              <SellerBadge
                score={item.sellers?.credibility_score}
                tier={item.sellers?.tier}
              />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
