// Visual Check — photo → upload (EXIF-stripped) → edge function → result.
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { api, ApiError, type VisualCheckResult } from "@/lib/api";
import { stripExifAndResize } from "@/lib/images";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { VISUAL_CHECK_DISCLAIMER } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

export default function Check() {
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VisualCheckResult | null>(null);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!res.canceled) {
      setUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const run = async () => {
    if (!uri) return;
    setBusy(true);
    try {
      const clean = await stripExifAndResize(uri);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const path = `${user.id}/${Date.now()}.jpg`;
      const file = await fetch(clean).then((r) => r.arrayBuffer());
      const { error: upErr } = await supabase.storage
        .from("check-uploads")
        .upload(path, file, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      setResult(await api.visualCheck(path));
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        Alert.alert("Out of checks", "You've used this month's free checks.", [
          { text: "Not now" },
          { text: "Get more", onPress: () => router.push("/paywall") },
        ]);
      } else if (e instanceof ApiError && e.status === 429) {
        Alert.alert("Slow down", "Too many checks — wait a minute and try again.");
      } else {
        Alert.alert("Check failed", "Something went wrong. Try again.");
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
        <Pressable onPress={pick}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: "100%", height: 260, borderRadius: radius.lg }}
            />
          ) : (
            <Card style={{ height: 260, alignItems: "center", justifyContent: "center" }}>
              <Text style={type.h2}>Tap to add a photo</Text>
              <Text style={type.caption}>Sharp, well-lit, neutral background works best.</Text>
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
