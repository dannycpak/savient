import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { colors, radius, space, type } from "@/constants/theme";

type Specimen = { id: string; species: string; est_value_cents: number | null; created_at: string };

function Sparkline() {
  return (
    <Svg width={72} height={28} viewBox="0 0 72 28">
      <Path
        d="M2 22 C12 20, 18 10, 28 12 S42 4, 52 8 S64 16, 70 6"
        stroke={colors.positive}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function Home() {
  const [valueCents, setValueCents] = useState(0);
  const [recent, setRecent] = useState<Specimen[]>([]);
  const [name, setName] = useState("Collector");
  const [initial, setInitial] = useState("S");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase.from("profiles").select("display_name").maybeSingle();
        if (prof?.display_name) {
          setName(prof.display_name.split(" ")[0] ?? "Collector");
          setInitial((prof.display_name[0] ?? "S").toUpperCase());
        }
        const { data } = await supabase
          .from("specimens")
          .select("id, species, est_value_cents, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        const rows = (data as Specimen[]) ?? [];
        setRecent(rows);
        const { data: all } = await supabase.from("specimens").select("est_value_cents");
        const total = ((all as { est_value_cents: number | null }[]) ?? []).reduce(
          (s, r) => s + (r.est_value_cents ?? 0),
          0,
        );
        setValueCents(total);
      })();
    }, []),
  );

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 30, color: colors.ink }}>
            Sage
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.onDark, fontFamily: "InstrumentSans_600SemiBold" }}>{initial}</Text>
          </Pressable>
        </View>

        <Text style={{ ...type.caption, fontSize: 15 }}>Good to see you, {name}.</Text>

        <View
          style={{
            backgroundColor: colors.primaryHover,
            borderRadius: radius.lg,
            padding: 22,
            gap: 8,
          }}
        >
          <Eyebrow onDark>Collection value</Eyebrow>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular",
                fontSize: 42,
                color: colors.onDark,
              }}
            >
              ${(valueCents / 100).toLocaleString()}
            </Text>
            <Sparkline />
          </View>
          <Text style={{ color: colors.onDarkMuted, fontSize: 13 }}>{COPY.tagline}</Text>
        </View>

        <Card style={{ backgroundColor: colors.chip, borderColor: colors.border }}>
          <Text style={type.h2}>Eyeing a purchase?</Text>
          <Text style={type.caption}>Get a second opinion in seconds.</Text>
          <Button label="Run a Visual Check" onPress={() => router.push("/(tabs)/check")} />
        </Card>

        <View style={{ gap: space.sm }}>
          <Text style={type.h2}>Recent activity</Text>
          {recent.length === 0 ? (
            <Card>
              <Text style={type.body}>Nothing yet. Add a specimen or run a Visual Check.</Text>
            </Card>
          ) : (
            recent.map((r) => (
              <Pressable key={r.id} onPress={() => router.push(`/specimen/${r.id}`)}>
                <Card>
                  <Text style={type.body}>{r.species} added to catalog</Text>
                  <Text style={type.caption}>
                    {r.est_value_cents != null
                      ? `Est. $${(r.est_value_cents / 100).toLocaleString()}`
                      : "Value pending"}
                  </Text>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
