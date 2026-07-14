import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen } from "@/components/ui";
import { DEMO_SELLERS } from "@/constants/demo";
import { colors } from "@/constants/theme";

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
  const demo = DEMO_SELLERS[id] ?? Object.values(DEMO_SELLERS).find((s) => s.id === id);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase.from("sellers").select("*").eq("id", id).single();
        if (data) setSeller(data as Seller);
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

  const name = seller?.business_name ?? demo?.name ?? "Seller";
  const score = seller?.credibility_score?.toFixed(1) ?? demo?.score ?? "—";
  const tier = seller?.tier ?? demo?.tier ?? "Self-Certified";
  const tierColor = demo?.tierColor ?? "#98938A";
  const ratingsCount = seller?.ratings_count ?? demo?.ratings ?? 0;
  const bars = demo?.bars ?? [
    { label: "Locality as described", pct: 90 },
    { label: "Treatments disclosed", pct: 90 },
    { label: "Photos matched the piece", pct: 90 },
  ];
  const reviews =
    demo?.reviews ??
    ratings.map((r) => ({
      item: "Purchase",
      verdict: r.accuracy.replaceAll("_", " "),
      quote: r.photo_match ? "Photo match confirmed." : "Photos did not quite match.",
    }));

  if (!seller && !demo) {
    return (
      <Screen>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </Screen>
    );
  }

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
          <Text style={{ fontSize: 14, fontFamily: "InstrumentSans_500Medium" }}>← Back</Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: colors.primaryHover,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.cream, lineHeight: 30 }}>
              {score}
            </Text>
            <Text style={{ fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase", color: colors.sageMist }}>
              score
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.ink }}>{name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: tierColor }} />
              <Text style={{ fontSize: 13.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.primary }}>
                {tier}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
              {ratingsCount} material-accuracy ratings
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.surfaceSoft,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.primary, lineHeight: 18 }}>
            Scores measure material accuracy only — was the piece what the listing said it was — never general vibes.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 18,
            gap: 14,
          }}
        >
          {bars.map((bar) => (
            <View key={bar.label}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 13.5 }}>{bar.label}</Text>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 13.5 }}>{bar.pct}%</Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.borderSoft }}>
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    width: `${bar.pct}%`,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        <View>
          <Text
            style={{
              fontSize: 13,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: colors.faint,
              marginBottom: 10,
            }}
          >
            Recent ratings
          </Text>
          <View style={{ gap: 10 }}>
            {reviews.map((r) => (
              <View
                key={r.item + r.verdict}
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Text style={{ flex: 1, fontFamily: "InstrumentSans_600SemiBold", fontSize: 14 }}>{r.item}</Text>
                  <View
                    style={{
                      backgroundColor: colors.successSoft,
                      borderRadius: 10,
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.success }}>
                      {r.verdict}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13.5, color: colors.muted, marginTop: 6, lineHeight: 19 }}>“{r.quote}”</Text>
                <Text style={{ fontSize: 12, color: colors.faint, marginTop: 6 }}>Photo match confirmed ✓</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
