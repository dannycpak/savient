import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field } from "@/components/ui";
import { space, type } from "@/constants/theme";

/** Deep link target: sage://auth/reset-password */
export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (error) Alert.alert("Could not update", error.message);
    else {
      Alert.alert("Password updated", "You can sign in with your new password.");
      router.replace("/(tabs)");
    }
  };

  return (
    <Screen style={{ justifyContent: "center", gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={type.h1}>Choose a new password</Text>
        <Text style={type.body}>Enter a new password for your Sage account.</Text>
      </View>
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button label="Update password" onPress={submit} loading={busy} />
    </Screen>
  );
}
