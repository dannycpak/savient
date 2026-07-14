import type { ReactNode } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space, type } from "@/constants/theme";

export function Screen({
  style,
  children,
  edges,
  ...rest
}: ViewProps & { edges?: ("top" | "right" | "bottom" | "left")[] }) {
  return (
    <SafeAreaView edges={edges ?? ["top", "left", "right"]} style={[styles.screen, style]} {...rest}>
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

export function Eyebrow({ children, color }: { children: string; color?: string }) {
  return <Text style={[type.label, color ? { color } : null]}>{children}</Text>;
}

export function Swatch({
  colors: stops,
  style,
  children,
}: {
  colors: [string, string];
  style?: object;
  children?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ overflow: "hidden", position: "relative" }, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function Avatar({
  initial,
  size = 38,
  bg = colors.primary,
}: {
  initial: string;
  size?: number;
  bg?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: colors.cream,
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: size * 0.38,
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.white,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
      }}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 13,
          color: selected ? colors.cream : colors.ink,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  loading,
  variant = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger" | "cream" | "ink" | "outlineLight";
  disabled?: boolean;
  style?: object;
}) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : variant === "cream"
          ? colors.cream
          : variant === "ink"
            ? colors.ink
            : "transparent";
  const fg =
    variant === "ghost"
      ? colors.primary
      : variant === "cream"
        ? colors.primaryHover
        : variant === "outlineLight"
          ? colors.cream
          : colors.cream;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || disabled || loading ? 0.75 : 1 },
        variant === "ghost" && styles.buttonGhost,
        variant === "outlineLight" && styles.buttonOutlineLight,
        style,
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

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text style={type.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" {...props} />
    </View>
  );
}

export function SoftInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      style={[styles.input, style]}
      autoCapitalize="none"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  buttonOutlineLight: {
    borderWidth: 1,
    borderColor: "rgba(245,242,235,0.35)",
  },
  buttonLabel: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 52,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 15,
    color: colors.ink,
  },
});
