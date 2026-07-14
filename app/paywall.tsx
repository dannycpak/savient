import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { getOfferings, purchase, restore } from "@/lib/purchases";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { space, type } from "@/constants/theme";

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
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>{COPY.paywallHeadline}</Text>
        <Text style={type.body}>{COPY.paywallBody}</Text>

        <Card>
          <Eyebrow>Included</Eyebrow>
          <Text style={type.body}>· Unlimited Visual Checks</Text>
          <Text style={type.body}>· Unlimited cataloging</Text>
          <Text style={type.body}>· Collection valuation analytics</Text>
        </Card>

        <Button
          label={plusPkg ? `Start free month — ${plusPkg.product.priceString}` : "Start free month"}
          onPress={() => (plusPkg ? buy(plusPkg) : Alert.alert("Offerings not loaded", "Configure RevenueCat products first."))}
          loading={busy}
        />
        <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />

        {creditPkgs.length > 0 && (
          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Text style={type.h2}>Visual Check credit packs</Text>
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
