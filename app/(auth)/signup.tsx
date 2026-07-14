import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field } from "@/components/ui";
import { space, type, colors } from "@/constants/theme";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

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
      <Link href="/(auth)/login" style={{ color: colors.muted }}>
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}
