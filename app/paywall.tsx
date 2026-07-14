import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { getOfferings, purchase, restore } from "@/lib/purchases";
import { Screen, Button } from "@/components/ui";
import { COPY, FREE_TIER } from "@/constants/copy";
import { colors, space, type } from "@/constants/theme";

const FEATURES = [
  { label: "Unlimited Visual Checks", free: `${FREE_TIER.checksPerMonth}/month` },
  { label: "Unlimited cataloging", free: `${FREE_TIER.catalogCap} specimens` },
  { label: "Collection valuation analytics", free: "Basic total" },
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
  const creditPkgs = pkgs.filter((p) => p !== plusPkg);

  return (
    <Screen dark style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-end" }}>
          <Text style={{ color: colors.onDarkFaint, fontFamily: "InstrumentSans_500Medium" }}>Maybe later</Text>
        </Pressable>

        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 34, color: colors.onDark }}>
          {COPY.paywallHeadline}
        </Text>
        <Text style={{ color: colors.onDarkMuted, fontSize: 15, lineHeight: 22 }}>{COPY.paywallBody}</Text>

        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular",
            fontSize: 48,
            color: colors.onDark,
            marginTop: 8,
          }}
        >
          $7
          <Text style={{ fontSize: 18, color: colors.onDarkMuted }}>/month</Text>
        </Text>

        <View style={{ gap: 14, marginTop: 8 }}>
          {FEATURES.map((f) => (
            <View key={f.label} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <Text style={{ color: colors.positive, fontSize: 16 }}>✓</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.onDark, fontFamily: "InstrumentSans_600SemiBold", fontSize: 15 }}>
                  {f.label}
                </Text>
                <Text style={{ color: colors.onDarkFaint, fontSize: 12.5 }}>Free: {f.free}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          label={plusPkg ? `Start free month — ${plusPkg.product.priceString}` : "Start free month"}
          variant="bone"
          onPress={() =>
            plusPkg
              ? buy(plusPkg)
              : Alert.alert("Offerings not loaded", "Configure RevenueCat products first.")
          }
          loading={busy}
        />

        {creditPkgs.length > 0 && (
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Text style={{ ...type.h2, color: colors.onDark }}>Visual Check credit packs</Text>
            {creditPkgs.map((p) => (
              <Button
                key={p.identifier}
                label={`${p.product.title} — ${p.product.priceString}`}
                variant="ghost"
                onPress={() => buy(p)}
                disabled={busy}
              />
            ))}
          </View>
        )}

        <Button label="Restore purchases" variant="ghost" onPress={doRestore} disabled={busy} />
      </ScrollView>
    </Screen>
  );
}
