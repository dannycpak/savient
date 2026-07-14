import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { signedPhotoUrl } from "@/lib/photos";
import { SellerBadge } from "@/components/SellerBadge";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  species: string;
  locality: string | null;
  price_cents: number;
  seller_id: string;
  photo_verified: boolean | null;
  sellers?: {
    business_name: string | null;
    credibility_score: number | null;
    tier: string | null;
  } | null;
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<Listing | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

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

        const { data: photos } = await supabase
          .from("listing_photos")
          .select("storage_path, is_primary")
          .eq("listing_id", id)
          .order("is_primary", { ascending: false })
          .limit(1);
        const path = photos?.[0]?.storage_path;
        if (path) {
          try {
            setPhotoUrl(await signedPhotoUrl(path));
          } catch {
            setPhotoUrl(null);
          }
        } else {
          setPhotoUrl(null);
        }
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
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 220, borderRadius: 22 }} />
        ) : null}
        <Eyebrow>{row.species}</Eyebrow>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Text style={[type.h1, { flex: 1 }]}>{row.title}</Text>
          <Text style={type.display}>{formatMoney(row.price_cents)}</Text>
        </View>
        <Text style={type.body}>{row.description ?? "No description."}</Text>
        <Text style={type.caption}>
          {row.locality ?? "Locality unknown"}
          {row.photo_verified ? " · Photo-verified listing" : ""}
        </Text>

        <Card>
          <Eyebrow>Seller</Eyebrow>
          <Text style={type.h2}>{row.sellers?.business_name ?? "Seller"}</Text>
          <SellerBadge score={row.sellers?.credibility_score} tier={row.sellers?.tier} />
          <Button
            label="View seller"
            variant="ghost"
            onPress={() => router.push(`/seller/${row.seller_id}`)}
          />
        </Card>

        <Button label={`Buy — ${formatMoney(row.price_cents)}`} onPress={() => router.push(`/checkout/${row.id}`)} />
        <Text style={[type.caption, { textAlign: "center" }]}>
          Payment held until you confirm delivery. Disputes reviewed by a human.
        </Text>
      </ScrollView>
    </Screen>
  );
}
