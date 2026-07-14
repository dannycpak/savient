import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, SoftInput } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { colors } from "@/constants/theme";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "sage://reset-password",
    });
    setBusy(false);
    if (error) Alert.alert("Failed", error.message);
    else setSent(true);
  };

  return (
    <Screen style={{ paddingTop: 40, gap: 18 }}>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.primary }}>
        Sage
      </Text>
      <View>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 34, lineHeight: 38, color: colors.ink }}>
          {sent ? "Check your inbox" : "Reset password"}
        </Text>
        <Text style={{ fontSize: 15, color: colors.muted, marginTop: 8, lineHeight: 22, fontFamily: "InstrumentSans_400Regular" }}>
          {sent
            ? "Follow the link in the email to set a new password, then come back and log in."
            : "We'll email you a link to choose a new password."}
        </Text>
      </View>

      {sent ? (
        <>
          <View
            style={{
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 18,
              padding: 22,
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.successSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCheck />
            </View>
            <Text style={{ fontSize: 14.5, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
              Follow the link in the email to set a new password, then come back and log in.
            </Text>
          </View>
          <Button label="Back to log in" onPress={() => router.replace("/(auth)/login")} />
        </>
      ) : (
        <>
          <SoftInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <Button label="Send reset link" onPress={send} loading={busy} />
          <Pressable onPress={() => router.back()}>
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontFamily: "InstrumentSans_500Medium",
                textAlign: "center",
              }}
            >
              ← Back to log in
            </Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
