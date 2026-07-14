import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { FREE_TIER } from "@/constants/copy";
import { space, type } from "@/constants/theme";

type Profile = {
  display_name: string | null;
  plan: "free" | "plus";
  checks_used_month: number;
  checks_month_key: string | null;
};

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, plan, checks_used_month, checks_month_key")
          .single();
        if (prof) setProfile(prof as Profile);
        const { data: bal } = await supabase.rpc("credits_balance");
        if (typeof bal === "number") setCredits(bal);
      })();
    }, []),
  );

  const checksLeft =
    profile?.plan === "plus"
      ? "Unlimited"
      : Math.max(0, FREE_TIER.checksPerMonth - (profile?.checks_used_month ?? 0)).toString();

  return (
    <Screen style={{ gap: space.md }}>
      <View style={{ gap: space.xs }}>
        <Text style={type.h1}>{profile?.display_name ?? "Collector"}</Text>
        <Text style={type.caption}>Plan: {profile?.plan === "plus" ? "Sage+" : "Free"}</Text>
      </View>

      <Card>
        <Eyebrow>This month</Eyebrow>
        <Text style={type.h2}>{checksLeft} Visual Checks left</Text>
        <Text style={type.caption}>{credits} credit pack checks remaining</Text>
      </Card>

      {profile?.plan !== "plus" && (
        <Button label="Upgrade to Sage+" onPress={() => router.push("/paywall")} />
      )}
      <Button label="Sell on Sage" variant="ghost" onPress={() => router.push("/seller/onboarding")} />
      <Button label="My purchases" variant="ghost" onPress={() => router.push("/account/orders")} />
      <Button label="Account settings" variant="ghost" onPress={() => router.push("/account/settings")} />
      <Button label="Billing" variant="ghost" onPress={() => router.push("/account/billing")} />
    </Screen>
  );
}
