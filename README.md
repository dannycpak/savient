# Sage — Cursor + Expo handoff package

Everything Cursor needs to build the Sage mineral-collector app for iOS and Android:
rules, architecture, specs, database schema with RLS, Deno Edge Functions, and a working
Expo Router app shell in the approved design language.

## How to use this package in Cursor

1. **Open this folder as the workspace** in Cursor. Cursor reads `.cursorrules`
   automatically — those rules encode the Deno import syntax, the three-rail billing
   isolation, and the security invariants, so generated code lands correctly.
2. Ask Cursor to read `ARCHITECTURE.md`, `docs/BACKEND_SPEC.md`, and `TODO.md`, then say:
   *"Start Phase 0 of TODO.md"* and work phase by phase. Don't let it jump to the
   marketplace before auth + catalog + Visual Check are solid.
3. Run `scripts/setup.sh` when you have a Supabase project (installs deps, applies the
   migration, sets secrets, deploys functions).
4. `cp .env.example .env`, fill the `EXPO_PUBLIC_` values, then `npx expo start`.
   Note: RevenueCat and Apple Sign-In need a **dev client** (`npx expo run:ios`), not Expo Go.

## What's already decided (don't relitigate in Cursor)

- **Digital goods = IAP via RevenueCat.** Sage+ ($7/mo, first month free) and Visual Check
  credit packs must use StoreKit/Play Billing — App Store rules. Stripe is *never* used for
  these in the app. (This supersedes any earlier Stripe-metered-billing drafts.)
- **Physical goods = Stripe Connect** destination charges with **manual capture** (escrow):
  authorize at purchase → capture on confirmed delivery → transfer minus platform fee.
- **AI Visual Check** runs server-side in `supabase/functions/visual-check` against the
  Anthropic API. The key never ships in the app. Every result screen shows the
  second-opinion disclaimer from `constants/copy.ts`.
- **Free tier**: 3 Visual Checks/month + 25-specimen catalog cap, enforced server-side
  (`consume_check` RPC + RLS), never by client state.
- **Design language**: warm bone / ink / sage green, Instrument Serif + Sans — tokens in
  `constants/theme.ts`, matching the approved prototype.

## Store submission checklist (Phase 5, but read early)

- App Store: Sign in with Apple is required (we offer Google), account deletion is required
  (implemented as soft-delete + 30-day purge), IAP products need review notes + demo account.
- Play: Data safety form — photos processed, no location retained (EXIF stripped client-side).
- Deep-link scheme `sage://` handles password reset and Stripe Connect onboarding returns.

## Layout

See `ARCHITECTURE.md` for the full tree. Quick map: `app/` screens · `lib/` supabase/api/
purchases/images gateways · `supabase/migrations/` schema+RLS · `supabase/functions/` Deno
edge functions · `docs/` product + backend specs · `TODO.md` build order.
