import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Eyebrow } from "@/components/ui";
import { TIER_COLOR, TIER_LABEL } from "@/constants/copy";
import { colors, space, type } from "@/constants/theme";

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

const BARS = [
  { label: "Locality as described", pct: 92 },
  { label: "Treatments disclosed", pct: 95 },
  { label: "Photos matched the piece", pct: 90 },
];

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

  const tier = seller.tier ?? "self_certified";
  const score = seller.credibility_score ?? 0;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              borderWidth: 3,
              borderColor: TIER_COLOR[tier] ?? colors.faint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 32, color: colors.ink }}>
              {score.toFixed(1)}
            </Text>
          </View>
          <Text style={type.h1}>{seller.business_name ?? "Seller"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: TIER_COLOR[tier] ?? colors.faint }} />
            <Text style={type.caption}>
              {TIER_LABEL[tier] ?? tier} · {seller.ratings_count ?? 0} ratings
            </Text>
          </View>
        </View>

        <Card>
          <Eyebrow>Accuracy breakdown</Eyebrow>
          {BARS.map((b) => (
            <View key={b.label} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ ...type.caption, color: colors.ink }}>{b.label}</Text>
                <Text style={type.caption}>{b.pct}%</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.chip }}>
                <View
                  style={{
                    width: `${b.pct}%`,
                    height: "100%",
                    borderRadius: 3,
                    backgroundColor: colors.success,
                  }}
                />
              </View>
            </View>
          ))}
        </Card>

        <Text style={type.h2}>Recent ratings</Text>
        {ratings.length === 0 ? (
          <Card>
            <Text style={type.body}>No ratings yet.</Text>
          </Card>
        ) : (
          ratings.map((r) => (
            <Card key={r.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", color: colors.ink }}>
                  {r.accuracy.replaceAll("_", " ")}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.successSoft,
                    borderRadius: 10,
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ color: colors.success, fontSize: 11.5, fontFamily: "InstrumentSans_600SemiBold" }}>
                    {r.accuracy === "as_described" ? "As described" : r.accuracy.replaceAll("_", " ")}
                  </Text>
                </View>
              </View>
              <Text style={{ ...type.caption, marginTop: 4 }}>
                {r.photo_match ? "Photo match confirmed ✓" : "Photos did not quite match"}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
