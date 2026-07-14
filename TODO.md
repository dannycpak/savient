# Sage — Implementation Checklist

Build strictly in this order. Each phase ships a usable increment and de-risks the next.
(Sequencing follows docs/PRODUCT_SPEC.md: trust/intelligence core first, marketplace last.)

## Phase 0 — Project bootstrap
- [x] Run `scripts/setup.sh` (deps, supabase init, functions scaffolds, secrets prompts).
- [x] Apply migrations `0001`–`0008` (`supabase db push` / `./scripts/apply-db.sh`).
- [x] Storage buckets `specimen-photos` + `check-uploads` (private, uid-scoped RLS).
- [x] Fill `.env` from `.env.example`; confirm app boots in Expo Go / dev client.
  - *Native modules (Apple Sign-In, RevenueCat, Stripe PaymentSheet) need a **dev client**.*

## Phase 1 — Auth + Catalog (core value, zero billing)
- [x] Supabase Auth: email/password sign-up, login, password reset (`sage://auth/reset-password`).
- [x] Sign in with Apple + Google OAuth (`lib/oauth.ts`; Apple iOS-only).
- [x] `profiles` row auto-created on signup (trigger in migration 0001).
- [x] Catalog CRUD: create/edit/delete specimens with photos (EXIF stripped before upload).
- [x] Home dashboard: running collection value, recent activity, pending rating prompts.
- [x] Free-tier catalog cap (25) enforced server-side + upgrade prompt in UI.
- [x] Account settings: name/email, change password link, soft-delete + 30-day purge, sign out.
- [x] Auth route guard on tab stack; push token registration on login.

## Phase 2 — Visual Check (AI, quota-gated; no payments yet)
- [x] `visual-check` Edge Function → Anthropic vision → structured `result_json`.
- [x] Quota: free 3/mo then credits; `consume_check` + **refund on AI failure**.
- [x] Rate-limit (6/min) + log every check to `visual_checks`.
- [x] Result UI: Most likely / Watch out / price range + `VisualCheckDisclaimer` + Save to catalog.
- [x] Camera + library pickers; check history / detail screens.
- [x] Legal copy approved in `docs/LEGAL_DISCLAIMER.md`.

## Phase 3 — Monetization (RevenueCat / IAP)
- [x] Product catalog locked in `config/iap-products.json` + `docs/IAP_PRODUCTS.md`.
- [x] `lib/purchases.ts`: configure SDK, purchase + restore (no-ops until real RC keys).
- [x] `revenuecat-webhook` → `profiles.plan` / `subscriptions` / `credit_ledger`.
- [x] Paywall wired to offerings; DB-backed feature gates (never client purchase state alone).
- [x] Cancel / manage subscription deep-links to App Store / Play (`account/billing`).
- [ ] **Console:** create App Store Connect + Play products and attach in RevenueCat (manual).

## Phase 4 — Marketplace + Escrow (Stripe Connect)
- [x] Seller onboarding via Stripe Connect Express (`create-connect-account` + webhook).
- [x] Listings CRUD + photo upload + marketplace grid + listing detail.
- [x] `create-order`: PaymentIntent (manual capture, destination charge, fee) + duplicate guard.
- [x] Checkout presents **Stripe PaymentSheet** when publishable key is configured.
- [x] Shipping: `add-tracking` sets `shipped_at`; buyer `confirm-delivery` captures.
- [x] 7-day auto-confirm via `reconcile` (uses `shipped_at`).
- [x] Disputes → `dispute_queue`; refunds/disputes update order status.
- [x] Ratings → credibility score; seller tier badges in UI.
- [x] Listings marked `sold` on escrow authorization / capture.
- [ ] **Console:** enable Stripe Connect Express + webhook endpoint (manual).

## Phase 5 — Launch hardening
- [x] EAS Build profiles (dev / preview / production) + Submit config (`eas.json`).
- [x] Deep-link scheme `sage://` for OAuth callback, password reset, Connect return, checkout.
- [x] Push: Expo permission + `push_tokens` table / `upsert_push_token` RPC.
- [x] Privacy notes in `docs/APP_REVIEW.md` (photos, purchases, no GPS retained).
- [x] `reconcile` job: credit audit, stuck webhooks archive, auto-confirm, **account purge**.
- [x] App review prep docs + `supabase/seed/demo_reviewer.sql` + disclaimer on results.
- [x] Prototype chrome: dark onboarding, pill CTAs, center Visual Check FAB, mineral swatches.
- [ ] **Ops:** schedule hourly POST to `/functions/v1/reconcile` with cron secret.
- [ ] **Ops:** send Expo push messages from Edge Functions on order/rating events (token storage ready).

## Docs map
See README “Docs map” — `STORE_SETUP`, `IAP_PRODUCTS`, `LEGAL_DISCLAIMER`, `APP_REVIEW`, `RECONCILIATION`.
