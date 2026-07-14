import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field, Card } from "@/components/ui";
import { colors, space, type } from "@/constants/theme";

export default function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: userData } = await supabase.auth.getUser();
        setEmail(userData.user?.email ?? "");
        const { data: prof } = await supabase.from("profiles").select("display_name").single();
        setName(prof?.display_name ?? "");
      })();
    }, []),
  );

  const save = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name })
        .eq("id", (await supabase.auth.getUser()).data.user!.id);
      if (error) throw error;
      if (email) {
        const { error: e2 } = await supabase.auth.updateUser({ email });
        if (e2) throw e2;
      }
      Alert.alert("Saved", "Email changes require re-verification.");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "sage://reset-password",
    });
    if (error) Alert.alert("Failed", error.message);
    else Alert.alert("Check your inbox", "Use the link to set a new password.");
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    router.replace("/(auth)/login");
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "Your account will be soft-deleted and purged after 30 days (App Store requirement).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("soft_delete_account");
            if (error) Alert.alert("Failed", error.message);
            else {
              await supabase.auth.signOut({ scope: "global" });
              router.replace("/(auth)/login");
            }
          },
        },
      ],
    );
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>Account</Text>
        <Card style={{ gap: space.md }}>
          <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Button label="Save changes" onPress={save} loading={busy} />
        </Card>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Row label="Change password" onPress={changePassword} />
          <Row label="Sign out" onPress={signOut} />
          <Row label="Delete account" onPress={deleteAccount} danger last />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({
  label,
  onPress,
  danger,
  last,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.divider,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Text style={[type.body, danger && { color: colors.danger }]}>{label}</Text>
      <Text style={{ color: colors.faint }}>›</Text>
    </Pressable>
  );
}
