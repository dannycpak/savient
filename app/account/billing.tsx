import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { supabase } from "@/lib/supabase";
import { getOfferings, purchase } from "@/lib/purchases";
import { Screen, Button } from "@/components/ui";
import { colors } from "@/constants/theme";

const FALLBACK_PACKS = [
  { label: "5 checks", price: "$2.99", id: "credits_5" },
  { label: "15 checks", price: "$6.99", id: "credits_15" },
  { label: "40 checks", price: "$14.99", id: "credits_40" },
];

export default function Billing() {
  const [plan, setPlan] = useState<"free" | "plus">("free");
  const [credits, setCredits] = useState(0);
  const [pkgs, setPkgs] = useState<PurchasesPackage[]>([]);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
        const { data: bal } = await supabase.rpc("credits_balance");
        if (typeof bal === "number") setCredits(bal);
        try {
          const o = await getOfferings();
          setPkgs((o?.availablePackages ?? []).filter((p) => p.packageType !== "MONTHLY"));
        } catch {
          setPkgs([]);
        }
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

  const buyPack = async (pkg?: PurchasesPackage, label?: string) => {
    if (!pkg) {
      Alert.alert("Credits", `Configure RevenueCat consumable ${label ?? "pack"} to purchase.`);
      return;
    }
    setBusy(true);
    try {
      await purchase(pkg);
      Alert.alert("Thank you", "Credits appear after the RevenueCat webhook.");
    } catch {
      Alert.alert("Purchase cancelled");
    } finally {
      setBusy(false);
    }
  };

  const isPlus = plan === "plus";

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            alignSelf: "flex-start",
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.white,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: "InstrumentSans_500Medium" }}>← Profile</Text>
        </Pressable>

        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 30, color: colors.ink }}>
          Billing & payments
        </Text>

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
            {isPlus ? "Unlimited Visual Checks & cataloging" : "3 Visual Checks / month · 25 specimen catalog"}
          </Text>
          {isPlus ? (
            <>
              <Text style={{ fontSize: 13, color: colors.mint, marginTop: 8 }}>Renews monthly · $7/month</Text>
              <Button
                label="Cancel subscription"
                variant="outlineLight"
                onPress={manage}
                style={{ marginTop: 14, minHeight: 44 }}
              />
            </>
          ) : (
            <Button
              label="Go unlimited with Sage+"
              variant="cream"
              onPress={() => router.push("/paywall")}
              style={{ marginTop: 14, minHeight: 44 }}
            />
          )}
        </View>

        <View>
          <Text
            style={{
              fontSize: 13,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: colors.faint,
              marginBottom: 10,
            }}
          >
            Payment method
          </Text>
          <View
            style={{
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 30,
                borderRadius: 6,
                backgroundColor: colors.primaryHover,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.cream, fontSize: 10, fontFamily: "InstrumentSans_600SemiBold", letterSpacing: 0.5 }}>
                VISA
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontFamily: "InstrumentSans_600SemiBold" }}>Visa ···· 4242</Text>
              <Text style={{ fontSize: 12.5, color: colors.muted }}>Managed by App Store / Play Billing</Text>
            </View>
            <Pressable
              onPress={manage}
              style={{
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontFamily: "InstrumentSans_600SemiBold", fontSize: 13 }}>
                Update
              </Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text
            style={{
              fontSize: 13,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: colors.faint,
              marginBottom: 10,
            }}
          >
            Visual Check credits
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
            <Text
              style={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSoft,
                fontSize: 13.5,
                color: colors.muted,
                lineHeight: 20,
              }}
            >
              {credits} credits on hand — credits top up your monthly checks and never expire.
            </Text>
            {(pkgs.length > 0
              ? pkgs.map((p) => ({
                  label: p.product.title,
                  price: p.product.priceString,
                  buy: () => buyPack(p),
                }))
              : FALLBACK_PACKS.map((p) => ({
                  label: p.label,
                  price: p.price,
                  buy: () => buyPack(undefined, p.label),
                }))
            ).map((p, i, arr) => (
              <View
                key={p.label}
                style={{
                  paddingVertical: 13,
                  paddingHorizontal: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderSoft,
                }}
              >
                <Text style={{ flex: 1, fontSize: 14.5, fontFamily: "InstrumentSans_600SemiBold" }}>{p.label}</Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>{p.price}</Text>
                <Pressable
                  onPress={p.buy}
                  disabled={busy}
                  style={{
                    height: 34,
                    paddingHorizontal: 16,
                    borderRadius: 17,
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: colors.cream, fontFamily: "InstrumentSans_600SemiBold", fontSize: 13 }}>
                    Buy
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
