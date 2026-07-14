import { useCallback, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

export default function Billing() {
  const [plan, setPlan] = useState<"free" | "plus">("free");
  const [credits, setCredits] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
        const { data: bal } = await supabase.rpc("credits_balance");
        if (typeof bal === "number") setCredits(bal);
      })();
    }, []),
  );

  const manage = () => {
    const url =
      Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
    Linking.openURL(url);
  };

  return (
    <Screen style={{ gap: space.md, paddingTop: space.md }}>
      <Text style={type.h1}>Billing & payments</Text>
      <Card>
        <Eyebrow>Plan</Eyebrow>
        <Text style={type.h2}>{plan === "plus" ? "Sage+" : "Free"}</Text>
        <Text style={type.caption}>
          {plan === "plus"
            ? "Unlimited Visual Checks & cataloging. Cancel anytime in the App Store / Play subscription settings."
            : "3 Visual Checks / month · 25 specimen catalog"}
        </Text>
        <Text style={type.caption}>{credits} Visual Check credits on hand (never expire)</Text>
      </Card>
      {plan !== "plus" ? (
        <Button label="Go unlimited with Sage+" onPress={() => router.push("/paywall")} />
      ) : (
        <Button label="Cancel subscription" variant="ghost" onPress={manage} />
      )}
      <Button label="Buy credit packs" variant="ghost" onPress={() => router.push("/paywall")} />
      <Button label="Manage payment method" variant="ghost" onPress={manage} />
      <Text style={type.caption}>
        Digital goods (Sage+, credits) use App Store / Play Billing via RevenueCat. Marketplace
        specimen purchases use Stripe Connect escrow separately.
      </Text>
    </Screen>
  );
}
