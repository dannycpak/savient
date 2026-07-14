import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

type Seller = {
  id: string;
  business_name: string | null;
  tier: string | null;
  credibility_score: number | null;
  ratings_count: number | null;
};

type Rating = {
  id: string;
  accuracy: string;
  photo_match: boolean;
  created_at: string;
};

export default function SellerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase.from("sellers").select("*").eq("id", id).single();
        setSeller((data as Seller) ?? null);
        const { data: rs } = await supabase
          .from("ratings")
          .select("id, accuracy, photo_match, created_at")
          .eq("seller_id", id)
          .order("created_at", { ascending: false })
          .limit(20);
        setRatings((rs as Rating[]) ?? []);
      })();
    }, [id]),
  );

  if (!seller) {
    return (
      <Screen>
        <Text style={type.body}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>{seller.business_name ?? "Seller"}</Text>
        <Card>
          <Eyebrow>Credibility</Eyebrow>
          <Text style={type.display}>{(seller.credibility_score ?? 0).toFixed(1)}/10</Text>
          <Text style={type.caption}>
            {seller.tier ?? "self_certified"} · {seller.ratings_count ?? 0} ratings
          </Text>
        </Card>
        <Text style={type.h2}>Recent ratings</Text>
        {ratings.length === 0 ? (
          <Card>
            <Text style={type.body}>No ratings yet.</Text>
          </Card>
        ) : (
          ratings.map((r) => (
            <Card key={r.id}>
              <Text style={type.body}>Accuracy: {r.accuracy.replaceAll("_", " ")}</Text>
              <Text style={type.caption}>
                Photos matched: {r.photo_match ? "Yes" : "Not quite"}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
