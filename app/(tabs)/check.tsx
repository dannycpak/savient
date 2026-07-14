import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { api, ApiError } from "@/lib/api";
import { stripExifAndResize } from "@/lib/images";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { CheckResultCard } from "@/components/CheckResultCard";
import { CapacityMeter } from "@/components/InventoryControls";
import { VisualCheckDisclaimer } from "@/components/VisualCheckDisclaimer";
import { FREE_TIER } from "@/constants/copy";
import { radius, space, type } from "@/constants/theme";

type ProfileBits = {
  plan: "free" | "plus";
  checks_used_month: number;
};

export default function Check() {
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkId, setCheckId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    candidates: { species: string; confidence: number; notes: string }[];
    observations: string;
    red_flags: string[];
    price_range?: { low_cents: number; high_cents: number; currency: string } | null;
  } | null>(null);
  const [profile, setProfile] = useState<ProfileBits | null>(null);
  const [credits, setCredits] = useState(0);
  const [recentCount, setRecentCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase
          .from("profiles")
          .select("plan, checks_used_month")
          .single();
        if (prof) setProfile(prof as ProfileBits);
        const { data: bal } = await supabase.rpc("credits_balance");
        if (typeof bal === "number") setCredits(bal);
        const { count } = await supabase
          .from("visual_checks")
          .select("id", { count: "exact", head: true });
        setRecentCount(count ?? 0);
      })();
    }, []),
  );

  const pick = async (fromCamera: boolean) => {
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!res.canceled) {
      setUri(res.assets[0].uri);
      setResult(null);
      setCheckId(null);
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
      const res = await api.visualCheck(path);
      setCheckId(res.id);
      setResult(res.result);
      if (profile?.plan !== "plus") {
        setProfile((p) =>
          p ? { ...p, checks_used_month: p.checks_used_month + 1 } : p,
        );
      }
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

  const top = result?.candidates?.[0];
  const used = profile?.checks_used_month ?? 0;
  const plus = profile?.plan === "plus";

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={{ gap: space.xs }}>
          <Text style={type.h1}>Visual Check</Text>
          <Text style={type.caption}>A second opinion at the moment of purchase uncertainty.</Text>
        </View>

        <CapacityMeter
          used={used}
          cap={plus ? null : FREE_TIER.checksPerMonth}
          label={plus ? "Sage+ · unlimited checks" : "Free checks this month"}
        />
        {!plus && credits > 0 ? (
          <Text style={type.caption}>{credits} credit-pack checks available after free allowance</Text>
        ) : null}

        <Pressable onPress={() => pick(false)}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: "100%", height: 260, borderRadius: radius.lg }}
            />
          ) : (
            <Card style={{ height: 220, alignItems: "center", justifyContent: "center" }}>
              <Text style={type.h2}>Tap to add a photo</Text>
              <Text style={type.caption}>Sharp, well-lit, neutral background works best.</Text>
            </Card>
          )}
        </Pressable>

        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Library" variant="ghost" onPress={() => pick(false)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Camera" variant="ghost" onPress={() => pick(true)} />
          </View>
        </View>

        {uri && !result && <Button label="Run Visual Check" onPress={run} loading={busy} />}

        {result && (
          <>
            <CheckResultCard result={result} showDisclaimer />
            {result.candidates && result.candidates.length > 1 ? (
              <Card>
                <Eyebrow>Other candidates</Eyebrow>
                {result.candidates.slice(1).map((c, i) => (
                  <Text key={i} style={type.body}>
                    {c.species} · {Math.round(c.confidence * 100)}%
                  </Text>
                ))}
              </Card>
            ) : null}
            <Button
              label="Save to catalog"
              onPress={() =>
                router.push({
                  pathname: "/specimen/new",
                  params: {
                    species: top?.species ?? "",
                    checkId: checkId ?? "",
                    estLow: String(result.price_range?.low_cents ?? ""),
                    estHigh: String(result.price_range?.high_cents ?? ""),
                  },
                })
              }
            />
            <Button
              label="New check"
              variant="ghost"
              onPress={() => {
                setUri(null);
                setResult(null);
                setCheckId(null);
              }}
            />
          </>
        )}

        <Button
          label={recentCount > 0 ? `Check history (${recentCount})` : "Check history"}
          variant="ghost"
          onPress={() => router.push("/check/history")}
        />

        {!result ? <VisualCheckDisclaimer /> : null}
      </ScrollView>
    </Screen>
  );
}
