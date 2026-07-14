import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Card, Button } from "@/components/ui";
import { CheckResultCard, type CheckResultBody } from "@/components/CheckResultCard";
import { space, type } from "@/constants/theme";

type Row = {
  id: string;
  status: string;
  result_json: CheckResultBody | null;
  confidence: number | null;
  created_at: string;
  consumed: string | null;
};

export default function CheckHistory() {
  const [rows, setRows] = useState<Row[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from("visual_checks")
          .select("id, status, result_json, confidence, created_at, consumed")
          .order("created_at", { ascending: false })
          .limit(100);
        setRows((data as Row[]) ?? []);
      })();
    }, []),
  );

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md, gap: space.sm }}>
            <Text style={type.h1}>Check history</Text>
            <Text style={type.caption}>Past Visual Checks — second opinions only.</Text>
            <Button label="Run a new check" onPress={() => router.push("/(tabs)/check")} />
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>No checks yet. Run your first Visual Check from a photo.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <CheckResultCard
            result={item.result_json}
            status={item.status}
            createdAt={item.created_at}
            onPress={() => router.push(`/check/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}
