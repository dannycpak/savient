# Sage — Product Specification

## What it is
The collector platform for mineral specimens: catalog your collection, get an AI Visual Check
(likely ID, species-specific red flags, price-range comparison) at the moment of highest
purchase uncertainty, track running collection value, and buy/sell through a marketplace
built on the market's first standardized seller-credibility layer. Visual Check is always a
second opinion, never a certified authentication.

## Engagement loop
Catalog a specimen → collection value updates → rate the seller (required quick rating at
point of cataloging a purchase) → credibility data improves → price-range intelligence
improves → Visual Check gets better → more cataloging.

## Monetization
- **Sage+** — $7/month, first month free. Free tier: 3 Visual Checks/month + 25-specimen
  catalog cap. Plus: unlimited checks, unlimited cataloging, full valuation analytics.
  Visual Check is the primary free→paid conversion trigger.
- **Visual Check credit packs** (consumable IAP): 5/$2.99 · 15/$6.99 · 40/$14.99.
  A check consumes free monthly allowance first, then credits.
- **Marketplace transaction fee** (Phase 4): seller-side platform fee on completed escrowed
  sales (comparable models: ~10–15%).
- Later: seller subscriptions (claim profile, analytics), affiliate "Buy similar" links,
  data licensing, sponsored placement kept structurally separate from credibility.

## Screen inventory (every screen exists in the approved prototype `Sage Screens.dc.html`)

| Route | Screen | Key elements |
|---|---|---|
| `onboarding` | Onboarding | value-prop cards, Skip |
| `(auth)/login` `signup` `forgot-password` | Auth | email/password, Apple, Google; reset link → "Check your inbox" |
| `(tabs)/index` | Home | Collection value headline, "Run a Visual Check" CTA, recent activity ("Aquamarine added to catalog", "Fluorite price range updated"), pending rating prompt ("Rate your wulfenite purchase") |
| `(tabs)/catalog` | My collection | specimen grid/list, add specimen, free-tier 25 cap |
| `(tabs)/check` | Visual Check | "Tap to add a photo" → processing → result: Most likely (species + confidence), Watch out for (red flags), price range, disclaimer, Save to catalog |
| `(tabs)/market` | Marketplace | listings feed, seller badges |
| `(tabs)/profile` | Profile | plan status, checks left, credits, links to settings/billing |
| `specimen/[id]` | Specimen detail | photos, locality/formation/matrix/dims/provenance/rarity, Estimated value, Buy similar |
| `listing/[id]` | Listing detail | photos, price, seller card, Buy |
| `seller/[id]` | Seller profile | credibility score /10, tier badge, recent ratings breakdown (Locality as described / Treatments disclosed / Photos matched the piece) |
| `checkout/[listingId]` | Checkout | payment, "Payment held in escrow", "Tracked shipping" explainer |
| `rate/[orderId]` | Rate purchase | accuracy: As described / Minor differences / Not as described; photo match: Yes, matched / Not quite; Submit rating |
| `paywall` | Sage+ | "Go unlimited with Sage+": unlimited Visual Checks, unlimited cataloging, collection valuation analytics; Start free month / Maybe later; credit packs |
| `account/settings` | Account | full name, email, Save changes, Change password, Delete account, Sign out, Notifications, Export my collection |
| `account/billing` | Billing | Manage subscription, Cancel subscription, Payment method, Visual Check credits |

## Design language (from prototype — encoded in `constants/theme.ts`)
Warm bone background `#EBE7DD`, ink `#22281F`, sage green primary `#46594A` (hover
`#2E3B31`), muted `#6C7265`, faint label `#98938A`. Display: Instrument Serif. UI: Instrument
Sans. Calm, archival, field-journal feel — the app should read like a well-kept specimen
cabinet, not a fintech dashboard.

## Phasing rationale
Trust + intelligence layer first (catalog, credibility, Visual Check), marketplace last —
by the time transactions launch, sellers already have a reputation to protect and buyers
already trust the data.
