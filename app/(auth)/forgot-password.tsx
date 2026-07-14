import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field } from "@/components/ui";
import { space, type } from "@/constants/theme";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "sage://reset-password",
    });
    setBusy(false);
    if (error) Alert.alert("Reset failed", error.message);
    else setSent(true);
  };

  if (sent) {
    return (
      <Screen style={{ justifyContent: "center", gap: space.lg }}>
        <Text style={type.h1}>Check your inbox</Text>
        <Text style={type.body}>
          We sent a reset link to {email}. Open it on this device to choose a new password.
        </Text>
        <Button label="Back to sign in" onPress={() => router.replace("/(auth)/login")} />
      </Screen>
    );
  }

  return (
    <Screen style={{ justifyContent: "center", gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={type.h1}>Reset password</Text>
        <Text style={type.body}>Enter the email on your Sage account.</Text>
      </View>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button label="Send reset link" onPress={submit} loading={busy} />
    </Screen>
  );
}
