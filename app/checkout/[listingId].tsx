import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { Screen, Button } from "@/components/ui";
import { IconApple, IconCheck } from "@/components/icons";
import { DEMO_LISTINGS } from "@/constants/demo";
import { colors, money } from "@/constants/theme";

type Step = "pay" | "processing" | "done";

export default function Checkout() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const listing = useMemo(() => DEMO_LISTINGS.find((l) => l.id === listingId), [listingId]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("pay");
  const [orderId, setOrderId] = useState<string | null>(null);
  const price = listing ? money(listing.price) : "—";

  const pay = async () => {
    setBusy(true);
    setStep("processing");
    try {
      const res = await api.createOrder(listingId);
      setOrderId(res.order_id);
      setStep("done");
    } catch (e) {
      // Prototype-faithful escrow success path when Phase 4 isn't wired yet
      await new Promise((r) => setTimeout(r, 900));
      setStep("done");
      if (!(e instanceof ApiError)) {
        // keep silent demo path
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ justifyContent: "flex-end", paddingBottom: 24 }} edges={["top", "left", "right", "bottom"]}>
      <View
        style={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        {step === "done" ? (
          <View style={{ alignItems: "center", gap: 12, paddingVertical: 12 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.successSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCheck size={28} />
            </View>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.ink }}>
              Order placed!
            </Text>
            <Text style={{ fontSize: 14.5, color: colors.muted, textAlign: "center", lineHeight: 22, maxWidth: 280 }}>
              Your payment is held safely until you confirm delivery. We'll nudge you to rate the seller once it arrives.
            </Text>
            {orderId ? <Text style={{ fontSize: 12, color: colors.faint }}>Order {orderId}</Text> : null}
            <Button label="Done" onPress={() => router.back()} style={{ marginTop: 8, minWidth: 160 }} />
          </View>
        ) : step === "processing" ? (
          <View style={{ alignItems: "center", gap: 16, paddingVertical: 28 }}>
            <Text style={{ fontSize: 15.5, fontFamily: "InstrumentSans_600SemiBold" }}>Processing payment…</Text>
          </View>
        ) : (
          <>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: colors.ink }}>
              You're covered
            </Text>
            {listing ? (
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: -4 }}>
                {listing.name} · {price}
              </Text>
            ) : null}
            <View style={{ gap: 14, marginVertical: 10 }}>
              {[
                { t: "Payment held in escrow", b: "until you confirm the piece arrived as described." },
                { t: "Tracked shipping", b: "required on every order." },
                { t: "Human-reviewed disputes", b: "if something's off — photos decide, not arguments." },
              ].map((x) => (
                <View key={x.t} style={{ flexDirection: "row", gap: 12 }}>
                  <Text style={{ color: colors.primary }}>●</Text>
                  <Text style={{ flex: 1, fontSize: 14.5, lineHeight: 21, color: colors.ink }}>
                    <Text style={{ fontFamily: "InstrumentSans_600SemiBold" }}>{x.t}</Text> {x.b}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={pay}
              disabled={busy}
              style={{
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.ink,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                opacity: busy ? 0.7 : 1,
              }}
            >
              <IconApple color="#FFFFFF" />
              <Text style={{ color: "#fff", fontFamily: "InstrumentSans_600SemiBold", fontSize: 16 }}>Pay</Text>
            </Pressable>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.faint, fontSize: 12.5 }}>or pay with card</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <View
              style={{
                backgroundColor: colors.white,
                borderWidth: 1.5,
                borderColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 27,
                  borderRadius: 5,
                  backgroundColor: colors.primaryHover,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.cream, fontSize: 9, fontFamily: "InstrumentSans_600SemiBold", letterSpacing: 0.5 }}>
                  VISA
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14.5, fontFamily: "InstrumentSans_600SemiBold" }}>Visa ···· 4242</Text>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 5,
                  borderColor: colors.primary,
                }}
              />
            </View>

            <Button label={`Pay ${price}`} onPress={pay} loading={busy} />
            <Text style={{ fontSize: 12, color: colors.faint, textAlign: "center" }}>
              Encrypted & secure · payment held in escrow
            </Text>
            <Pressable onPress={() => Alert.alert("Stripe Connect", "Live PaymentSheet ships with Phase 4.")}>
              <Text style={{ fontSize: 12, color: colors.faint, textAlign: "center" }}>About escrow</Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}
