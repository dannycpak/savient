import { StripeProvider } from "@stripe/stripe-react-native";
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

const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSerif_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <StripeProvider publishableKey={stripeKey || "pk_test_placeholder"} urlScheme="sage">
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
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="auth/reset-password" options={{ title: "Reset password" }} />
          <Stack.Screen name="paywall" options={{ presentation: "modal", title: "Sage+" }} />
          <Stack.Screen name="specimen/[id]" options={{ title: "Specimen" }} />
          <Stack.Screen name="specimen/new" options={{ title: "Add specimen" }} />
          <Stack.Screen name="specimen/edit/[id]" options={{ title: "Edit specimen" }} />
          <Stack.Screen name="check/history" options={{ title: "Check history" }} />
          <Stack.Screen name="check/[id]" options={{ title: "Check detail" }} />
          <Stack.Screen name="inventory/analytics" options={{ title: "Analytics" }} />
          <Stack.Screen name="listing/[id]" options={{ title: "Listing" }} />
          <Stack.Screen name="listing/new" options={{ title: "New listing" }} />
          <Stack.Screen name="seller/[id]" options={{ title: "Seller" }} />
          <Stack.Screen name="seller/onboarding" options={{ title: "Sell on Sage" }} />
          <Stack.Screen name="seller/orders" options={{ title: "Seller orders" }} />
          <Stack.Screen name="checkout/[listingId]" options={{ title: "Checkout" }} />
          <Stack.Screen name="rate/[orderId]" options={{ title: "Rate purchase" }} />
          <Stack.Screen name="account/settings" options={{ title: "Account" }} />
          <Stack.Screen name="account/billing" options={{ title: "Billing" }} />
          <Stack.Screen name="account/orders" options={{ title: "My purchases" }} />
        </Stack>
      </AuthProvider>
    </StripeProvider>
  );
}
