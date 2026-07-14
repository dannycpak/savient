import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { Swatch } from "@/components/Swatch";
import { TIER_COLOR, TIER_LABEL } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  species: string;
  locality: string | null;
  price_cents: number;
  seller_id: string;
  photo_verified?: boolean;
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
            "id, title, description, species, locality, price_cents, seller_id, photo_verified, sellers(business_name, credibility_score, tier)",
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

  const tier = row.sellers?.tier ?? "self_certified";

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}>
        <Swatch name={row.species || row.title} height={220} rounded={radius.lg} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Eyebrow>{row.species}</Eyebrow>
          {row.photo_verified !== false && (
            <View style={{ backgroundColor: colors.successSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: colors.success, fontSize: 11.5, fontFamily: "InstrumentSans_600SemiBold" }}>
                Photo-verified
              </Text>
            </View>
          )}
        </View>
        <Text style={type.h1}>{row.title}</Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 36, color: colors.ink }}>
          ${(row.price_cents / 100).toLocaleString()}
        </Text>
        <Text style={type.body}>{row.description ?? "No description."}</Text>
        <Text style={type.caption}>{row.locality ?? "Locality unknown"}</Text>

        <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: TIER_COLOR[tier] ?? colors.faint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", color: colors.ink }}>
              {(row.sellers?.credibility_score ?? 0).toFixed(1)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.h2}>{row.sellers?.business_name ?? "Seller"}</Text>
            <Text style={type.caption}>{TIER_LABEL[tier] ?? tier}</Text>
          </View>
          <Button label="View" variant="ghost" onPress={() => router.push(`/seller/${row.seller_id}`)} />
        </Card>

        <Button label="Buy (coming soon)" onPress={() => router.push(`/checkout/${row.id}`)} />
      </ScrollView>
    </Screen>
  );
}
