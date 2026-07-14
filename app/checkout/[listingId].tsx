import { Text } from "react-native";
import { router } from "expo-router";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

/** Marketplace checkout ships with Phase 4 Connect + PaymentSheet. */
export default function Checkout() {
  return (
    <Screen style={{ gap: space.lg, justifyContent: "center" }}>
      <Text style={type.h1}>Checkout</Text>
      <Card>
        <Eyebrow>Coming soon</Eyebrow>
        <Text style={type.body}>
          Escrow checkout (Stripe Connect, manual capture) is not enabled in this release.
        </Text>
      </Card>
      <Button label="Back to catalog" onPress={() => router.replace("/(tabs)/catalog")} />
    </Screen>
  );
}
