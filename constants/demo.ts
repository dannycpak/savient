/** Sample content mirroring the approved Sage Screens prototype. */

export type DemoSeller = {
  id: string;
  name: string;
  score: string;
  tier: string;
  tierColor: string;
  ratings: number;
  bars: { label: string; pct: number }[];
  reviews: { item: string; verdict: string; quote: string }[];
};

export type DemoSpecimen = {
  id: string;
  name: string;
  locality: string;
  value: number;
  swatch: [string, string];
  rarity: string;
  range: string;
  comps: number;
  formation: string;
  matrix: string;
  dims: string;
  provenance: string;
  acquired: string;
};

export type DemoListing = {
  id: string;
  name: string;
  locality: string;
  price: number;
  swatch: [string, string];
  sellerId: string;
  rangeNote: string;
};

export const DEMO_SELLERS: Record<string, DemoSeller> = {
  cascade: {
    id: "cascade",
    name: "Cascade Minerals",
    score: "9.2",
    tier: "Lab-Verified",
    tierColor: "#3E7A4E",
    ratings: 128,
    bars: [
      { label: "Locality as described", pct: 97 },
      { label: "Treatments disclosed", pct: 99 },
      { label: "Photos matched the piece", pct: 96 },
    ],
    reviews: [
      {
        item: "Rhodochrosite, Sweet Home Mine",
        verdict: "As described",
        quote: "Locality paperwork included without asking. Exactly the piece from the photos.",
      },
      {
        item: "Fluorite, Rogerley Mine",
        verdict: "As described",
        quote: "Daylight-fluorescent just as listed. Packed like it was going to the moon.",
      },
    ],
  },
  desertrock: {
    id: "desertrock",
    name: "DesertRock Co.",
    score: "8.4",
    tier: "Documented Sourcing",
    tierColor: "#8A7A4F",
    ratings: 64,
    bars: [
      { label: "Locality as described", pct: 91 },
      { label: "Treatments disclosed", pct: 95 },
      { label: "Photos matched the piece", pct: 89 },
    ],
    reviews: [
      {
        item: "Wulfenite, Red Cloud Mine",
        verdict: "As described",
        quote: "Color slightly deeper in person — in a good way. Locality checks out.",
      },
      {
        item: "Azurite, Milpillas",
        verdict: "Minor differences",
        quote: "Great piece, but one contact point was not visible in the listing photos.",
      },
    ],
  },
  crystalking: {
    id: "crystalking",
    name: "CrystalKing88",
    score: "6.1",
    tier: "Self-Certified",
    tierColor: "#98938A",
    ratings: 19,
    bars: [
      { label: "Locality as described", pct: 72 },
      { label: "Treatments disclosed", pct: 68 },
      { label: "Photos matched the piece", pct: 81 },
    ],
    reviews: [
      {
        item: "Amethyst cluster",
        verdict: "Minor differences",
        quote: '"Uruguay" locality seems unlikely at this saturation.',
      },
      {
        item: "Citrine points",
        verdict: "Not as described",
        quote: "Almost certainly heat-treated amethyst. No treatment disclosure.",
      },
    ],
  },
};

export const DEMO_SPECIMENS: DemoSpecimen[] = [
  {
    id: "ame",
    name: "Amethyst",
    locality: "Piedra Parada, Veracruz, Mexico",
    value: 340,
    swatch: ["#6E5A9E", "#3E3268"],
    rarity: "Uncommon",
    range: "$220–$480",
    comps: 41,
    formation: "Elongated prismatic",
    matrix: "None (floater)",
    dims: "8.2 × 6.1 × 4.0 cm",
    provenance: "Cascade Minerals, 2025",
    acquired: "March 2025",
  },
  {
    id: "flu",
    name: "Fluorite",
    locality: "Rogerley Mine, Weardale, England",
    value: 520,
    swatch: ["#5E9E7C", "#2E5E48"],
    rarity: "Rare locality",
    range: "$380–$640",
    comps: 28,
    formation: "Cubic, twinned",
    matrix: "Quartz-lined pocket",
    dims: "6.5 × 5.8 × 3.2 cm",
    provenance: "UK Mining Ventures lot",
    acquired: "January 2025",
  },
  {
    id: "rho",
    name: "Rhodochrosite",
    locality: "Sweet Home Mine, Colorado, USA",
    value: 1850,
    swatch: ["#D98A97", "#A0455C"],
    rarity: "Rare",
    range: "$1,400–$2,600",
    comps: 12,
    formation: "Rhombohedral",
    matrix: "Tetrahedrite + quartz",
    dims: "4.1 × 3.6 × 2.8 cm",
    provenance: "Collector estate, documented",
    acquired: "November 2024",
  },
  {
    id: "pyr",
    name: "Pyrite",
    locality: "Navajún, La Rioja, Spain",
    value: 95,
    swatch: ["#C9A84C", "#8A6E2A"],
    rarity: "Common",
    range: "$60–$140",
    comps: 87,
    formation: "Perfect cube",
    matrix: "Marl",
    dims: "5.0 × 5.0 × 4.8 cm",
    provenance: "DesertRock Co.",
    acquired: "September 2024",
  },
  {
    id: "aqu",
    name: "Aquamarine",
    locality: "Shigar Valley, Gilgit-Baltistan, Pakistan",
    value: 760,
    swatch: ["#7FB6C9", "#3E7A96"],
    rarity: "Uncommon",
    range: "$520–$980",
    comps: 22,
    formation: "Prismatic, gemmy",
    matrix: "Albite + muscovite",
    dims: "7.3 × 2.1 × 1.8 cm",
    provenance: "Cascade Minerals, 2026",
    acquired: "June 2026",
  },
  {
    id: "wul",
    name: "Wulfenite",
    locality: "Red Cloud Mine, Arizona, USA",
    value: 410,
    swatch: ["#D9903F", "#A85B22"],
    rarity: "Uncommon",
    range: "$280–$560",
    comps: 19,
    formation: "Tabular, bladed",
    matrix: "Limonite",
    dims: "5.6 × 4.9 × 2.2 cm",
    provenance: "DesertRock Co.",
    acquired: "June 2026",
  },
  {
    id: "dio",
    name: "Dioptase",
    locality: "Tsumeb, Namibia",
    value: 680,
    swatch: ["#2E8A6E", "#155A46"],
    rarity: "Rare locality",
    range: "$460–$920",
    comps: 15,
    formation: "Prismatic druse",
    matrix: "Dolomite",
    dims: "4.8 × 4.0 × 3.1 cm",
    provenance: "Old collection, pre-1990",
    acquired: "February 2025",
  },
  {
    id: "smk",
    name: "Smoky Quartz",
    locality: "Ouachita Mtns, Arkansas, USA",
    value: 120,
    swatch: ["#8A8078", "#4E463E"],
    rarity: "Common",
    range: "$80–$180",
    comps: 64,
    formation: "Prismatic cluster",
    matrix: "Sandstone",
    dims: "9.0 × 6.2 × 4.5 cm",
    provenance: "Field-collected",
    acquired: "August 2025",
  },
];

export const DEMO_LISTINGS: DemoListing[] = [
  {
    id: "l1",
    name: "Amethyst Cluster",
    locality: "Artigas, Uruguay",
    price: 95,
    swatch: ["#6E5A9E", "#3E3268"],
    sellerId: "cascade",
    rangeNote: "$60–$220 for this size",
  },
  {
    id: "l2",
    name: "Vanadinite on Barite",
    locality: "Mibladen, Morocco",
    price: 145,
    swatch: ["#C25438", "#7E2E1A"],
    sellerId: "desertrock",
    rangeNote: "$110–$260 for this size",
  },
  {
    id: "l3",
    name: "Fluorite, Daylight",
    locality: "Diana Maria Mine, England",
    price: 420,
    swatch: ["#5E9E7C", "#2E5E48"],
    sellerId: "cascade",
    rangeNote: "$340–$610 for this size",
  },
  {
    id: "l4",
    name: "Azurite Rosette",
    locality: "Milpillas, Sonora, Mexico",
    price: 310,
    swatch: ["#3E5A96", "#1E2E58"],
    sellerId: "desertrock",
    rangeNote: "$240–$480 for this size",
  },
  {
    id: "l5",
    name: "Citrine Points",
    locality: "Listed: natural, Brazil",
    price: 38,
    swatch: ["#D9B44C", "#9E7A22"],
    sellerId: "crystalking",
    rangeNote: "$25–$90 for this size",
  },
  {
    id: "l6",
    name: "Malachite, Botryoidal",
    locality: "Katanga, DR Congo",
    price: 180,
    swatch: ["#2E7A52", "#0F4A2E"],
    sellerId: "crystalking",
    rangeNote: "$130–$300 for this size",
  },
];

export const DEMO_ACTIVITY = [
  { label: "Aquamarine added to catalog", detail: "+$760", tone: "up" as const },
  { label: "Fluorite price range updated", detail: "$380–$640", tone: "muted" as const },
  { label: "Cascade Minerals hit Lab-Verified", detail: "tier ↑", tone: "muted" as const },
];

export const CANNED_CHECK = {
  species: "Amethyst",
  confidence: "High" as const,
  flags: [
    "Heat-treated citrine is often sold as “natural amethyst” — ask if any treatment was applied.",
    "Dyed quartz lookalikes show color pooling in cracks.",
    "“Uruguay” localities at Brazil-cluster prices deserve a follow-up question.",
  ],
  low: 60,
  high: 220,
  mid: 95,
  size: "8×6 cm cluster",
  note: "typical — looks fair",
  source:
    "Sample result. From 1,240 anonymized purchases logged by collectors. Comps, not appraisal.",
};

export const ONBOARDING_SLIDES = [
  {
    title: "Every specimen, one shelf.",
    body: "Catalog localities, provenance, and dimensions — and watch your collection value update with every piece.",
    cta: "Continue",
  },
  {
    title: "A second opinion, right when you need it.",
    body: "Visual Check IDs the species, flags common tricks, and compares the asking price to real purchases.",
    cta: "Continue",
  },
  {
    title: "Trust before trade.",
    body: "Seller credibility scores measure material accuracy — was the piece what the listing said it was.",
    cta: "Create account",
  },
];
