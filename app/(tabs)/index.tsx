import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { formatMoney, formatRelativeDate } from "@/lib/format";
import { space, type } from "@/constants/theme";

type Specimen = {
  id: string;
  species: string;
  est_value_cents: number | null;
  created_at: string;
};

type Check = {
  id: string;
  status: string;
  result_json: { candidates?: { species: string }[] } | null;
  created_at: string;
};

type PendingOrder = {
  id: string;
  status: string;
  listings?: { title: string; species: string } | null;
};

type Activity =
  | { kind: "specimen"; id: string; title: string; subtitle: string; at: string }
  | { kind: "check"; id: string; title: string; subtitle: string; at: string };

export default function Home() {
  const [valueCents, setValueCents] = useState(0);
  const [count, setCount] = useState(0);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [plan, setPlan] = useState<"free" | "plus">("free");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: all } = await supabase
          .from("specimens")
          .select("id, species, est_value_cents, created_at")
          .order("created_at", { ascending: false });
        const specimens = (all as Specimen[]) ?? [];
        setCount(specimens.length);
        setValueCents(specimens.reduce((s, r) => s + (r.est_value_cents ?? 0), 0));

        const { data: checks } = await supabase
          .from("visual_checks")
          .select("id, status, result_json, created_at")
          .order("created_at", { ascending: false })
          .limit(8);
        const checkRows = (checks as Check[]) ?? [];

        const merged: Activity[] = [
          ...specimens.slice(0, 8).map((r) => ({
            kind: "specimen" as const,
            id: r.id,
            title: `${r.species} added to catalog`,
            subtitle:
              r.est_value_cents != null
                ? `Est. ${formatMoney(r.est_value_cents)}`
                : "Value pending",
            at: r.created_at,
          })),
          ...checkRows.map((c) => ({
            kind: "check" as const,
            id: c.id,
            title: `${c.result_json?.candidates?.[0]?.species ?? "Specimen"} Visual Check`,
            subtitle: c.status === "complete" ? "Price range updated" : c.status,
            at: c.created_at,
          })),
        ]
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 10);
        setActivity(merged);

        const { data: orders } = await supabase
          .from("orders")
          .select("id, status, listings(title, species)")
          .in("status", ["released", "delivered"])
          .order("created_at", { ascending: false })
          .limit(10);
        const orderRows = (orders as unknown as PendingOrder[]) ?? [];
        const needsRating: PendingOrder[] = [];
        for (const o of orderRows) {
          const { count: rc } = await supabase
            .from("ratings")
            .select("id", { count: "exact", head: true })
            .eq("order_id", o.id);
          if ((rc ?? 0) === 0) needsRating.push(o);
        }
        setPending(needsRating.slice(0, 3));

        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
      })();
    }, []),
  );

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <View style={{ gap: space.xs }}>
          <Eyebrow>Collection value</Eyebrow>
          <Text style={type.display}>{formatMoney(valueCents)}</Text>
          <Text style={type.caption}>
            {count} specimen{count === 1 ? "" : "s"} · {COPY.tagline}
          </Text>
        </View>

        <Button label="Run a Visual Check" onPress={() => router.push("/(tabs)/check")} />
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Catalog" variant="ghost" onPress={() => router.push("/(tabs)/catalog")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Analytics"
              variant="ghost"
              onPress={() =>
                plan === "plus" ? router.push("/inventory/analytics") : router.push("/paywall")
              }
            />
          </View>
        </View>

        {pending.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <Text style={type.h2}>Pending ratings</Text>
            {pending.map((o) => (
              <Card key={o.id}>
                <Eyebrow>Rate your purchase</Eyebrow>
                <Text style={type.body}>
                  Rate your {o.listings?.species ?? o.listings?.title ?? "specimen"} purchase
                </Text>
                <Button label="Rate now" onPress={() => router.push(`/rate/${o.id}`)} />
              </Card>
            ))}
          </View>
        ) : null}

        <View style={{ gap: space.sm }}>
          <Text style={type.h2}>Recent activity</Text>
          {activity.length === 0 ? (
            <Card>
              <Text style={type.body}>Nothing yet. Add a specimen or run a Visual Check.</Text>
            </Card>
          ) : (
            activity.map((a) => (
              <Pressable
                key={`${a.kind}-${a.id}`}
                onPress={() =>
                  router.push(a.kind === "specimen" ? `/specimen/${a.id}` : `/check/${a.id}`)
                }
              >
                <Card>
                  <Text style={type.body}>{a.title}</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={type.caption}>{a.subtitle}</Text>
                    <Text style={type.caption}>{formatRelativeDate(a.at)}</Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
