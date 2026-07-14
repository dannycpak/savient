import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Link, router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { completeGoogleSignIn, signInWithApple, useGoogleAuthRequest } from "@/lib/oauth";
import { Screen, Button, Field, Divider } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { space, type, colors } from "@/constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleRequest, , promptGoogle] = useGoogleAuthRequest();

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) Alert.alert("Sign in failed", error.message);
    else router.replace("/(tabs)");
  };

  const onApple = async () => {
    setBusy(true);
    try {
      await signInWithApple();
      router.replace("/(tabs)");
    } catch (e) {
      if ((e as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple sign-in failed", e instanceof Error ? e.message : "Try again");
      }
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Alert.alert("Google sign-in not configured", "Add EXPO_PUBLIC_GOOGLE_* client IDs to .env.");
      return;
    }
    setBusy(true);
    try {
      const result = await promptGoogle();
      if (result.type !== "success") return;
      const idToken = result.params?.id_token;
      if (!idToken) throw new Error("No Google ID token returned.");
      await completeGoogleSignIn(idToken);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Google sign-in failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ justifyContent: "center", gap: space.md }}>
      <View style={{ gap: 6, marginBottom: space.sm }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 34, color: colors.ink }}>
          {COPY.auth.welcome}
        </Text>
        <Text style={type.caption}>{COPY.auth.welcomeSub}</Text>
      </View>

      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={28}
          style={{ width: "100%", height: 52 }}
          onPress={onApple}
        />
      )}
      <Button label="Continue with Google" variant="ghost" onPress={onGoogle} disabled={busy || !googleRequest} />
      <Divider label="or with email" />

      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <Link href="/(auth)/forgot-password" style={{ color: colors.primary, fontFamily: "InstrumentSans_500Medium", fontSize: 13.5 }}>
        Forgot password?
      </Link>
      <Button label="Log in" onPress={submit} loading={busy} />
      <Link href="/(auth)/signup" style={{ color: colors.muted, fontFamily: "InstrumentSans_400Regular", textAlign: "center" }}>
        New to Sage? Create account
      </Link>
    </Screen>
  );
}
