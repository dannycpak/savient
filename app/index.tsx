import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";

const ONBOARDING_KEY = "sage.onboarding.done";

export default function Index() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    (async () => {
      const done = await SecureStore.getItemAsync(ONBOARDING_KEY).catch(() => null);
      if (!done) {
        router.replace("/onboarding");
        return;
      }
      if (session) router.replace("/(tabs)");
      else router.replace("/(auth)/login");
    })();
  }, [session, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
