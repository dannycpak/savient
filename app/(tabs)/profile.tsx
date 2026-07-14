import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { FREE_TIER } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

type Profile = {
  display_name: string | null;
  plan: "free" | "plus";
  checks_used_month: number;
};

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState(0);
  const [specimenCount, setSpecimenCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, plan, checks_used_month")
          .single();
        if (prof) setProfile(prof as Profile);
        const { data: bal } = await supabase.rpc("credits_balance");
        if (typeof bal === "number") setCredits(bal);
        const { count } = await supabase.from("specimens").select("id", { count: "exact", head: true });
        setSpecimenCount(count ?? 0);
      })();
    }, []),
  );

  const checksLeft =
    profile?.plan === "plus"
      ? "∞"
      : String(Math.max(0, FREE_TIER.checksPerMonth - (profile?.checks_used_month ?? 0)));

  const initial = (profile?.display_name?.[0] ?? "S").toUpperCase();

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.onDark, fontSize: 22, fontFamily: "InstrumentSans_600SemiBold" }}>
              {initial}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={type.h1}>{profile?.display_name ?? "Collector"}</Text>
            <Text style={type.caption}>{profile?.plan === "plus" ? "Sage+" : "Free plan"}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Checks left", value: checksLeft },
            { label: "Credits", value: String(credits) },
            { label: "Specimens", value: String(specimenCount) },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: colors.ink }}>
                {s.value}
              </Text>
              <Text style={{ ...type.caption, fontSize: 11.5, textAlign: "center" }}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <View
          style={{
            backgroundColor: colors.primaryHover,
            borderRadius: radius.lg,
            padding: 20,
            gap: 10,
          }}
        >
          <Eyebrow onDark>Plan</Eyebrow>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.onDark }}>
            {profile?.plan === "plus" ? "Sage+" : "Free"}
          </Text>
          <Text style={{ color: colors.onDarkMuted, fontSize: 13.5 }}>
            {profile?.plan === "plus"
              ? "Unlimited Visual Checks and unlimited cataloging."
              : `${FREE_TIER.checksPerMonth} Visual Checks/month · ${FREE_TIER.catalogCap}-specimen catalog.`}
          </Text>
          {profile?.plan !== "plus" && (
            <Button label="Go unlimited with Sage+" variant="bone" onPress={() => router.push("/paywall")} />
          )}
          {profile?.plan === "plus" && (
            <Button label="Manage billing" variant="ghost" onPress={() => router.push("/account/billing")} />
          )}
        </View>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          {[
            { label: "Account settings", href: "/account/settings" },
            { label: "Billing & payments", href: "/account/billing" },
          ].map((row, i) => (
            <Pressable
              key={row.label}
              onPress={() => router.push(row.href as "/account/settings")}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderBottomWidth: i === 0 ? 1 : 0,
                borderBottomColor: colors.divider,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={type.body}>{row.label}</Text>
              <Text style={{ color: colors.faint }}>›</Text>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
