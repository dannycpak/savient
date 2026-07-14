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
        <Stack.Screen name="paywall" options={{ presentation: "fullScreenModal", headerShown: false }} />
        <Stack.Screen name="specimen/[id]" options={{ title: "Specimen" }} />
        <Stack.Screen name="specimen/new" options={{ title: "Add specimen" }} />
        <Stack.Screen name="listing/[id]" options={{ title: "Listing" }} />
        <Stack.Screen name="seller/[id]" options={{ title: "Seller" }} />
        <Stack.Screen name="checkout/[listingId]" options={{ title: "Checkout" }} />
        <Stack.Screen name="rate/[orderId]" options={{ title: "Rate purchase" }} />
        <Stack.Screen name="account/settings" options={{ title: "Account" }} />
        <Stack.Screen name="account/billing" options={{ title: "Billing" }} />
      </Stack>
    </AuthProvider>
  );
}
