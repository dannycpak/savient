export const colors = {
  bg: "#EBE7DD",
  ink: "#22281F",
  primary: "#46594A",
  primaryHover: "#2E3B31",
  muted: "#6C7265",
  faint: "#98938A",
  surface: "#F5F2EA",
  border: "#D6D1C4",
  danger: "#8B3A3A",
  white: "#FFFFFF",
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
  sm: 6,
  md: 10,
  lg: 16,
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
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    color: colors.faint,
  },
} as const;
