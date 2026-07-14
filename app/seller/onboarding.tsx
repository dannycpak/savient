import { useCallback, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Screen, Card, Button, Field, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

type Seller = {
  id: string;
  business_name: string | null;
  connect_onboarding_status: string;
  tier: string;
  credibility_score: number;
};

export default function SellerOnboarding() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase
      .from("sellers")
      .select("id, business_name, connect_onboarding_status, tier, credibility_score")
      .eq("profile_id", userData.user.id)
      .maybeSingle();
    setSeller((data as Seller) ?? null);
    if (data?.business_name) setName(data.business_name);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const start = async () => {
    setBusy(true);
    try {
      const res = await api.createConnectAccount(name || undefined);
      await load();
      const canOpen = await Linking.canOpenURL(res.onboarding_url);
      if (canOpen) await Linking.openURL(res.onboarding_url);
      else Alert.alert("Open this URL to continue", res.onboarding_url);
    } catch (e) {
      Alert.alert("Onboarding failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ gap: space.lg }}>
      <Text style={type.h1}>Sell on Sage</Text>
      <Text style={type.body}>
        Stripe Connect Express handles KYC. Listings unlock when onboarding status is active.
      </Text>

      {seller ? (
        <Card>
          <Eyebrow>Status</Eyebrow>
          <Text style={type.h2}>{seller.connect_onboarding_status}</Text>
          <Text style={type.caption}>
            {seller.business_name ?? "Seller"} · {seller.tier} ·{" "}
            {seller.credibility_score.toFixed(1)}/10
          </Text>
        </Card>
      ) : (
        <Field label="Business name" value={name} onChangeText={setName} autoCapitalize="words" />
      )}

      <Button
        label={seller?.connect_onboarding_status === "active" ? "Reconnect / update" : "Continue with Stripe"}
        onPress={start}
        loading={busy}
      />

      {seller?.connect_onboarding_status === "active" && (
        <Button label="Create a listing" onPress={() => router.push("/listing/new")} />
      )}

      <Button label="My seller orders" variant="ghost" onPress={() => router.push("/seller/orders")} />
    </Screen>
  );
}
