import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field } from "@/components/ui";
import { space, type } from "@/constants/theme";

/** Deep-link target for `sage://reset-password` (and Supabase recovery redirects). */
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const access_token =
        (parsed.queryParams?.access_token as string | undefined) ??
        new URLSearchParams(url.split("#")[1] ?? "").get("access_token") ??
        undefined;
      const refresh_token =
        (parsed.queryParams?.refresh_token as string | undefined) ??
        new URLSearchParams(url.split("#")[1] ?? "").get("refresh_token") ??
        undefined;
      const type =
        (parsed.queryParams?.type as string | undefined) ??
        new URLSearchParams(url.split("#")[1] ?? "").get("type");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
      if (type === "recovery" || access_token) setReady(true);
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.remove();
  }, []);

  const submit = async () => {
    if (password.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) Alert.alert("Could not update password", error.message);
    else {
      Alert.alert("Password updated", "You can sign in with your new password.");
      router.replace("/(tabs)");
    }
  };

  return (
    <Screen style={{ justifyContent: "center", gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={type.h1}>Set a new password</Text>
        <Text style={type.body}>
          {ready
            ? "Choose a new password for your Sage account."
            : "Open the reset link from your email to continue."}
        </Text>
      </View>
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button label="Update password" onPress={submit} loading={busy} disabled={!ready} />
    </Screen>
  );
}
