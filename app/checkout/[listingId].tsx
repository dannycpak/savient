import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Card, Button, Eyebrow, SuccessMark } from "@/components/ui";
import { colors, radius, space, type } from "@/constants/theme";

/** Marketplace escrow checkout ships with Phase 4 Connect + PaymentSheet. */
export default function Checkout() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const isDemo = (listingId ?? "").startsWith("demo");

  return (
    <Screen style={{ gap: space.lg, justifyContent: "center" }}>
      <Text style={type.h1}>Checkout</Text>
      <Card style={{ borderRadius: radius.sheet }}>
        <Eyebrow>Escrow</Eyebrow>
        <Text style={type.body}>Payment held until you confirm delivery.</Text>
        <Text style={type.caption}>
          Tracked shipping required. Funds release on confirm or auto after 7 days. Disputes reviewed by a human.
        </Text>
      </Card>
      <View
        style={{
          backgroundColor: colors.amberBg,
          borderColor: colors.amberBorder,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: 16,
          gap: 8,
        }}
      >
        <Text style={{ ...type.h2, color: colors.amberText }}>Coming soon</Text>
        <Text style={{ ...type.caption, color: colors.amberText }}>
          {isDemo
            ? "This preview listing isn’t available to purchase yet."
            : "Stripe Connect escrow isn’t enabled in this release."}
        </Text>
      </View>
      <SuccessMark />
      <Button label="Back to market" onPress={() => router.replace("/(tabs)/market")} />
      <Button label="Browse collection" variant="ghost" onPress={() => router.replace("/(tabs)/catalog")} />
    </Screen>
  );
}
