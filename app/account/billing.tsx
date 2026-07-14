import { useCallback, useState } from "react";
import { Linking, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Platform } from "react-native";
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
    <Screen style={{ gap: space.md }}>
      <Text style={type.h1}>Billing</Text>
      <Card>
        <Eyebrow>Plan</Eyebrow>
        <Text style={type.h2}>{plan === "plus" ? "Sage+" : "Free"}</Text>
        <Text style={type.caption}>{credits} Visual Check credits</Text>
      </Card>
      <Button label="Get Sage+ / credits" onPress={() => router.push("/paywall")} />
      <Button label="Manage subscription" variant="ghost" onPress={manage} />
    </Screen>
  );
}
