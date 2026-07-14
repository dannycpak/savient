import { useCallback, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { colors, radius, space, type } from "@/constants/theme";

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
    <Screen style={{ gap: space.md }}>
      <Text style={type.h1}>Billing</Text>
      <View
        style={{
          backgroundColor: colors.primaryHover,
          borderRadius: radius.lg,
          padding: 20,
          gap: 8,
        }}
      >
        <Eyebrow onDark>Plan</Eyebrow>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.onDark }}>
          {plan === "plus" ? "Sage+" : "Free"}
        </Text>
        <Text style={{ color: colors.onDarkMuted, fontSize: 13.5 }}>
          {credits} Visual Check credits available
        </Text>
      </View>
      <Card>
        <Eyebrow>Payment method</Eyebrow>
        <Text style={type.body}>Managed by Apple / Google via RevenueCat</Text>
        <Text style={type.caption}>Sage never stores card numbers for digital goods.</Text>
      </Card>
      <Button label="Get Sage+ / credits" onPress={() => router.push("/paywall")} />
      <Button label="Manage subscription" variant="ghost" onPress={manage} />
    </Screen>
  );
}
