import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { api, ApiError, type VisualCheckResult } from "@/lib/api";
import { stripExifAndResize } from "@/lib/images";
import { Screen, Button, Swatch } from "@/components/ui";
import { IconCamera } from "@/components/icons";
import { CANNED_CHECK } from "@/constants/demo";
import { COPY, FREE_TIER, VISUAL_CHECK_DISCLAIMER } from "@/constants/copy";
import { colors } from "@/constants/theme";

type Step = "intro" | "analyzing" | "result";
type LocalResult = {
  species: string;
  confidence: string;
  flags: string[];
  low: number;
  high: number;
  mid: number;
  size: string;
  note: string;
  source: string;
};

const MSGS = ["Identifying species…", "Checking red flags…", "Comparing logged purchases…"];

export default function Check() {
  const [step, setStep] = useState<Step>("intro");
  const [uri, setUri] = useState<string | null>(null);
  const [msg, setMsg] = useState(MSGS[0]);
  const [result, setResult] = useState<LocalResult | null>(null);
  const [checksUsed, setChecksUsed] = useState(1);
  const pulse = useRef(new Animated.Value(0.9)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step !== "analyzing") return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 800, useNativeDriver: true }),
      ]),
    );
    const barLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bar, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(bar, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    pulseLoop.start();
    barLoop.start();
    let i = 0;
    const iv = setInterval(() => {
      i = Math.min(i + 1, 2);
      setMsg(MSGS[i]);
    }, 1100);
    return () => {
      pulseLoop.stop();
      barLoop.stop();
      clearInterval(iv);
    };
  }, [step, pulse, bar]);

  const toLocal = (r: VisualCheckResult): LocalResult => {
    const top = r.result.candidates?.[0];
    const range = r.result.price_range;
    return {
      species: top?.species ?? "Unclear",
      confidence:
        top && top.confidence >= 0.75 ? "High" : top && top.confidence >= 0.45 ? "Medium" : "Low",
      flags:
        r.result.red_flags.length > 0
          ? r.result.red_flags.slice(0, 3)
          : CANNED_CHECK.flags,
      low: range ? Math.round(range.low_cents / 100) : CANNED_CHECK.low,
      high: range ? Math.round(range.high_cents / 100) : CANNED_CHECK.high,
      mid: range ? Math.round((range.low_cents + range.high_cents) / 200) : CANNED_CHECK.mid,
      size: CANNED_CHECK.size,
      note: "typical — looks fair",
      source: "Live AI estimate from your photo — a second opinion, not an appraisal.",
    };
  };

  const finish = (res: LocalResult) => {
    setResult(res);
    setChecksUsed((n) => n + 1);
    setStep("result");
  };

  const runWithUri = async (photoUri: string | null, useSample: boolean) => {
    setStep("analyzing");
    setMsg(MSGS[0]);
    const wait = new Promise((r) => setTimeout(r, 2400));
    try {
      if (useSample || !photoUri) {
        await wait;
        finish(CANNED_CHECK);
        return;
      }
      const clean = await stripExifAndResize(photoUri);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const path = `${user.id}/${Date.now()}.jpg`;
      const file = await fetch(clean).then((r) => r.arrayBuffer());
      const uploadP = supabase.storage.from("check-uploads").upload(path, file, {
        contentType: "image/jpeg",
      });
      const [{ error: upErr },] = await Promise.all([uploadP, wait]);
      if (upErr) throw upErr;
      try {
        const apiRes = await api.visualCheck(path);
        finish(toLocal(apiRes));
      } catch (e) {
        if (e instanceof ApiError && e.status === 402) {
          Alert.alert("Out of checks", "You've used this month's free checks.", [
            { text: "Not now", onPress: () => setStep("intro") },
            { text: "Get more", onPress: () => router.push("/paywall") },
          ]);
          return;
        }
        finish(CANNED_CHECK);
        Alert.alert("Showing a sample", "AI unavailable right now — sample amethyst result.");
      }
    } catch {
      await wait;
      finish(CANNED_CHECK);
      Alert.alert("Showing a sample", "Couldn't complete the live check — sample result shown.");
    }
  };

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (res.canceled) return;
    const photo = res.assets[0].uri;
    setUri(photo);
    setResult(null);
    await runWithUri(photo, false);
  };

  const close = () => {
    setStep("intro");
    setUri(null);
    setResult(null);
    router.back();
  };

  const checksLeft = Math.max(0, FREE_TIER.checksPerMonth - checksUsed);
  const R = result ?? CANNED_CHECK;
  const confBg = R.confidence === "High" ? colors.mint : R.confidence === "Medium" ? "#E8D48A" : "#E8B25C";
  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ["8%", "82%"] });

  return (
    <Screen
      edges={["top", "left", "right", "bottom"]}
      style={{ backgroundColor: colors.primaryHover, paddingHorizontal: 0 }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 36,
          gap: 18,
          minHeight: "100%",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.cream }}>
            Visual Check
          </Text>
          <Pressable
            onPress={close}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(245,242,235,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.cream, fontSize: 17 }}>✕</Text>
          </Pressable>
        </View>

        {step === "intro" && (
          <>
            <Text style={{ fontSize: 15.5, lineHeight: 23, color: colors.sageMist, fontFamily: "InstrumentSans_400Regular" }}>
              {COPY.checkIntro}
            </Text>
            <Pressable
              onPress={pick}
              style={{
                minHeight: 250,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "rgba(245,242,235,0.35)",
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                marginTop: 8,
              }}
            >
              <IconCamera color={colors.sageMist} size={44} />
              <Text style={{ fontSize: 16, fontFamily: "InstrumentSans_600SemiBold", color: colors.cream }}>
                Tap to add a photo
              </Text>
              <Text style={{ fontSize: 13, color: colors.mintMuted }}>analyzed live by AI</Text>
            </Pressable>
            <Button
              label="No photo handy? Try the sample amethyst"
              variant="outlineLight"
              onPress={() => runWithUri(null, true)}
              style={{ minHeight: 44 }}
            />
            <Text style={{ fontSize: 12.5, color: colors.mintMuted, textAlign: "center" }}>
              {VISUAL_CHECK_DISCLAIMER}
            </Text>
          </>
        )}

        {step === "analyzing" && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 26, paddingVertical: 80 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              {uri ? (
                <Image source={{ uri }} style={{ width: 160, height: 160, borderRadius: 28 }} />
              ) : (
                <Swatch colors={["#6E5A9E", "#3E3268"]} style={{ width: 160, height: 160, borderRadius: 28 }} />
              )}
            </Animated.View>
            <Text style={{ fontSize: 16.5, fontFamily: "InstrumentSans_600SemiBold", color: colors.cream }}>
              {msg}
            </Text>
            <View
              style={{
                width: 200,
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(245,242,235,0.15)",
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{ height: 6, borderRadius: 3, backgroundColor: colors.mint, width: barWidth }}
              />
            </View>
          </View>
        )}

        {step === "result" && (
          <>
            <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
              {uri ? (
                <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: 18 }} />
              ) : (
                <Swatch colors={["#6E5A9E", "#3E3268"]} style={{ width: 84, height: 84, borderRadius: 18 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.5, color: colors.mintMuted }}>
                  Most likely
                </Text>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 32, lineHeight: 36, color: colors.cream }}>
                  {R.species}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: confBg,
                    borderRadius: 12,
                    paddingHorizontal: 11,
                    paddingVertical: 4,
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: "InstrumentSans_600SemiBold", color: colors.primaryHover }}>
                    {R.confidence} confidence
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ backgroundColor: "rgba(245,242,235,0.08)", borderRadius: 18, padding: 16 }}>
              <Text
                style={{
                  fontSize: 12.5,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: colors.mintMuted,
                  marginBottom: 12,
                }}
              >
                Watch out for
              </Text>
              <View style={{ gap: 12 }}>
                {R.flags.map((f) => (
                  <View key={f} style={{ flexDirection: "row", gap: 10 }}>
                    <Text style={{ color: colors.warn }}>▲</Text>
                    <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.cream }}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ backgroundColor: "rgba(245,242,235,0.08)", borderRadius: 18, padding: 16 }}>
              <Text style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.5, color: colors.mintMuted }}>
                Typical price · {R.size}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: colors.mintMuted }}>${R.low}</Text>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: colors.cream }}>
                  ${R.mid}{" "}
                  <Text style={{ fontSize: 13, fontFamily: "InstrumentSans_600SemiBold", color: colors.mint }}>
                    {R.note}
                  </Text>
                </Text>
                <Text style={{ fontSize: 13, color: colors.mintMuted }}>${R.high}</Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(245,242,235,0.15)",
                  marginTop: 10,
                  position: "relative",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    top: 0,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(159,201,168,0.4)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: "42%",
                    top: -3,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: colors.mint,
                    borderWidth: 2,
                    borderColor: colors.primaryHover,
                  }}
                />
              </View>
              <Text style={{ fontSize: 12, color: colors.mintMuted, marginTop: 10 }}>{R.source}</Text>
            </View>

            <Pressable
              onPress={() => router.push("/paywall")}
              style={{
                backgroundColor: colors.surfaceWarm,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: colors.warnInk, fontSize: 13.5, fontFamily: "InstrumentSans_500Medium", textAlign: "center" }}>
                {checksLeft} free checks left · <Text style={{ textDecorationLine: "underline" }}>go unlimited with Sage+</Text>
              </Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Button
                label="Save to catalog"
                variant="cream"
                onPress={() =>
                  router.push({
                    pathname: "/specimen/new",
                    params: { species: R.species },
                  })
                }
                style={{ flex: 1 }}
              />
              <Button label="Done" variant="outlineLight" onPress={close} style={{ flex: 1 }} />
            </View>
            <Text style={{ fontSize: 12, color: colors.mintMuted, textAlign: "center" }}>
              {VISUAL_CHECK_DISCLAIMER}
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
