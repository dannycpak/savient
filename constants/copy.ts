export const FREE_TIER = {
  checksPerMonth: 3,
  catalogCap: 25,
} as const;

export const VISUAL_CHECK_DISCLAIMER =
  "Visual Check is a second opinion based on a photo — not a certified authentication, appraisal, or guarantee of identity, treatment status, or value.";

export const COPY = {
  appName: "Sage",
  tagline: "Your specimen cabinet, kept well.",
  paywallHeadline: "Go unlimited with Sage+",
  paywallBody:
    "Unlimited Visual Checks, unlimited cataloging, and collection valuation analytics. First month free — then $7/month.",
  emptyCatalog: "Your shelf is empty. Add a specimen — or run a Visual Check and save the result.",
  marketSub: "Every seller credibility-scored. Every listing photo-verified.",
  auth: {
    welcome: "Welcome back",
    welcomeSub: "Log in to get back to your shelf.",
    signup: "Create your account",
    signupSub: "Your catalog, checks, and purchases sync across your devices.",
    forgot: "Reset password",
    forgotSub: "Enter your account email and we'll send a reset link.",
    inbox: "Check your inbox",
  },
  onboarding: [
    {
      title: "Every specimen, one shelf.",
      body: "Catalog localities, provenance, and dimensions — and watch your collection value update with every piece.",
      cta: "Continue",
      swatch: "amethyst" as const,
    },
    {
      title: "A second opinion in your pocket.",
      body: "Snap a photo before you buy. Get a likely ID, red flags for that species, and how the price compares to real purchases.",
      cta: "Continue",
      swatch: "fluorite" as const,
    },
    {
      title: "Buy from sellers you can trust.",
      body: "Credibility scores built on material accuracy — did the piece match the listing — not vibes.",
      cta: "Get started",
      swatch: "rhodochrosite" as const,
    },
  ],
} as const;

/** Demo marketplace rows so Market matches the approved prototype when live listings are empty. */
export const DEMO_LISTINGS = [
  {
    id: "demo-l1",
    title: "Amethyst Cluster",
    species: "Amethyst",
    locality: "Artigas, Uruguay",
    price_cents: 9500,
    rangeNote: "$60–$220 for this size",
    seller: { name: "Cascade Minerals", score: 9.2, tier: "lab_verified" },
  },
  {
    id: "demo-l2",
    title: "Vanadinite on Barite",
    species: "Vanadinite",
    locality: "Mibladen, Morocco",
    price_cents: 14500,
    rangeNote: "$110–$260 for this size",
    seller: { name: "DesertRock Co.", score: 8.4, tier: "documented" },
  },
  {
    id: "demo-l3",
    title: "Fluorite, Daylight",
    species: "Fluorite",
    locality: "Diana Maria Mine, England",
    price_cents: 42000,
    rangeNote: "$340–$610 for this size",
    seller: { name: "Cascade Minerals", score: 9.2, tier: "lab_verified" },
  },
  {
    id: "demo-l4",
    title: "Azurite Rosette",
    species: "Azurite",
    locality: "Milpillas, Sonora, Mexico",
    price_cents: 31000,
    rangeNote: "$240–$480 for this size",
    seller: { name: "DesertRock Co.", score: 8.4, tier: "documented" },
  },
  {
    id: "demo-l5",
    title: "Citrine Points",
    species: "Citrine",
    locality: "Listed: natural, Brazil",
    price_cents: 3800,
    rangeNote: "$25–$90 for this size",
    seller: { name: "CrystalKing88", score: 6.1, tier: "self_certified" },
  },
  {
    id: "demo-l6",
    title: "Malachite, Botryoidal",
    species: "Malachite",
    locality: "Katanga, DR Congo",
    price_cents: 18000,
    rangeNote: "$140–$320 for this size",
    seller: { name: "CrystalKing88", score: 6.1, tier: "self_certified" },
  },
] as const;

export const TIER_LABEL: Record<string, string> = {
  lab_verified: "Lab-Verified",
  documented: "Documented Sourcing",
  self_certified: "Self-Certified",
};

export const TIER_COLOR: Record<string, string> = {
  lab_verified: "#3E7A4E",
  documented: "#8A7A4F",
  self_certified: "#98938A",
};
