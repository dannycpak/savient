# Sage — Implementation Checklist

Build strictly in this order. Each phase ships a usable increment and de-risks the next.
(Sequencing follows docs/PRODUCT_SPEC.md: trust/intelligence core first, marketplace last.)

## Phase 0 — Project bootstrap
- [ ] Run `scripts/setup.sh` (deps, supabase init, functions scaffolds, secrets prompts).
- [ ] Apply `supabase/migrations/0001_initial_schema.sql` (`supabase db push` or `db reset`).
- [ ] Create Supabase Storage buckets: `specimen-photos` (private), `check-uploads` (private).
- [ ] Fill `.env` from `.env.example`; confirm app boots in Expo Go / dev client.

## Phase 1 — Auth + Catalog (core value, zero billing)
- [ ] Supabase Auth: email/password sign-up, login, password reset (magic link).
- [ ] Sign in with Apple + Google OAuth (Apple is REQUIRED for App Store if Google is offered).
- [ ] `profiles` row auto-created on signup (trigger in migration 0001).
- [ ] Catalog CRUD: create/edit/delete specimens with photos (EXIF stripped before upload).
- [ ] Home dashboard: running collection value (SUM of est_value_cents), recent activity feed.
- [ ] Free-tier catalog cap (25 specimens) enforced server-side (RLS + count check) with
      upgrade prompt in UI.
- [ ] Account settings: update name/email (re-verify), change password, delete account
      (soft-delete + 30-day purge — App Store requirement), sign out (token revocation).

## Phase 2 — Visual Check (AI, quota-gated; no payments yet)
- [ ] `visual-check` Edge Function: image → Anthropic vision prompt → structured
      `result_json` (species guess, confidence, red flags, price-range placeholder).
- [ ] Quota logic: free = 3 checks/month; consume monthly allowance first, then credits.
- [ ] Rate-limit the endpoint; log every check to `visual_checks`.
- [ ] Result screen: "Most likely / Watch out for / price range" + mandatory second-opinion
      disclaimer + "Save to catalog" (creates specimen prefilled from result).
- [ ] Legal review pass on disclaimer copy before public rollout.

## Phase 3 — Monetization (RevenueCat / IAP)
- [ ] App Store Connect + Play Console: create app records, `plus` subscription product
      ($7/mo, 1-month free intro offer), consumable credit packs (5/$2.99, 15/$6.99, 40/$14.99).
- [ ] RevenueCat project: entitlement `plus`, offerings, attach store products.
- [ ] `lib/purchases.ts`: configure SDK, purchase + restore flows.
- [ ] `revenuecat-webhook` Edge Function: entitlement changes → `profiles.plan` +
      `subscriptions`; consumable purchases → `credit_ledger` (+N).
- [ ] Paywall screen wired to offerings; gates: free = 3 checks + 25 specimens; plus = unlimited.
- [ ] Cancel flow deep-links to platform subscription management; state reflected via webhook.

## Phase 4 — Marketplace + Escrow (Stripe Connect)
- [ ] Seller onboarding via Stripe Connect Express; gate listing creation on
      `connect_onboarding_status = 'active'` (`account.updated` webhook).
- [ ] Listings CRUD + marketplace feed + listing detail.
- [ ] `create-order`: PaymentIntent (manual capture, destination charge, platform fee) →
      order `pending` → on authorization `escrow_held`.
- [ ] Shipping: seller adds tracking; buyer confirms delivery OR 7-day auto-confirm after
      tracked delivery → `confirm-delivery` captures + transfers → `released`.
- [ ] Disputes → human review queue; refund cancels uncaptured intent or refunds captured.
- [ ] Ratings: one per completed order (accuracy: as_described / minor / not_as_described,
      photo_match) → recompute seller credibility score (recency-weighted rolling average).
- [ ] Seller tiers surfaced as badges: Self-Certified → Documented Sourcing → Lab-Verified
      (tier upgrades require ops documentation-review flag, never pay-to-play).

## Phase 5 — Launch hardening
- [ ] EAS Build profiles (dev / preview / production) + EAS Submit for both stores.
- [ ] Deep-link scheme `sage://` tested for Stripe onboarding return + password reset.
- [ ] Push notifications (order events, rating prompts) via Expo Notifications.
- [ ] Privacy: App Privacy labels / Data safety form (photos, purchase data, no GPS retained).
- [ ] Reconciliation job: unbilled/failed webhook events; credit balance audit
      (SUM(credit_ledger) vs profile cache).
- [ ] App review prep: demo account, IAP review notes, "second opinion" disclaimer visible.
