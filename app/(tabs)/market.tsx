import { Text, View } from "react-native";
import { Screen, Card, Eyebrow, Button } from "@/components/ui";
import { space, type } from "@/constants/theme";
import { router } from "expo-router";

/**
 * Marketplace escrow (Stripe Connect) is Phase 4.
 * For first App Store / Play submission we surface a calm "coming soon" instead of
 * broken Buy / escrow flows that would fail review.
 */
export default function Market() {
  return (
    <Screen style={{ justifyContent: "center", gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={type.h1}>Marketplace</Text>
        <Text style={type.body}>
          Escrow trading and seller credibility open after the catalog and Visual Check foundations
          are solid.
        </Text>
      </View>
      <Card>
        <Eyebrow>Coming soon</Eyebrow>
        <Text style={type.body}>
          Seller Connect onboarding, destination-charge escrow, tracked shipping, and accuracy
          ratings ship in a later release.
        </Text>
      </Card>
      <Button label="Run a Visual Check" onPress={() => router.push("/(tabs)/check")} />
      <Button label="Browse your catalog" variant="ghost" onPress={() => router.push("/(tabs)/catalog")} />
    </Screen>
  );
}
