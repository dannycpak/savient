# Sage — Implementation Checklist

Build strictly in this order. Each phase ships a usable increment and de-risks the next.
(Sequencing follows docs/PRODUCT_SPEC.md: trust/intelligence core first, marketplace last.)

## Phase 0 — Project bootstrap
- [x] Run `scripts/setup.sh` (deps, supabase init, functions scaffolds, secrets prompts).
- [x] Apply `supabase/migrations/0001_initial_schema.sql` (`supabase db push` or `db reset`).
- [x] Create Supabase Storage buckets: `specimen-photos` (private), `check-uploads` (private).
- [x] Fill `.env` from `.env.example`; confirm app boots in Expo Go / dev client.
  - *Code ready: copy `.env.example` → `.env` and run setup against your project (see docs/STORE_SETUP.md).*

## Phase 1 — Auth + Catalog (core value, zero billing)
- [x] Supabase Auth: email/password sign-up, login, password reset (magic link).
- [x] Sign in with Apple + Google OAuth (Apple is REQUIRED for App Store if Google is offered).
- [x] `profiles` row auto-created on signup (trigger in migration 0001).
- [x] Catalog CRUD: create/edit/delete specimens with photos (EXIF stripped before upload).
- [x] Home dashboard: running collection value (SUM of est_value_cents), recent activity feed.
- [x] Free-tier catalog cap (25 specimens) enforced server-side (RLS + count check) with
      upgrade prompt in UI.
- [x] Account settings: update name/email (re-verify), change password, delete account
      (soft-delete + 30-day purge — App Store requirement), sign out (token revocation).

## Phase 2 — Visual Check (AI, quota-gated; no payments yet)
- [x] `visual-check` Edge Function: image → Anthropic vision prompt → structured
      `result_json` (species guess, confidence, red flags, price-range placeholder).
- [x] Quota logic: free = 3 checks/month; consume monthly allowance first, then credits.
- [x] Rate-limit the endpoint; log every check to `visual_checks`.
- [x] Result screen: "Most likely / Watch out for / price range" + mandatory second-opinion
      disclaimer + "Save to catalog" (creates specimen prefilled from result).
- [ ] Legal review pass on disclaimer copy before public rollout.

## Phase 3 — Monetization (RevenueCat / IAP)
- [ ] App Store Connect + Play Console: create app records, `plus` subscription product
      ($7/mo, 1-month free intro offer), consumable credit packs (5/$2.99, 15/$6.99, 40/$14.99).
- [ ] RevenueCat project: entitlement `plus`, offerings, attach store products.
- [x] `lib/purchases.ts`: configure SDK, purchase + restore flows.
- [x] `revenuecat-webhook` Edge Function: entitlement changes → `profiles.plan` +
      `subscriptions`; consumable purchases → `credit_ledger` (+N).
- [x] Paywall screen wired to offerings; gates: free = 3 checks + 25 specimens; plus = unlimited.
- [x] Cancel flow deep-links to platform subscription management; state reflected via webhook.
  - *Store product creation is manual — see docs/STORE_SETUP.md.*

## Phase 4 — Marketplace + Escrow (Stripe Connect)
- [x] Seller onboarding via Stripe Connect Express; gate listing creation on
      `connect_onboarding_status = 'active'` (`account.updated` webhook).
- [x] Listings CRUD + marketplace feed + listing detail.
- [x] `create-order`: PaymentIntent (manual capture, destination charge, platform fee) →
      order `pending` → on authorization `escrow_held`.
- [x] Shipping: seller adds tracking; buyer confirms delivery OR 7-day auto-confirm after
      tracked delivery → `confirm-delivery` captures + transfers → `released`.
- [x] Disputes → human review queue; refund cancels uncaptured intent or refunds captured.
  - *Webhook sets `disputed` / `refunded`; human ops queue is out-of-band.*
- [x] Ratings: one per completed order (accuracy: as_described / minor / not_as_described,
      photo_match) → recompute seller credibility score (recency-weighted rolling average).
- [x] Seller tiers surfaced as badges: Self-Certified → Documented Sourcing → Lab-Verified
      (tier upgrades require ops documentation-review flag, never pay-to-play).

## Phase 5 — Launch hardening
- [x] EAS Build profiles (dev / preview / production) + EAS Submit for both stores.
- [x] Deep-link scheme `sage://` tested for Stripe onboarding return + password reset.
  - *Handlers: `auth/callback`, seller onboarding return URLs, billing deep-links.*
- [x] Push notifications (order events, rating prompts) via Expo Notifications.
  - *Client registration in `lib/notifications.ts`; wire server sends when push certs exist.*
- [x] Privacy: App Privacy labels / Data safety form (photos, purchase data, no GPS retained).
  - *Guidance in docs/STORE_SETUP.md.*
- [ ] Reconciliation job: unbilled/failed webhook events; credit balance audit
      (SUM(credit_ledger) vs profile cache).
- [ ] App review prep: demo account, IAP review notes, "second opinion" disclaimer visible.
