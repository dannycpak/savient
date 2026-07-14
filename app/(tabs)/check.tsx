import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { api, ApiError, type VisualCheckResult } from "@/lib/api";
import { uploadPrivateImage } from "@/lib/photos";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { Swatch } from "@/components/Swatch";
import { VISUAL_CHECK_DISCLAIMER } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

type Phase = "idle" | "analyzing" | "result";

export default function Check() {
  const [uri, setUri] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<VisualCheckResult | null>(null);

  const chooseSource = () => {
    Alert.alert("Add a photo", "Choose a source for Visual Check.", [
      { text: "Cancel", style: "cancel" },
      { text: "Camera", onPress: () => pick("camera") },
      { text: "Photo library", onPress: () => pick("library") },
    ]);
  };

  const pick = async (source: "camera" | "library") => {
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera permission needed");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!res.canceled) {
        setUri(res.assets[0].uri);
        setResult(null);
        setPhase("idle");
      }
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos permission needed");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1, mediaTypes: ["images"] });
    if (!res.canceled) {
      setUri(res.assets[0].uri);
      setResult(null);
      setPhase("idle");
    }
  };

  const run = async () => {
    if (!uri) return;
    setPhase("analyzing");
    try {
      const path = await uploadPrivateImage("check-uploads", uri);
      const res = await api.visualCheck(path);
      setResult(res);
      setPhase("result");
    } catch (e) {
      setPhase("idle");
      if (e instanceof ApiError && e.status === 402) {
        Alert.alert("Out of checks", e.message || "You've used this month's free checks.", [
          { text: "Not now" },
          { text: "Get more", onPress: () => router.push("/paywall") },
        ]);
      } else if (e instanceof ApiError && e.status === 429) {
        Alert.alert("Slow down", e.message);
      } else {
        Alert.alert("Check failed", e instanceof Error ? e.message : "Something went wrong. Try again.");
      }
    }
  };

  const top = result?.result.candidates?.[0];
  const range = result?.result.price_range;
  const markerPct =
    range && range.high_cents > range.low_cents && top
      ? 45
      : 40;

  return (
    <Screen dark style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 48 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: colors.onDark }}>
            Visual Check
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.onDarkFaint, fontFamily: "InstrumentSans_500Medium" }}>Close</Text>
          </Pressable>
        </View>
        <Text style={{ color: colors.onDarkMuted, fontSize: 14.5 }}>
          A second opinion before you buy — never a certificate.
        </Text>

        <Pressable onPress={chooseSource}>
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", height: 260, borderRadius: radius.lg }} />
          ) : (
            <View
              style={{
                height: 260,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: "rgba(245,242,235,0.2)",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                overflow: "hidden",
              }}
            >
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.35 }}>
                <Swatch name="amethyst" height={260} rounded={0} />
              </View>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 26, color: colors.onDark }}>
                Tap to add a photo
              </Text>
              <Text style={{ color: colors.onDarkFaint, fontSize: 13 }}>Camera or library · EXIF stripped</Text>
            </View>
          )}
        </Pressable>

        {phase === "analyzing" && (
          <Card style={{ backgroundColor: "rgba(245,242,235,0.08)", borderColor: "rgba(245,242,235,0.15)" }}>
            <Text style={{ color: colors.onDark, fontFamily: "InstrumentSans_600SemiBold" }}>Analyzing…</Text>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(245,242,235,0.15)", overflow: "hidden" }}>
              <View style={{ width: "65%", height: "100%", backgroundColor: colors.positive }} />
            </View>
            <Text style={{ color: colors.onDarkMuted, fontSize: 13 }}>Comparing structure, color, and locality cues.</Text>
          </Card>
        )}

        {uri && phase === "idle" && <Button label="Run Visual Check" variant="bone" onPress={run} />}

        {phase === "result" && result && (
          <>
            <View style={{ gap: 6 }}>
              <Eyebrow onDark>Most likely</Eyebrow>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 32, color: colors.onDark }}>
                {top?.species ?? "Unclear"}
              </Text>
              {top && (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(159,201,168,0.2)",
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: colors.positive, fontFamily: "InstrumentSans_600SemiBold", fontSize: 12 }}>
                    {(top.confidence * 100).toFixed(0)}% confidence
                  </Text>
                </View>
              )}
              <Text style={{ color: colors.onDarkMuted, marginTop: 6 }}>{result.result.observations}</Text>
            </View>

            {result.result.red_flags.length > 0 && (
              <View style={{ gap: 10 }}>
                <Eyebrow onDark>Watch out for</Eyebrow>
                {result.result.red_flags.map((f, i) => (
                  <Text key={i} style={{ color: colors.onDark, fontSize: 14.5 }}>
                    ▲ {f}
                  </Text>
                ))}
              </View>
            )}

            {range && (
              <View style={{ gap: 8 }}>
                <Eyebrow onDark>Typical price</Eyebrow>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(245,242,235,0.15)" }}>
                  <View
                    style={{
                      position: "absolute",
                      left: `${markerPct}%`,
                      marginLeft: -6,
                      top: -4,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.positive,
                    }}
                  />
                </View>
                <Text style={{ color: colors.onDarkMuted, fontSize: 13 }}>
                  ${(range.low_cents / 100).toLocaleString()} – ${(range.high_cents / 100).toLocaleString()}
                </Text>
              </View>
            )}

            <Button
              label="Save to catalog"
              variant="bone"
              onPress={() =>
                router.push({ pathname: "/specimen/new", params: { species: top?.species ?? "" } })
              }
            />
            <Button label="Done" variant="ghost" onPress={() => { setResult(null); setUri(null); setPhase("idle"); }} />
            <Text style={{ color: colors.onDarkFaint, fontSize: 12.5, textAlign: "center", lineHeight: 18 }}>
              {VISUAL_CHECK_DISCLAIMER}
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
