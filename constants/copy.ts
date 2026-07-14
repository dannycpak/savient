export const FREE_TIER = {
  checksPerMonth: 3,
  catalogCap: 25,
} as const;

/** Canonical short disclaimer — see docs/LEGAL_DISCLAIMER.md (reviewed 2026-07-14). */
export const VISUAL_CHECK_DISCLAIMER =
  "Visual Check is a second opinion based on a photo — not a certified authentication, appraisal, or guarantee of identity, treatment status, or value.";

/** Product IDs must match config/iap-products.json and store consoles. */
export const IAP = {
  entitlementPlus: "plus",
  plusMonthly: "sage_plus_monthly",
  credits5: "sage_credits_5",
  credits15: "sage_credits_15",
  credits40: "sage_credits_40",
} as const;

export const COPY = {
  appName: "Sage",
  tagline: "Your specimen cabinet, kept well.",
  paywallHeadline: "Sage+",
  paywallBody:
    "Unlimited second opinions, your whole collection, and the full picture on prices.",
  emptyCatalog:
    "Your catalog is empty. Add your first specimen — or run a Visual Check and save the result.",
  marketSub: "Every seller credibility-scored. Every listing photo-verified.",
  checkIntro:
    "Deciding whether to buy? Snap the listing photo and we'll ID the species, flag common tricks, and compare the price to real purchases.",
} as const;
