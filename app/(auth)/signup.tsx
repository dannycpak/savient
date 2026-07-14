import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Link, router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { completeGoogleSignIn, signInWithApple, useGoogleAuthRequest } from "@/lib/oauth";
import { Screen, Button, Field } from "@/components/ui";
import { space, type, colors } from "@/constants/theme";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleRequest, , promptGoogle] = useGoogleAuthRequest();

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setBusy(false);
    if (error) Alert.alert("Sign up failed", error.message);
    else {
      Alert.alert("Check your inbox", "Confirm your email, then sign in.");
      router.replace("/(auth)/login");
    }
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
    <Screen style={{ justifyContent: "center", gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={type.h1}>Create account</Text>
        <Text style={type.body}>Start your specimen catalog.</Text>
      </View>
      <Field label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button label="Sign up" onPress={submit} loading={busy} />

      {Platform.OS === "ios" && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={{ width: "100%", height: 48 }}
          onPress={onApple}
        />
      )}
      <Button
        label="Continue with Google"
        variant="ghost"
        onPress={onGoogle}
        disabled={busy || !googleRequest}
      />

      <Link href="/(auth)/login" style={{ color: colors.muted }}>
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}
