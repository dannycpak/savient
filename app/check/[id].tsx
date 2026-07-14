import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { CheckResultCard, type CheckResultBody } from "@/components/CheckResultCard";
import { formatPercent, formatRelativeDate } from "@/lib/format";
import { space, type } from "@/constants/theme";

type CheckRow = {
  id: string;
  status: string;
  result_json: CheckResultBody | null;
  confidence: number | null;
  created_at: string;
  completed_at: string | null;
  consumed: string | null;
  model_used: string | null;
  image_path: string;
};

export default function CheckDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [row, setRow] = useState<CheckRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data, error } = await supabase
          .from("visual_checks")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          Alert.alert("Not found", error.message);
          router.back();
          return;
        }
        setRow(data as CheckRow);
      })();
    }, [id]),
  );

  if (!row) {
    return (
      <Screen>
        <Text style={type.body}>Loading…</Text>
      </Screen>
    );
  }

  const top = row.result_json?.candidates?.[0];

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={{ gap: space.xs }}>
          <Text style={type.h1}>Check detail</Text>
          <Text style={type.caption}>
            {formatRelativeDate(row.created_at)} · {row.status}
            {row.consumed ? ` · used ${row.consumed}` : ""}
          </Text>
        </View>

        <CheckResultCard result={row.result_json} status={row.status} showDisclaimer />

        <Card>
          <Eyebrow>Meta</Eyebrow>
          <Text style={type.body}>Confidence {formatPercent(row.confidence ?? top?.confidence)}</Text>
          <Text style={type.caption}>Model {row.model_used ?? "—"}</Text>
          {row.completed_at ? (
            <Text style={type.caption}>Completed {formatRelativeDate(row.completed_at)}</Text>
          ) : null}
        </Card>

        {top?.species ? (
          <Button
            label="Save to catalog"
            onPress={() =>
              router.push({
                pathname: "/specimen/new",
                params: {
                  species: top.species,
                  checkId: row.id,
                  estLow: String(row.result_json?.price_range?.low_cents ?? ""),
                  estHigh: String(row.result_json?.price_range?.high_cents ?? ""),
                },
              })
            }
          />
        ) : null}
        <Button label="Run another check" variant="ghost" onPress={() => router.push("/(tabs)/check")} />
      </ScrollView>
    </Screen>
  );
}
