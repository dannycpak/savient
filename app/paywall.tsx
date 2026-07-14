import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { getOfferings, purchase, restore } from "@/lib/purchases";
import { Screen, Button } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { colors } from "@/constants/theme";

const FEATURES = [
  { label: "Unlimited Visual Checks", aside: "free: 3/mo" },
  { label: "Unlimited cataloging", aside: "free: 25" },
  { label: "Full price-range intelligence", aside: null },
  { label: "Collection valuation analytics", aside: null },
];

export default function Paywall() {
  const [pkgs, setPkgs] = useState<PurchasesPackage[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOfferings()
      .then((o) => setPkgs(o?.availablePackages ?? []))
      .catch(() => setPkgs([]));
  }, []);

  const buy = async (pkg: PurchasesPackage) => {
    setBusy(true);
    try {
      await purchase(pkg);
      Alert.alert("Thank you", "Your plan updates when RevenueCat confirms the purchase.");
      router.back();
    } catch {
      Alert.alert("Purchase cancelled");
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      await restore();
      Alert.alert("Restored", "Purchases restored. Plan syncs via webhook.");
    } catch {
      Alert.alert("Restore failed");
    } finally {
      setBusy(false);
    }
  };

  const plusPkg = pkgs.find((p) => p.identifier.includes("plus") || p.packageType === "MONTHLY");

  const start = () => {
    if (plusPkg) buy(plusPkg);
    else
      Alert.alert(
        "Offerings not loaded",
        "Configure RevenueCat products to purchase. UI matches the approved Sage+ paywall.",
      );
  };

  return (
    <Screen
      edges={["top", "left", "right", "bottom"]}
      style={{ backgroundColor: colors.primaryHover, paddingHorizontal: 0 }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 40,
          gap: 18,
          flexGrow: 1,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.cream }}>
            {COPY.paywallHeadline}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(245,242,235,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.cream, fontSize: 17 }}>✕</Text>
          </Pressable>
        </View>

        <Text style={{ fontSize: 16, lineHeight: 24, color: colors.sageMist }}>{COPY.paywallBody}</Text>

        <View
          style={{
            backgroundColor: "rgba(245,242,235,0.08)",
            borderRadius: 20,
            padding: 20,
            gap: 14,
          }}
        >
          {FEATURES.map((f) => (
            <View key={f.label} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Text style={{ color: colors.mint }}>✓</Text>
              <Text style={{ flex: 1, fontSize: 15, color: colors.cream }}>{f.label}</Text>
              {f.aside ? <Text style={{ color: colors.mintMuted, fontSize: 13 }}>{f.aside}</Text> : null}
            </View>
          ))}
        </View>

        <View style={{ alignItems: "center", marginTop: "auto", paddingTop: 24 }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 40, color: colors.cream }}>
            $7
            <Text style={{ fontSize: 18, color: colors.mintMuted }}>/month</Text>
          </Text>
          <Text style={{ fontSize: 13, color: colors.mintMuted, marginTop: 2 }}>
            First month free · cancel anytime
          </Text>
        </View>

        <Button
          label={plusPkg ? `Start free month — ${plusPkg.product.priceString}` : "Start free month"}
          variant="cream"
          onPress={start}
          loading={busy}
        />
        <Pressable onPress={() => router.back()} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: colors.mintMuted, fontSize: 14 }}>Maybe later</Text>
        </Pressable>
        <Pressable onPress={doRestore} disabled={busy} style={{ alignItems: "center" }}>
          <Text style={{ color: colors.sageMist, fontSize: 13 }}>Restore purchases</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
