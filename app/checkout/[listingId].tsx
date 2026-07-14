import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

export default function Checkout() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    try {
      const res = await api.createOrder(listingId);
      setOrderId(res.order_id);
      setClientSecret(res.client_secret);
      Alert.alert(
        "Payment held in escrow",
        "Authorize with Stripe PaymentSheet in the production build. Order created — funds capture on delivery confirm.",
      );
    } catch (e) {
      Alert.alert(
        "Checkout unavailable",
        e instanceof ApiError ? e.message : "Could not create order.",
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
        <Text style={type.caption}>
          Tracked shipping required. Funds release on confirm or auto after 7 days of tracked delivery.
        </Text>
      </Card>
      <Button label="Authorize payment" onPress={start} loading={busy} />
      {orderId && (
        <View style={{ gap: space.sm }}>
          <Text style={type.caption}>Order {orderId}</Text>
          {clientSecret && (
            <Text style={type.caption}>PaymentIntent ready (client_secret received).</Text>
          )}
          <Button
            label="My purchases"
            variant="ghost"
            onPress={() => router.push("/account/orders")}
          />
        </View>
      )}
    </Screen>
  );
}
