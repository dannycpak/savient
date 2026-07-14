import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, SoftInput, MenuRow } from "@/components/ui";
import { colors } from "@/constants/theme";

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
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            alignSelf: "flex-start",
            height: 36,
            paddingHorizontal: 14,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.white,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontFamily: "InstrumentSans_500Medium" }}>← Profile</Text>
        </Pressable>

        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 30, color: colors.ink }}>Account</Text>

        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 18,
            gap: 14,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Full name
            </Text>
            <SoftInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={{ backgroundColor: "#FBFAF6", height: 50 }}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Email
            </Text>
            <SoftInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={{ backgroundColor: "#FBFAF6", height: 50 }}
            />
          </View>
          <Button label="Save changes" onPress={save} loading={busy} style={{ minHeight: 48 }} />
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <MenuRow label="Change password" onPress={changePassword} />
          <MenuRow label="Delete account" danger last onPress={deleteAccount} />
        </View>
      </ScrollView>
    </Screen>
  );
}
