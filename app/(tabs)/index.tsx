import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Screen, Button, Avatar } from "@/components/ui";
import { IconCamera, IconChevron, IconSparkline } from "@/components/icons";
import { DEMO_ACTIVITY, DEMO_SPECIMENS } from "@/constants/demo";
import { FREE_TIER } from "@/constants/copy";
import { colors, money } from "@/constants/theme";

export default function Home() {
  const { session } = useAuth();
  const [valueCents, setValueCents] = useState(0);
  const [count, setCount] = useState(0);
  const [checksUsed, setChecksUsed] = useState(1);
  const [name, setName] = useState("Maya");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: all } = await supabase.from("specimens").select("est_value_cents");
        const rows = (all as { est_value_cents: number | null }[]) ?? [];
        if (rows.length > 0) {
          setCount(rows.length);
          setValueCents(rows.reduce((s, r) => s + (r.est_value_cents ?? 0), 0));
        } else {
          setCount(DEMO_SPECIMENS.length);
          setValueCents(DEMO_SPECIMENS.reduce((s, r) => s + r.value, 0) * 100);
        }
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, checks_used_month")
          .single();
        if (prof?.display_name) setName(String(prof.display_name).split(" ")[0]);
        else if (session?.user?.user_metadata?.display_name) {
          setName(String(session.user.user_metadata.display_name).split(" ")[0]);
        }
        if (typeof prof?.checks_used_month === "number") setChecksUsed(prof.checks_used_month);
      })();
    }, [session]),
  );

  const value = valueCents >= 100 ? money(Math.round(valueCents / 100)) : money(4775);
  const checksLeft = Math.max(0, FREE_TIER.checksPerMonth - checksUsed);
  const initial = (name?.[0] ?? "M").toUpperCase();

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.ink }}>Sage</Text>
          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            <Avatar initial={initial} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 15, color: colors.muted, marginTop: -6, fontFamily: "InstrumentSans_400Regular" }}>
          Good morning, {name} — the shelf is looking great.
        </Text>

        <Pressable
          onPress={() => router.push("/(tabs)/catalog")}
          style={{ backgroundColor: colors.primaryHover, borderRadius: 20, padding: 22 }}
        >
          <Text style={{ fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: colors.sageMist }}>
            Collection value
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 6 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 42, color: colors.cream }}>
              {value}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: "InstrumentSans_600SemiBold", color: colors.mint }}>+$180</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 }}>
            <Text style={{ fontSize: 14, color: colors.sageMist }}>{count || DEMO_SPECIMENS.length} specimens</Text>
            <IconSparkline />
          </View>
        </Pressable>

        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            padding: 20,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: colors.surfaceSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCamera color={colors.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: colors.ink }}>
                Eyeing a purchase?
              </Text>
              <Text style={{ fontSize: 13.5, color: colors.muted }}>Get a second opinion in seconds.</Text>
            </View>
          </View>
          <Button label="Run a Visual Check" onPress={() => router.push("/(tabs)/check")} style={{ minHeight: 48 }} />
          <Text style={{ fontSize: 12.5, color: colors.faint, textAlign: "center" }}>
            {checksLeft} free Visual Checks left this month
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/rate/demo-wulfenite")}
          style={{
            backgroundColor: colors.surfaceWarm,
            borderWidth: 1,
            borderColor: "#EBDDBE",
            borderRadius: 20,
            paddingVertical: 18,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#D9903F",
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: colors.ink }}>
              Rate your wulfenite purchase
            </Text>
            <Text style={{ fontSize: 13, color: "#8A7A4F" }}>DesertRock Co. · 30 seconds, keeps scores honest</Text>
          </View>
          <IconChevron color="#8A7A4F" />
        </Pressable>

        <View>
          <Text style={{ fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: colors.faint, marginVertical: 6 }}>
            Recent activity
          </Text>
          <View
            style={{
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {DEMO_ACTIVITY.map((a, i) => (
              <View
                key={a.label}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderBottomWidth: i < DEMO_ACTIVITY.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderSoft,
                }}
              >
                <Text style={{ fontSize: 14.5, color: colors.ink, flex: 1, paddingRight: 12 }}>{a.label}</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: a.tone === "up" ? "InstrumentSans_600SemiBold" : "InstrumentSans_400Regular",
                    color: a.tone === "up" ? colors.success : colors.muted,
                  }}
                >
                  {a.detail}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
