import { Stack } from "expo-router";
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { AuthProvider } from "@/lib/auth";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSerif_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontFamily: "InstrumentSans_600SemiBold" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="paywall" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="specimen/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="specimen/new" options={{ title: "Add specimen" }} />
        <Stack.Screen name="listing/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="seller/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="checkout/[listingId]"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="rate/[orderId]"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen name="account/settings" options={{ headerShown: false }} />
        <Stack.Screen name="account/billing" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
