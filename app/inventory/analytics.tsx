import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { space, type } from "@/constants/theme";

type Spec = {
  id: string;
  species: string;
  locality: string | null;
  est_value_cents: number | null;
  acquisition_price_cents: number | null;
  rarity: string | null;
};

export default function InventoryAnalytics() {
  const [rows, setRows] = useState<Spec[]>([]);
  const [plan, setPlan] = useState<"free" | "plus">("free");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: prof } = await supabase.from("profiles").select("plan").single();
        if (prof) setPlan(prof.plan as "free" | "plus");
        const { data } = await supabase
          .from("specimens")
          .select("id, species, locality, est_value_cents, acquisition_price_cents, rarity");
        setRows((data as Spec[]) ?? []);
      })();
    }, []),
  );

  const stats = useMemo(() => {
    const valued = rows.filter((r) => r.est_value_cents != null);
    const totalEst = valued.reduce((s, r) => s + (r.est_value_cents ?? 0), 0);
    const totalPaid = rows.reduce((s, r) => s + (r.acquisition_price_cents ?? 0), 0);
    const avg = valued.length ? Math.round(totalEst / valued.length) : 0;
    const top = [...valued].sort((a, b) => (b.est_value_cents ?? 0) - (a.est_value_cents ?? 0)).slice(0, 5);

    const byLocality = new Map<string, number>();
    for (const r of rows) {
      const key = r.locality?.trim() || "Unknown locality";
      byLocality.set(key, (byLocality.get(key) ?? 0) + (r.est_value_cents ?? 0));
    }
    const localities = [...byLocality.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const bySpecies = new Map<string, number>();
    for (const r of rows) {
      bySpecies.set(r.species, (bySpecies.get(r.species) ?? 0) + 1);
    }
    const species = [...bySpecies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    return { totalEst, totalPaid, avg, top, localities, species, valuedCount: valued.length };
  }, [rows]);

  if (plan !== "plus") {
    return (
      <Screen style={{ gap: space.lg }}>
        <Text style={type.h1}>Collection analytics</Text>
        <Card>
          <Text style={type.body}>
            Full valuation analytics are included with Sage+ — species mix, locality value, and
            acquisition vs estimated totals.
          </Text>
        </Card>
        <Button label="Upgrade to Sage+" onPress={() => router.push("/paywall")} />
        <Button label="Back to catalog" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>Collection analytics</Text>
        <Text style={type.caption}>{rows.length} specimens · {stats.valuedCount} with estimates</Text>

        <Card>
          <Eyebrow>Estimated value</Eyebrow>
          <Text style={type.display}>{formatMoney(stats.totalEst)}</Text>
          <Text style={type.caption}>Average per valued piece {formatMoney(stats.avg)}</Text>
        </Card>

        <Card>
          <Eyebrow>Acquisition cost</Eyebrow>
          <Text style={type.h1}>{formatMoney(stats.totalPaid)}</Text>
          <Text style={type.caption}>
            Paper gain/loss {formatMoney(stats.totalEst - stats.totalPaid)}
          </Text>
        </Card>

        <Card>
          <Eyebrow>Top specimens</Eyebrow>
          {stats.top.length === 0 ? (
            <Text style={type.body}>Add estimated values to see rankings.</Text>
          ) : (
            stats.top.map((r) => (
              <View key={r.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={type.body} onPress={() => router.push(`/specimen/${r.id}`)}>
                  {r.species}
                </Text>
                <Text style={type.caption}>{formatMoney(r.est_value_cents)}</Text>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Eyebrow>Value by locality</Eyebrow>
          {stats.localities.map(([name, cents]) => (
            <View key={name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={type.body}>{name}</Text>
              <Text style={type.caption}>{formatMoney(cents)}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Eyebrow>Species mix</Eyebrow>
          {stats.species.map(([name, count]) => (
            <View key={name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={type.body}>{name}</Text>
              <Text style={type.caption}>{count}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
