import { useCallback, useState } from "react";
import { Alert, ScrollView, Share, Switch, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { registerForPushNotifications } from "@/lib/notifications";
import { Screen, Button, Field, Card, Eyebrow } from "@/components/ui";
import { space, type, colors } from "@/constants/theme";

export default function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: userData } = await supabase.auth.getUser();
        setEmail(userData.user?.email ?? "");
        const { data: prof } = await supabase.from("profiles").select("display_name").single();
        setName(prof?.display_name ?? "");
      })();
    }, []),
  );

  const save = async () => {
    setBusy(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", uid);
      if (error) throw error;
      if (email) {
        const { error: e2 } = await supabase.auth.updateUser({ email });
        if (e2) throw e2;
      }
      Alert.alert("Saved", "Email changes require re-verification.");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "sage://auth/reset-password",
    });
    if (error) Alert.alert("Failed", error.message);
    else Alert.alert("Check your inbox", "Use the link to set a new password.");
  };

  const toggleNotifications = async (on: boolean) => {
    setNotificationsOn(on);
    if (on) {
      const token = await registerForPushNotifications();
      if (!token) {
        setNotificationsOn(false);
        Alert.alert("Permission needed", "Enable notifications in system settings to continue.");
        return;
      }
      Alert.alert("Notifications on", "Order and rating prompts will use this device.");
    }
  };

  const exportCollection = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("specimens")
        .select(
          "species, variety, locality, formation, matrix, provenance, rarity, condition, est_value_cents, acquisition_price_cents, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const header = [
        "species",
        "variety",
        "locality",
        "formation",
        "matrix",
        "provenance",
        "rarity",
        "condition",
        "est_value_usd",
        "acquisition_price_usd",
        "created_at",
      ];
      const lines = [
        header.join(","),
        ...rows.map((r) =>
          [
            r.species,
            r.variety,
            r.locality,
            r.formation,
            r.matrix,
            r.provenance,
            r.rarity,
            r.condition,
            r.est_value_cents != null ? (r.est_value_cents / 100).toFixed(2) : "",
            r.acquisition_price_cents != null ? (r.acquisition_price_cents / 100).toFixed(2) : "",
            r.created_at,
          ]
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(","),
        ),
      ];
      await Share.share({
        title: "Sage collection export",
        message: lines.join("\n"),
      });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    router.replace("/(auth)/login");
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "Your account will be soft-deleted and purged after 30 days (App Store requirement).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("soft_delete_account");
            if (error) Alert.alert("Failed", error.message);
            else {
              await supabase.auth.signOut({ scope: "global" });
              router.replace("/(auth)/login");
            }
          },
        },
      ],
    );
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>Account</Text>
        <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Button label="Save changes" onPress={save} loading={busy} />
        <Button label="Change password" variant="ghost" onPress={changePassword} />

        <Card>
          <Eyebrow>Notifications</Eyebrow>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={type.body}>Order & rating alerts</Text>
            <Switch
              value={notificationsOn}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Card>

        <Button label="Export my collection" variant="ghost" onPress={exportCollection} loading={busy} />
        <Button label="My purchases" variant="ghost" onPress={() => router.push("/account/orders")} />
        <Button label="Billing" variant="ghost" onPress={() => router.push("/account/billing")} />
        <Button label="Sign out" variant="ghost" onPress={signOut} />
        <Button label="Delete account" variant="danger" onPress={deleteAccount} />
      </ScrollView>
    </Screen>
  );
}
