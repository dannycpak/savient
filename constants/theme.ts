export const colors = {
  bg: "#F5F2EB",
  bone: "#EBE7DD",
  ink: "#22281F",
  primary: "#46594A",
  primaryHover: "#2E3B31",
  muted: "#6C7265",
  faint: "#98938A",
  surface: "#FFFFFF",
  surfaceSoft: "#EEEAE0",
  surfaceWarm: "#FBF3E4",
  border: "#E6E1D4",
  borderSoft: "#F0ECE0",
  danger: "#A0455C",
  success: "#3E7A4E",
  successSoft: "#E7F0E8",
  mint: "#9FC9A8",
  mintMuted: "#98A794",
  sageMist: "#B8C2B4",
  warn: "#E8B25C",
  warnInk: "#6E5A2A",
  white: "#FFFFFF",
  cream: "#F5F2EB",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const type = {
  display: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 36,
    lineHeight: 42,
    color: colors.ink,
  },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  h2: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  body: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  caption: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  label: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
    color: colors.faint,
  },
} as const;

export function money(n: number) {
  return "$" + n.toLocaleString("en-US");
}
