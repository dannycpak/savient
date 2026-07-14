import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space, type } from "@/constants/theme";

export function Screen({
  style,
  children,
  dark,
  ...rest
}: ViewProps & { dark?: boolean }) {
  return (
    <SafeAreaView
      style={[styles.screen, dark && styles.screenDark, style]}
      {...rest}
    >
      {children}
    </SafeAreaView>
  );
}

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Eyebrow({ children, onDark }: { children: string; onDark?: boolean }) {
  return (
    <Text style={[type.label, onDark && { color: colors.onDarkMuted }]}>{children}</Text>
  );
}

export function Button({
  label,
  onPress,
  loading,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger" | "bone" | "ink";
  disabled?: boolean;
}) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : variant === "bone"
          ? colors.onDark
          : variant === "ink"
            ? colors.ink
            : "transparent";
  const fg =
    variant === "ghost"
      ? colors.primary
      : variant === "bone"
        ? colors.primaryHover
        : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || disabled || loading ? 0.75 : 1 },
        variant === "ghost" && styles.buttonGhost,
        variant === "bone" && styles.buttonBone,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function ChipButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      {label ? <Text style={styles.dividerLabel}>{label}</Text> : null}
      <View style={styles.dividerLine} />
    </View>
  );
}

export function SuccessMark() {
  return (
    <View style={styles.successMark}>
      <Text style={{ color: colors.success, fontSize: 28, fontWeight: "600" }}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
  },
  screenDark: {
    backgroundColor: colors.primaryHover,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonBone: {
    borderWidth: 0,
  },
  buttonLabel: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 16,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    color: colors.ink,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 16,
    color: colors.ink,
    minHeight: 52,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13,
    color: colors.faint,
  },
  successMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
