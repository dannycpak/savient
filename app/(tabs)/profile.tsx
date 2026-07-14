import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Screen, Button, Avatar, MenuRow } from "@/components/ui";
import { FREE_TIER } from "@/constants/copy";
import { DEMO_SPECIMENS } from "@/constants/demo";
import { colors, money } from "@/constants/theme";

type Profile = {
  display_name: string | null;
  plan: "free" | "plus";
  checks_used_month: number;
};

export default function Profile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState(0);
  const [count, setCount] = useState(DEMO_SPECIMENS.length);
  const [valueCents, setValueCents] = useState(DEMO_SPECIMENS.reduce((s, r) => s + r.value, 0) * 100);
  const email = session?.user?.email ?? "maya@sage.app";

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
        const { data: all } = await supabase.from("specimens").select("est_value_cents");
        const rows = (all as { est_value_cents: number | null }[]) ?? [];
        if (rows.length > 0) {
          setCount(rows.length);
          setValueCents(rows.reduce((s, r) => s + (r.est_value_cents ?? 0), 0));
        }
      })();
    }, []),
  );

  const name = profile?.display_name ?? session?.user?.user_metadata?.display_name ?? "Maya Chen";
  const isPlus = profile?.plan === "plus";
  const checksLeft = isPlus
    ? "Unlimited"
    : String(Math.max(0, FREE_TIER.checksPerMonth - (profile?.checks_used_month ?? 1)));
  const initial = String(name).trim().charAt(0).toUpperCase() || "M";

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    router.replace("/(auth)/login");
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <Avatar initial={initial} size={58} />
          <View>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: colors.ink }}>{name}</Text>
            <Text style={{ fontSize: 13.5, color: colors.muted }}>{email}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { v: String(count), l: "specimens" },
            { v: money(Math.round(valueCents / 100)), l: "est. value" },
            { v: "12", l: "ratings given" },
          ].map((s) => (
            <View
              key={s.l}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 22, color: colors.ink }}>{s.v}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.primaryHover, borderRadius: 18, padding: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: colors.cream }}>
              {isPlus ? "Sage+" : "Free plan"}
            </Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: "rgba(245,242,235,0.15)",
              }}
            >
              <Text style={{ fontSize: 12, color: colors.cream }}>{isPlus ? "Active" : "Limited"}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13.5, color: colors.sageMist, marginTop: 6 }}>
            {isPlus
              ? "Unlimited Visual Checks & cataloging"
              : `${checksLeft} Visual Checks left · ${credits} credits`}
          </Text>
          {isPlus ? (
            <Button
              label="Manage subscription"
              variant="outlineLight"
              onPress={() => router.push("/account/billing")}
              style={{ marginTop: 14, minHeight: 44 }}
            />
          ) : (
            <Button
              label="Go unlimited with Sage+"
              variant="cream"
              onPress={() => router.push("/paywall")}
              style={{ marginTop: 14, minHeight: 44 }}
            />
          )}
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <MenuRow label="Account settings" onPress={() => router.push("/account/settings")} />
          <MenuRow label="Billing & payments" onPress={() => router.push("/account/billing")} />
          <MenuRow label="Notifications" onPress={() => Alert.alert("Notifications", "Coming with Phase 5 push setup.")} />
          <MenuRow
            label="Export my collection"
            onPress={() => Alert.alert("Export", "CSV export ships with launch hardening.")}
          />
          <MenuRow label="Help & safety" last onPress={() => Alert.alert("Help & safety", VISUAL_HELP)} />
        </View>

        <Pressable
          onPress={signOut}
          style={{
            height: 48,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.white,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.danger, fontFamily: "InstrumentSans_600SemiBold", fontSize: 15 }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const VISUAL_HELP =
  "Visual Check is always a second opinion. Marketplace purchases use escrow with tracked shipping and human-reviewed disputes.";
