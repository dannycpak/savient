import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, SoftInput } from "@/components/ui";
import { IconApple, IconGoogle } from "@/components/icons";
import { colors, space } from "@/constants/theme";

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

  const oauthSoon = (provider: string) =>
    Alert.alert(
      `${provider} sign-in`,
      "Wire Apple/Google OAuth in Phase 1 after Supabase providers are configured. Email works now.",
    );

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 40, paddingBottom: 40, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.primary }}>
          Sage
        </Text>
        <View>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 34, lineHeight: 38, color: colors.ink }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 15, color: colors.muted, marginTop: 8, lineHeight: 22, fontFamily: "InstrumentSans_400Regular" }}>
            Sign in to pick up where you left your cabinet.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Pressable
            onPress={() => oauthSoon("Apple")}
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.ink,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            <IconApple />
            <Text style={{ color: colors.cream, fontFamily: "InstrumentSans_600SemiBold", fontSize: 15.5 }}>
              Continue with Apple
            </Text>
          </Pressable>
          <Pressable
            onPress={() => oauthSoon("Google")}
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            <IconGoogle />
            <Text style={{ color: colors.ink, fontFamily: "InstrumentSans_600SemiBold", fontSize: 15.5 }}>
              Continue with Google
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={{ color: colors.faint, fontSize: 12.5 }}>or with email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <View style={{ gap: 10 }}>
          <SoftInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <SoftInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text style={{ fontSize: 13.5, color: colors.primary, fontFamily: "InstrumentSans_500Medium" }}>
              Forgot password?
            </Text>
          </Pressable>
        </Link>

        <Button label="Log in" onPress={submit} loading={busy} />

        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", fontFamily: "InstrumentSans_400Regular" }}>
          New here?{" "}
          <Link href="/(auth)/signup" style={{ color: colors.primary, fontFamily: "InstrumentSans_600SemiBold" }}>
            Create account
          </Link>
        </Text>
        <View style={{ height: space.sm }} />
      </ScrollView>
    </Screen>
  );
}
