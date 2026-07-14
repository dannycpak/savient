import { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Screen, Card, Button, Field, Eyebrow } from "@/components/ui";
import { space, type } from "@/constants/theme";

type Order = {
  id: string;
  status: string;
  amount_cents: number;
  tracking_number: string | null;
  listings?: { title: string } | null;
};

export default function SellerOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data: seller } = await supabase
          .from("sellers")
          .select("id")
          .eq("profile_id", userData.user.id)
          .maybeSingle();
        if (!seller) {
          setRows([]);
          return;
        }
        const { data } = await supabase
          .from("orders")
          .select("id, status, amount_cents, tracking_number, listings(title)")
          .eq("seller_id", seller.id)
          .order("created_at", { ascending: false });
        setRows((data as unknown as Order[]) ?? []);
      })();
    }, []),
  );

  const ship = async (orderId: string) => {
    const tn = tracking[orderId]?.trim();
    if (!tn) {
      Alert.alert("Add a tracking number");
      return;
    }
    setBusyId(orderId);
    try {
      await api.addTracking(orderId, tn);
      Alert.alert("Shipped", "Buyer can confirm delivery to release escrow.");
      setRows((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "shipped", tracking_number: tn } : o)),
      );
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
            <Text style={type.h1}>Seller orders</Text>
            <Text style={type.caption}>Add tracking to move escrow_held → shipped.</Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={type.body}>No orders yet.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <Eyebrow>{item.status}</Eyebrow>
            <Text style={type.h2}>{item.listings?.title ?? "Listing"}</Text>
            <Text style={type.caption}>${(item.amount_cents / 100).toLocaleString()}</Text>
            {item.tracking_number ? (
              <Text style={type.caption}>Tracking: {item.tracking_number}</Text>
            ) : (
              ["escrow_held", "pending"].includes(item.status) && (
                <>
                  <Field
                    label="Tracking number"
                    value={tracking[item.id] ?? ""}
                    onChangeText={(t) => setTracking((s) => ({ ...s, [item.id]: t }))}
                  />
                  <Button
                    label="Mark shipped"
                    onPress={() => ship(item.id)}
                    loading={busyId === item.id}
                  />
                </>
              )
            )}
            <Button
              label="View listing"
              variant="ghost"
              onPress={() => router.push(`/(tabs)/market`)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
