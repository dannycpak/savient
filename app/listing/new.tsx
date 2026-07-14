import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Screen, Button, Field, Card } from "@/components/ui";
import { space, type } from "@/constants/theme";

export default function NewListing() {
  const [title, setTitle] = useState("");
  const [species, setSpecies] = useState("");
  const [locality, setLocality] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (publish: boolean) => {
    if (!title.trim() || !species.trim() || !price.trim()) {
      Alert.alert("Title, species, and price are required");
      return;
    }
    const cents = Math.round(parseFloat(price) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      Alert.alert("Enter a valid price");
      return;
    }

    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { data: seller } = await supabase
        .from("sellers")
        .select("id, connect_onboarding_status")
        .eq("profile_id", userData.user.id)
        .single();
      if (!seller) throw new Error("Complete seller onboarding first");
      if (publish && seller.connect_onboarding_status !== "active") {
        throw new Error("Stripe Connect must be active before publishing");
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          seller_id: seller.id,
          title: title.trim(),
          species: species.trim(),
          locality: locality.trim() || null,
          description: description.trim() || null,
          price_cents: cents,
          status: publish ? "active" : "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      router.replace(`/listing/${data.id}`);
    } catch (e) {
      Alert.alert("Could not save listing", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <Text style={type.h1}>New listing</Text>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Species" value={species} onChangeText={setSpecies} autoCapitalize="words" />
        <Field label="Locality" value={locality} onChangeText={setLocality} autoCapitalize="words" />
        <Field label="Description" value={description} onChangeText={setDescription} />
        <Field label="Price (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <Card>
          <Text style={type.caption}>
            Publishing requires an active Stripe Connect account. Price math stays server-side at
            checkout.
          </Text>
        </Card>
        <Button label="Publish" onPress={() => save(true)} loading={busy} />
        <Button label="Save draft" variant="ghost" onPress={() => save(false)} disabled={busy} />
      </ScrollView>
    </Screen>
  );
}
