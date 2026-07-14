import { Pressable, Text, View } from "react-native";
import { Card, Eyebrow } from "@/components/ui";
import { VisualCheckDisclaimer } from "@/components/VisualCheckDisclaimer";
import { formatMoney, formatPercent, formatRelativeDate } from "@/lib/format";
import { colors, space, type } from "@/constants/theme";

export type CheckResultBody = {
  candidates?: { species: string; confidence: number; notes: string }[];
  observations?: string;
  red_flags?: string[];
  price_range?: { low_cents: number; high_cents: number; currency: string } | null;
};

export function CheckResultCard({
  result,
  createdAt,
  status,
  onPress,
  showDisclaimer,
}: {
  result: CheckResultBody | null;
  createdAt?: string;
  status?: string;
  onPress?: () => void;
  showDisclaimer?: boolean;
}) {
  const top = result?.candidates?.[0];
  const range = result?.price_range;
  const flags = result?.red_flags ?? [];

  const body = (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Eyebrow>{status === "failed" ? "Failed" : "Most likely"}</Eyebrow>
        {createdAt ? <Text style={type.caption}>{formatRelativeDate(createdAt)}</Text> : null}
      </View>
      <Text style={type.h1}>{top?.species ?? (status === "failed" ? "Check failed" : "Unclear")}</Text>
      {top ? (
        <Text style={type.caption}>
          Confidence {formatPercent(top.confidence)}
          {top.notes ? ` · ${top.notes}` : ""}
        </Text>
      ) : null}
      {result?.observations ? (
        <Text style={[type.body, { marginTop: space.xs }]} numberOfLines={onPress ? 3 : undefined}>
          {result.observations}
        </Text>
      ) : null}
      {range ? (
        <Text style={type.caption}>
          Price range {formatMoney(range.low_cents)} – {formatMoney(range.high_cents)}
        </Text>
      ) : null}
      {flags.length > 0 && !onPress ? (
        <View style={{ marginTop: space.sm, gap: space.xs }}>
          <Eyebrow>Watch out for</Eyebrow>
          {flags.map((f, i) => (
            <Text key={i} style={[type.body, { color: colors.danger }]}>
              · {f}
            </Text>
          ))}
        </View>
      ) : flags.length > 0 ? (
        <Text style={[type.caption, { color: colors.danger }]}>
          {flags.length} red flag{flags.length === 1 ? "" : "s"}
        </Text>
      ) : null}
      {showDisclaimer ? <VisualCheckDisclaimer /> : null}
    </Card>
  );

  if (onPress) return <Pressable onPress={onPress}>{body}</Pressable>;
  return body;
}
