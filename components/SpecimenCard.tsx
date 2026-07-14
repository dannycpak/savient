import { Image, Pressable, Text, View } from "react-native";
import { Card, Eyebrow } from "@/components/ui";
import { formatMoney, formatRelativeDate } from "@/lib/format";
import { colors, radius, space, type } from "@/constants/theme";

export type SpecimenListItem = {
  id: string;
  species: string;
  variety?: string | null;
  locality: string | null;
  est_value_cents: number | null;
  rarity?: string | null;
  created_at?: string;
  thumbUrl?: string | null;
};

export function SpecimenCard({
  item,
  onPress,
  compact,
}: {
  item: SpecimenListItem;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card style={compact ? { flexDirection: "row", gap: space.md, alignItems: "center" } : undefined}>
        {item.thumbUrl ? (
          <Image
            source={{ uri: item.thumbUrl }}
            style={
              compact
                ? { width: 64, height: 64, borderRadius: radius.md }
                : { width: "100%", height: 140, borderRadius: radius.md, marginBottom: space.xs }
            }
          />
        ) : (
          <View
            style={
              compact
                ? {
                    width: 64,
                    height: 64,
                    borderRadius: radius.md,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }
                : {
                    width: "100%",
                    height: 140,
                    borderRadius: radius.md,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: space.xs,
                  }
            }
          >
            <Text style={type.caption}>No photo</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          {item.rarity ? <Eyebrow>{item.rarity}</Eyebrow> : null}
          <Text style={type.h2} numberOfLines={1}>
            {item.species}
          </Text>
          {item.variety ? (
            <Text style={type.caption} numberOfLines={1}>
              {item.variety}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
            <Text style={type.caption} numberOfLines={1}>
              {item.locality ?? "Locality unknown"}
            </Text>
            <Text style={type.caption}>{formatMoney(item.est_value_cents)}</Text>
          </View>
          {item.created_at ? (
            <Text style={type.caption}>Added {formatRelativeDate(item.created_at)}</Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
