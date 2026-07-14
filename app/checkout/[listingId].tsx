import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { colors, space, type } from "@/constants/theme";

type Listing = {
  id: string;
  title: string;
  species: string;
  price_cents: number;
  locality: string | null;
};

export default function Checkout() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("listings")
          .select("id, title, species, price_cents, locality")
          .eq("id", listingId)
          .single();
        setListing((data as Listing) ?? null);
      })();
    }, [listingId]),
  );

  const start = async () => {
    setBusy(true);
    try {
      const res = await api.createOrder(listingId);
      setOrderId(res.order_id);

      const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
      if (!pk || pk.includes("xxx") || !res.client_secret) {
        Alert.alert(
          "Order created",
          "PaymentIntent ready. Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and rebuild the native app to present PaymentSheet.",
        );
        setDone(true);
        return;
      }

      const { error: initErr } = await initPaymentSheet({
        merchantDisplayName: "Sage",
        paymentIntentClientSecret: res.client_secret,
        allowsDelayedPaymentMethods: false,
        returnURL: "sage://checkout-return",
      });
      if (initErr) throw new Error(initErr.message);

      const { error: presentErr } = await presentPaymentSheet();
      if (presentErr) {
        if (presentErr.code === "Canceled") {
          Alert.alert("Payment cancelled", "Your order stays pending until authorized.");
        } else {
          throw new Error(presentErr.message);
        }
        return;
      }

      setDone(true);
      Alert.alert(
        "Payment held in escrow",
        "Funds are authorized. The seller will ship with tracking — confirm delivery to release payment.",
      );
    } catch (e) {
      Alert.alert(
        "Checkout unavailable",
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not create order.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ gap: space.lg, paddingTop: space.md }}>
      <Text style={type.h1}>{done ? "Order placed" : "You're covered"}</Text>
      {listing && (
        <Card>
          <Eyebrow>{listing.species}</Eyebrow>
          <Text style={type.h2}>{listing.title}</Text>
          <Text style={type.display}>{formatMoney(listing.price_cents)}</Text>
          {listing.locality ? <Text style={type.caption}>{listing.locality}</Text> : null}
        </Card>
      )}
      <Card>
        <Text style={type.body}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold" }}>Payment held in escrow</Text> until
          you confirm the piece arrived as described.
        </Text>
        <Text style={type.body}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold" }}>Tracked shipping</Text> required on
          every order.
        </Text>
        <Text style={type.body}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold" }}>Human-reviewed disputes</Text> if
          something's off.
        </Text>
      </Card>
      {!done ? (
        <Button
          label={listing ? `Confirm purchase — ${formatMoney(listing.price_cents)}` : "Authorize payment"}
          onPress={start}
          loading={busy}
        />
      ) : (
        <View style={{ gap: space.sm }}>
          {orderId ? <Text style={type.caption}>Order {orderId}</Text> : null}
          <Button label="My purchases" onPress={() => router.replace("/account/orders")} />
          <Button label="Done" variant="ghost" onPress={() => router.back()} />
        </View>
      )}
      <Text style={[type.caption, { textAlign: "center", color: colors.faint }]}>
        Physical goods only — Stripe Connect escrow. Digital goods use App Store / Play Billing.
      </Text>
    </Screen>
  );
}
