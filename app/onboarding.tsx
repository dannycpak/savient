import { Text, View } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Screen, Button, Card, Eyebrow } from "@/components/ui";
import { COPY } from "@/constants/copy";
import { space, type } from "@/constants/theme";

const CARDS = [
  {
    title: "Catalog with care",
    body: "Keep species, locality, provenance, and value in one calm cabinet.",
  },
  {
    title: "Visual Check",
    body: "A second opinion at the moment of purchase uncertainty — never a certificate.",
  },
  {
    title: "Trust before trade",
    body: "Seller credibility grows from accuracy ratings. Marketplace comes after trust.",
  },
];

export default function Onboarding() {
  const finish = async () => {
    await SecureStore.setItemAsync("sage.onboarding.done", "1");
    router.replace("/(auth)/login");
  };

  return (
    <Screen style={{ justifyContent: "space-between" }}>
      <View style={{ gap: space.lg, marginTop: space.xl }}>
        <Text style={type.display}>{COPY.appName}</Text>
        <Text style={type.body}>{COPY.tagline}</Text>
        {CARDS.map((c) => (
          <Card key={c.title}>
            <Eyebrow>Sage</Eyebrow>
            <Text style={type.h2}>{c.title}</Text>
            <Text style={type.body}>{c.body}</Text>
          </Card>
        ))}
      </View>
      <View style={{ gap: space.sm }}>
        <Button label="Get started" onPress={finish} />
        <Button label="Skip" variant="ghost" onPress={finish} />
      </View>
    </Screen>
  );
}
