import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Chip } from "@/components/ui";
import { colors } from "@/constants/theme";

const ACCURACY = [
  { id: "as_described", label: "As described" },
  { id: "minor", label: "Minor differences" },
  { id: "not_as_described", label: "Not as described" },
] as const;

export default function RatePurchase() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const isDemo = !orderId || orderId.startsWith("demo");
  const [accuracy, setAccuracy] = useState<(typeof ACCURACY)[number]["id"] | null>(null);
  const [photoMatch, setPhotoMatch] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!accuracy || photoMatch == null) {
      Alert.alert("Almost there", "Choose accuracy and photo match before submitting.");
      return;
    }
    setBusy(true);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 400));
        Alert.alert("Thanks", "Your rating updates seller credibility.");
        router.back();
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: order } = await supabase
        .from("orders")
        .select("seller_id")
        .eq("id", orderId)
        .single();
      if (!order) throw new Error("Order not found");
      const { error } = await supabase.from("ratings").insert({
        order_id: orderId,
        buyer_id: user.id,
        seller_id: order.seller_id,
        accuracy,
        photo_match: photoMatch,
      });
      if (error) throw error;
      Alert.alert("Thanks", "Your rating updates seller credibility.");
      router.back();
    } catch (e) {
      Alert.alert("Could not submit", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ justifyContent: "flex-end", paddingBottom: 24 }} edges={["top", "left", "right", "bottom"]}>
      <View
        style={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          padding: 24,
          paddingBottom: 16,
        }}
      >
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: colors.ink }}>
          How was the wulfenite?
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
          DesertRock Co. · rated on material accuracy only
        </Text>

        <Text style={{ fontSize: 13, fontFamily: "InstrumentSans_600SemiBold", marginTop: 18, marginBottom: 8 }}>
          Was it what the listing said it was?
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {ACCURACY.map((o) => (
            <Chip key={o.id} label={o.label} selected={accuracy === o.id} onPress={() => setAccuracy(o.id)} />
          ))}
        </View>

        <Text style={{ fontSize: 13, fontFamily: "InstrumentSans_600SemiBold", marginTop: 18, marginBottom: 8 }}>
          Did it match the listing photos?
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label="Yes, matched" selected={photoMatch === true} onPress={() => setPhotoMatch(true)} />
          <Chip label="Not quite" selected={photoMatch === false} onPress={() => setPhotoMatch(false)} />
        </View>

        <Button label="Submit rating" onPress={submit} loading={busy} style={{ marginTop: 22 }} />
      </View>
    </Screen>
  );
}
