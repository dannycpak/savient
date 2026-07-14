import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { CapacityMeter } from "@/components/InventoryControls";
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
  const [specimenCount, setSpecimenCount] = useState(0);
  const [checkCount, setCheckCount] = useState(0);

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
        const { count: sc } = await supabase
          .from("specimens")
          .select("id", { count: "exact", head: true });
        setSpecimenCount(sc ?? 0);
        const { count: cc } = await supabase
          .from("visual_checks")
          .select("id", { count: "exact", head: true });
        setCheckCount(cc ?? 0);
      })();
    }, []),
  );

  const plus = profile?.plan === "plus";
  const used = profile?.checks_used_month ?? 0;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={{ gap: space.xs }}>
          <Text style={type.h1}>{profile?.display_name ?? "Collector"}</Text>
          <Text style={type.caption}>Plan: {plus ? "Sage+" : "Free"}</Text>
        </View>

        <Card>
          <Eyebrow>This month</Eyebrow>
          <CapacityMeter
            used={used}
            cap={plus ? null : FREE_TIER.checksPerMonth}
            label={plus ? "Unlimited Visual Checks" : "Free Visual Checks"}
          />
          <Text style={type.caption}>{credits} credit-pack checks remaining</Text>
          <Text style={type.caption}>
            {specimenCount} specimens · {checkCount} checks lifetime
          </Text>
        </Card>

        {!plus && <Button label="Upgrade to Sage+" onPress={() => router.push("/paywall")} />}
        <Button label="My collection" variant="ghost" onPress={() => router.push("/(tabs)/catalog")} />
        <Button label="Check history" variant="ghost" onPress={() => router.push("/check/history")} />
        <Button
          label="Collection analytics"
          variant="ghost"
          onPress={() => (plus ? router.push("/inventory/analytics") : router.push("/paywall"))}
        />
        <Button label="Sell on Sage" variant="ghost" onPress={() => router.push("/seller/onboarding")} />
        <Button label="My purchases" variant="ghost" onPress={() => router.push("/account/orders")} />
        <Button label="Account settings" variant="ghost" onPress={() => router.push("/account/settings")} />
        <Button label="Billing" variant="ghost" onPress={() => router.push("/account/billing")} />
      </ScrollView>
    </Screen>
  );
}
