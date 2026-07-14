import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Swatch } from "@/components/ui";
import { IconCheck, IconChevron } from "@/components/icons";
import { DEMO_LISTINGS, DEMO_SELLERS } from "@/constants/demo";
import { colors, money } from "@/constants/theme";

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
  const demo = DEMO_LISTINGS.find((l) => l.id === id);
  const demoSeller = demo ? DEMO_SELLERS[demo.sellerId] : null;
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
        if (data) setRow(data as unknown as Listing);
      })();
    }, [id]),
  );

  const name = row?.title ?? demo?.name ?? "Listing";
  const locality = row?.locality ?? demo?.locality ?? "";
  const price = row ? row.price_cents / 100 : demo?.price ?? 0;
  const swatch = demo?.swatch ?? (["#8A8078", "#4E463E"] as [string, string]);
  const sellerName = row?.sellers?.business_name ?? demoSeller?.name ?? "Seller";
  const score = row?.sellers?.credibility_score?.toFixed(1) ?? demoSeller?.score ?? "—";
  const tier = row?.sellers?.tier ?? demoSeller?.tier ?? "Self-Certified";
  const tierColor = demoSeller?.tierColor ?? "#98938A";
  const ratings = demoSeller?.ratings ?? 0;
  const rangeNote = demo?.rangeNote ?? "typical for this size";
  const sellerId = row?.seller_id ?? demo?.sellerId ?? "cascade";

  if (!row && !demo) {
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
          <Text style={{ fontSize: 14, fontFamily: "InstrumentSans_500Medium" }}>← Marketplace</Text>
        </Pressable>

        <View style={{ height: 220, borderRadius: 22, overflow: "hidden" }}>
          <Swatch colors={swatch} style={{ flex: 1 }}>
            <View
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                backgroundColor: "rgba(255,255,255,0.92)",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <IconCheck color={colors.success} size={12} />
              <Text style={{ fontSize: 11.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.ink }}>
                Photo-verified listing
              </Text>
            </View>
          </Swatch>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 30, lineHeight: 34, color: colors.ink }}>
              {name}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{locality}</Text>
          </View>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 30, color: colors.ink }}>
            {money(price)}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surfaceSoft,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, color: colors.primary, flex: 1, lineHeight: 18 }}>
            Priced within the typical range for this species & size — {rangeNote}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push(`/seller/${sellerId}`)}
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: colors.primaryHover,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 19, color: colors.cream }}>{score}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15.5 }}>{sellerName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tierColor }} />
              <Text style={{ fontSize: 12.5, color: colors.muted }}>
                {tier} · {ratings} accuracy ratings
              </Text>
            </View>
          </View>
          <IconChevron />
        </Pressable>

        <Button label={`Buy — ${money(price)}`} onPress={() => router.push(`/checkout/${id}`)} />
        <Text style={{ fontSize: 12.5, color: colors.faint, textAlign: "center", marginTop: -6 }}>
          Payment held until you confirm delivery. Disputes reviewed by a human.
        </Text>
      </ScrollView>
    </Screen>
  );
}
