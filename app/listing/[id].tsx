import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { SellerBadge } from "@/components/SellerBadge";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  species: string;
  locality: string | null;
  price_cents: number;
  seller_id: string;
  sellers?: {
    business_name: string | null;
    credibility_score: number | null;
    tier: string | null;
  } | null;
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<Listing | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select(
            "id, title, description, species, locality, price_cents, seller_id, sellers(business_name, credibility_score, tier)",
          )
          .eq("id", id)
          .single();
        setRow((data as unknown as Listing) ?? null);
      })();
    }, [id]),
  );

  if (!row) {
    return (
      <Screen>
        <Text style={type.body}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Eyebrow>{row.species}</Eyebrow>
        <Text style={type.h1}>{row.title}</Text>
        <Text style={type.display}>${(row.price_cents / 100).toLocaleString()}</Text>
        <Text style={type.body}>{row.description ?? "No description."}</Text>
        <Text style={type.caption}>{row.locality ?? "Locality unknown"}</Text>

        <Card>
          <Eyebrow>Seller</Eyebrow>
          <Text style={type.h2}>{row.sellers?.business_name ?? "Seller"}</Text>
          <SellerBadge
            score={row.sellers?.credibility_score}
            tier={row.sellers?.tier}
          />
          <Button
            label="View seller"
            variant="ghost"
            onPress={() => router.push(`/seller/${row.seller_id}`)}
          />
        </Card>

        <Button label="Buy" onPress={() => router.push(`/checkout/${row.id}`)} />
      </ScrollView>
    </Screen>
  );
}
