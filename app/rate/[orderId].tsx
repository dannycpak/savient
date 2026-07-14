import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow, ChipButton } from "@/components/ui";
import { space, type } from "@/constants/theme";

const ACCURACY = [
  { id: "as_described", label: "As described" },
  { id: "minor", label: "Minor differences" },
  { id: "not_as_described", label: "Not as described" },
] as const;

export default function RatePurchase() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [accuracy, setAccuracy] = useState<(typeof ACCURACY)[number]["id"]>("as_described");
  const [photoMatch, setPhotoMatch] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
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
    <Screen style={{ gap: space.lg }}>
      <Text style={type.h1}>Rate purchase</Text>
      <Card>
        <Eyebrow>Material accuracy</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ACCURACY.map((o) => (
            <ChipButton
              key={o.id}
              label={o.label}
              selected={accuracy === o.id}
              onPress={() => setAccuracy(o.id)}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Eyebrow>Photos matched the piece</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <ChipButton label="Yes, matched" selected={photoMatch} onPress={() => setPhotoMatch(true)} />
          <ChipButton label="Not quite" selected={!photoMatch} onPress={() => setPhotoMatch(false)} />
        </View>
      </Card>
      <Button label="Submit rating" onPress={submit} loading={busy} />
    </Screen>
  );
}
