# Sage — Architecture

Mobile-first collector platform for mineral specimens. One Expo codebase ships to iOS and
Android. Supabase is the system of record; Deno Edge Functions hold all secret-bearing and
money-touching logic. Three isolated billing rails (see `.cursorrules` → Billing Isolation).

## Folder layout

```text
├── .cursorrules                     # AI code-generation rules (read first)
├── ARCHITECTURE.md                  # This file
├── TODO.md                          # Phased build checklist — build in this order
├── docs/
│   ├── BACKEND_SPEC.md              # Data model, billing rails, API surface, security
│   └── PRODUCT_SPEC.md              # Screen inventory + business model summary
├── app.json                         # Expo config (bundle IDs, plugins, deep-link scheme)
├── package.json / tsconfig.json
├── .env.example                     # EXPO_PUBLIC_* client env vars
├── scripts/
│   └── setup.sh                     # One-shot local bootstrap (supabase init, secrets, deps)
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql  # Full schema + RLS + triggers
│   └── functions/                   # Deno Edge Functions
│       ├── _shared/cors.ts
│       ├── visual-check/index.ts        # AI proxy; consumes allowance → credits
│       ├── revenuecat-webhook/index.ts  # Entitlement + consumable events (digital goods)
│       ├── stripe-webhook/index.ts      # Connect account + payment events (physical goods)
│       ├── create-order/index.ts        # PaymentIntent (manual capture) for a listing
│       ├── confirm-delivery/index.ts    # Capture + transfer to seller (escrow release)
│       ├── create-connect-account/index.ts  # Stripe Connect Express onboarding link
│       ├── add-tracking/index.ts        # Seller ships → order status shipped
│       └── reconcile/index.ts           # Cron: credit audit, stuck webhooks, auto-confirm
├── lib/
│   ├── supabase.ts                  # Client singleton + typed helpers
│   ├── api.ts                       # Edge Function fetch wrapper (bearer token)
│   └── purchases.ts                 # RevenueCat wrapper (plan + credits)
├── constants/
│   ├── theme.ts                     # Sage design tokens (palette, type, spacing)
│   └── copy.ts                      # Shared strings incl. Visual Check disclaimer
├── components/                      # Shared UI (Button, Card, SpecimenRow, Badge…)
└── app/                             # Expo Router screens
    ├── _layout.tsx                  # Root: fonts, auth provider, route guard
    ├── index.tsx                    # Splash → route to onboarding/auth/tabs
    ├── onboarding.tsx
    ├── (auth)/
    │   ├── login.tsx  signup.tsx  forgot-password.tsx
    ├── (tabs)/
    │   ├── _layout.tsx              # Tab bar: Home, Catalog, Check, Market, Profile
    │   ├── index.tsx                # Home: collection value, recent activity, CTA
    │   ├── catalog.tsx              # My collection (25-cap on free tier)
    │   ├── check.tsx                # Visual Check camera/upload entry
    │   ├── market.tsx               # Marketplace feed
    │   └── profile.tsx              # Plan, credits, settings entry
    ├── specimen/[id].tsx            # Detail: est. value, provenance, "Buy similar"
    ├── listing/[id].tsx             # Listing detail + Buy
    ├── seller/[id].tsx              # Seller profile: credibility score, tier badge, ratings
    ├── checkout/[listingId].tsx     # Escrow purchase flow
    ├── rate/[orderId].tsx           # Post-delivery accuracy rating (one per order)
    ├── paywall.tsx                  # Sage+ ($7/mo, first month free) + credit packs
    └── account/
        ├── settings.tsx             # Name/email, change password, delete account
        └── billing.tsx              # Manage subscription, credits, payment method
```

## Runtime topology

```
Expo app ── supabase-js ──────────▶ Postgres (RLS enforced per auth.uid())
Expo app ── lib/api.ts (JWT) ─────▶ Edge Functions ──▶ Anthropic API (visual-check)
                                                    ──▶ Stripe API (orders, capture)
RevenueCat ── webhook ────────────▶ revenuecat-webhook ──▶ profiles.plan / credit_ledger
Stripe    ── webhook ────────────▶ stripe-webhook ──────▶ orders / sellers status
```

## Non-negotiable invariants
1. Digital goods (Sage+, credits) = RevenueCat/IAP only. Physical goods = Stripe Connect only.
2. Anthropic key, Stripe secret key, RevenueCat secret: Edge Function env only.
3. Feature gates read DB truth written by webhooks — never client purchase state.
4. Price math in integer cents, server-side only.
5. RLS on by default for every table; public marketplace reads are explicit policies.
