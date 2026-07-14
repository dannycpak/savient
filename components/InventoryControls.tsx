import { Pressable, Text, TextInput, View } from "react-native";
import { colors, radius, space, type } from "@/constants/theme";

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.sm,
              backgroundColor: active ? colors.primary : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...type.caption,
                color: active ? colors.white : colors.muted,
                fontFamily: active ? "InstrumentSans_600SemiBold" : "InstrumentSans_400Regular",
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        paddingHorizontal: space.md,
        paddingVertical: 12,
        fontFamily: "InstrumentSans_400Regular",
        fontSize: 16,
        color: colors.ink,
      }}
    />
  );
}

export function CapacityMeter({
  used,
  cap,
  label,
}: {
  used: number;
  cap: number | null;
  label: string;
}) {
  const unlimited = cap == null;
  const pct = unlimited ? 0.15 : Math.min(1, used / Math.max(cap, 1));
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={type.caption}>{label}</Text>
        <Text style={type.caption}>{unlimited ? `${used} · unlimited` : `${used} / ${cap}`}</Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: !unlimited && pct >= 1 ? colors.danger : colors.primary,
          }}
        />
      </View>
    </View>
  );
}
