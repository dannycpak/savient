import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
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

  return (
    <Screen style={{ justifyContent: "center", gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={type.display}>{COPY.appName}</Text>
        <Text style={type.body}>Sign in to your cabinet.</Text>
      </View>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <Button label="Sign in" onPress={submit} loading={busy} />
      <Link href="/(auth)/forgot-password" style={{ color: colors.primary, fontFamily: "InstrumentSans_500Medium" }}>
        Forgot password?
      </Link>
      <Link href="/(auth)/signup" style={{ color: colors.muted, fontFamily: "InstrumentSans_400Regular" }}>
        Need an account? Sign up
      </Link>
    </Screen>
  );
}
