/** Sage design tokens — aligned with the approved offline prototype. */
export const colors = {
  bg: "#F5F2EB",
  bone: "#EBE7DD",
  ink: "#22281F",
  primary: "#46594A",
  primaryHover: "#2E3B31",
  muted: "#6C7265",
  faint: "#98938A",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F2EA",
  border: "#E6E1D4",
  divider: "#F0ECE0",
  danger: "#A0455C",
  white: "#FFFFFF",
  onDark: "#F5F2EB",
  onDarkMuted: "#B8C2B4",
  onDarkFaint: "#98A794",
  success: "#3E7A4E",
  successSoft: "#E7F0E8",
  positive: "#9FC9A8",
  tabInactive: "#9AA095",
  amberBg: "#FBF3E4",
  amberBorder: "#EBDDBE",
  amberText: "#6E5A2A",
  amberAccent: "#8A7A4F",
  chip: "#EEEAE0",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 28,
  sheet: 26,
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
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
  },
  body: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 15.5,
    lineHeight: 23,
    color: colors.ink,
  },
  caption: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.muted,
  },
  label: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 12.5,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    color: colors.faint,
  },
} as const;

export type Swatch = { colors: readonly [string, string] };

export const SWATCHES: Record<string, Swatch> = {
  amethyst: { colors: ["#6E5A9E", "#3E3268"] },
  fluorite: { colors: ["#5E9E7C", "#2E5E48"] },
  rhodochrosite: { colors: ["#D98A97", "#A0455C"] },
  pyrite: { colors: ["#C9A84C", "#8A6E2A"] },
  aquamarine: { colors: ["#7FB6C9", "#3E7A96"] },
  wulfenite: { colors: ["#D9903F", "#A85B22"] },
  smoky: { colors: ["#8A8078", "#4E463E"] },
  vanadinite: { colors: ["#C25438", "#7E2E1A"] },
  azurite: { colors: ["#3E5A96", "#1E2E58"] },
  citrine: { colors: ["#D9B44C", "#9E7A22"] },
  malachite: { colors: ["#2E7A52", "#0F4A2E"] },
  emerald: { colors: ["#2E8A6E", "#155A46"] },
};

export function swatchFor(name: string): Swatch {
  const key = Object.keys(SWATCHES).find((k) => name.toLowerCase().includes(k));
  return key ? SWATCHES[key] : SWATCHES.fluorite;
}
