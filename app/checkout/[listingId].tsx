import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

export default function Checkout() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    try {
      const res = await api.createOrder(listingId);
      setOrderId(res.order_id);
      Alert.alert(
        "Payment held in escrow",
        "Stripe PaymentSheet wiring lands with Phase 4 Connect onboarding. Order created.",
      );
    } catch (e) {
      Alert.alert(
        "Checkout unavailable",
        e instanceof ApiError ? e.message : "Marketplace escrow ships in Phase 4.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ gap: space.lg }}>
      <Text style={type.h1}>Checkout</Text>
      <Card>
        <Eyebrow>How it works</Eyebrow>
        <Text style={type.body}>Payment held in escrow until you confirm delivery.</Text>
        <Text style={type.caption}>Tracked shipping required. Funds release on confirm or auto after 7 days.</Text>
      </Card>
      <Button label="Authorize payment" onPress={start} loading={busy} />
      {orderId && <Text style={type.caption}>Order {orderId}</Text>}
    </Screen>
  );
}
