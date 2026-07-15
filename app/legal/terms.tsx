import { ScrollView, Text } from "react-native";
import { Screen, Card } from "@/components/ui";
import { TERMS_SECTIONS } from "@/constants/legal";
import { space, type } from "@/constants/theme";

export default function TermsOfUse() {
  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 48 }}>
        <Text style={type.h1}>Terms of Use</Text>
        <Text style={type.caption}>Last updated: {TERMS_SECTIONS.updated}</Text>
        {TERMS_SECTIONS.blocks.map((b) => (
          <Card key={b.title}>
            <Text style={type.h2}>{b.title}</Text>
            <Text style={type.body}>{b.body}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
