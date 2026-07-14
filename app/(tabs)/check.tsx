// Visual Check — photo → upload (EXIF-stripped) → edge function → result.
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { api, ApiError, type VisualCheckResult } from "@/lib/api";
import { uploadPrivateImage } from "@/lib/photos";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { VISUAL_CHECK_DISCLAIMER } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

export default function Check() {
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
        Alert.alert("Camera permission needed", "Enable camera access in Settings to photograph specimens.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!res.canceled) {
        setUri(res.assets[0].uri);
        setResult(null);
      }
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos permission needed", "Enable photo library access to upload specimen images.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1, mediaTypes: ["images"] });
    if (!res.canceled) {
      setUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const run = async () => {
    if (!uri) return;
    setBusy(true);
    try {
      const path = await uploadPrivateImage("check-uploads", uri);
      setResult(await api.visualCheck(path));
    } catch (e) {
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
    } finally {
      setBusy(false);
    }
  };

  const top = result?.result.candidates?.[0];
  const range = result?.result.price_range;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Pressable onPress={chooseSource}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: "100%", height: 260, borderRadius: radius.lg }}
            />
          ) : (
            <Card style={{ height: 260, alignItems: "center", justifyContent: "center" }}>
              <Text style={type.h2}>Tap to add a photo</Text>
              <Text style={type.caption}>Camera or library · EXIF/GPS stripped before upload.</Text>
            </Card>
          )}
        </Pressable>

        {uri && !result && <Button label="Run Visual Check" onPress={run} loading={busy} />}

        {result && (
          <>
            <Card>
              <Eyebrow>Most likely</Eyebrow>
              <Text style={type.h1}>{top?.species ?? "Unclear"}</Text>
              {top && (
                <Text style={type.caption}>
                  Confidence {(top.confidence * 100).toFixed(0)}% · {top.notes}
                </Text>
              )}
              <Text style={[type.body, { marginTop: space.sm }]}>
                {result.result.observations}
              </Text>
              {range && (
                <Text style={type.caption}>
                  Price range ${(range.low_cents / 100).toLocaleString()} – $
                  {(range.high_cents / 100).toLocaleString()}
                </Text>
              )}
            </Card>
            {result.result.red_flags.length > 0 && (
              <Card style={{ borderColor: colors.danger }}>
                <Eyebrow>Watch out for</Eyebrow>
                {result.result.red_flags.map((f, i) => (
                  <Text key={i} style={type.body}>
                    · {f}
                  </Text>
                ))}
              </Card>
            )}
            <Button
              label="Save to catalog"
              onPress={() =>
                router.push({
                  pathname: "/specimen/new",
                  params: { species: top?.species ?? "" },
                })
              }
            />
            <Text style={[type.caption, { textAlign: "center" }]}>
              {VISUAL_CHECK_DISCLAIMER}
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
