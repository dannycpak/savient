export const FREE_TIER = {
  checksPerMonth: 3,
  catalogCap: 25,
} as const;

export const VISUAL_CHECK_DISCLAIMER =
  "A friendly second opinion — not a certified authentication.";

export const VISUAL_CHECK_DISCLAIMER_LONG =
  "Visual Check is a second opinion based on a photo — not a certified authentication, appraisal, or guarantee of identity, treatment status, or value.";

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
