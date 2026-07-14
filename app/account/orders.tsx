import { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Screen, Card, Button, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

type Order = {
  id: string;
  status: string;
  amount_cents: number;
  tracking_number: string | null;
  listings?: { title: string } | null;
};

export default function BuyerOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, amount_cents, tracking_number, listings(title)")
      .order("created_at", { ascending: false });
    setRows((data as unknown as Order[]) ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirm = async (orderId: string) => {
    setBusyId(orderId);
    try {
      await api.confirmDelivery(orderId);
      Alert.alert("Confirmed", "Escrow release requested.");
      await load();
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.xl }}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md }}>
            <Text style={type.h1}>My purchases</Text>
            <Text style={type.caption}>Confirm delivery to release escrow to the seller.</Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>No purchases yet.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <Eyebrow>{item.status}</Eyebrow>
            <Text style={type.h2}>{item.listings?.title ?? "Listing"}</Text>
            <Text style={type.caption}>${(item.amount_cents / 100).toLocaleString()}</Text>
            {item.tracking_number && (
              <Text style={type.caption}>Tracking: {item.tracking_number}</Text>
            )}
            {["shipped", "escrow_held", "delivered"].includes(item.status) && (
              <Button
                label="Confirm delivery"
                onPress={() => confirm(item.id)}
                loading={busyId === item.id}
              />
            )}
            {["released", "delivered"].includes(item.status) && (
              <Button
                label="Rate purchase"
                variant="ghost"
                onPress={() => router.push(`/rate/${item.id}`)}
              />
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
