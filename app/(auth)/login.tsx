import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Link, router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { signInWithApple, signInWithGoogle } from "@/lib/oauth";
import { Screen, Button, Field } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { space, type, colors } from "@/constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) Alert.alert("Sign in failed", error.message);
    else router.replace("/(tabs)");
  };

  const apple = async () => {
    setBusy(true);
    try {
      await signInWithApple();
      router.replace("/(tabs)");
    } catch (e) {
      if ((e as { code?: string })?.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple sign-in failed", e instanceof Error ? e.message : "Try again");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
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
        <Text style={type.display}>{COPY.appName}</Text>
        <Text style={type.body}>Sign in to your cabinet.</Text>
      </View>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <Button label="Sign in" onPress={submit} loading={busy} />

      <View style={{ gap: space.sm }}>
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={10}
            style={{ width: "100%", height: 48 }}
            onPress={apple}
          />
        )}
        <Button label="Continue with Google" variant="ghost" onPress={google} disabled={busy} />
      </View>

      <Link href="/(auth)/forgot-password" style={{ color: colors.primary, fontFamily: "InstrumentSans_500Medium" }}>
        Forgot password?
      </Link>
      <Link href="/(auth)/signup" style={{ color: colors.muted, fontFamily: "InstrumentSans_400Regular" }}>
        Need an account? Sign up
      </Link>
    </Screen>
  );
}
