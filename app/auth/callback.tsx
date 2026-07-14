import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

/** Deep-link landing for OAuth / password-reset redirects (`sage://auth/callback`). */
export default function AuthCallback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // Hash tokens are handled by oauth.ts for Google; this catches query-style sessions.
        if (typeof params.access_token === "string" && typeof params.refresh_token === "string") {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      } finally {
        const { data } = await supabase.auth.getSession();
        router.replace(data.session ? "/(tabs)" : "/(auth)/login");
      }
    })();
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
