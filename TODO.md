# Sage — Implementation Checklist

Build strictly in this order. Each phase ships a usable increment and de-risks the next.
(Sequencing follows docs/PRODUCT_SPEC.md: trust/intelligence core first, marketplace last.)

Legend: `[x]` = implemented in repo · `[ ]` = still needs ops / store-console / legal outside git.

## Phase 0 — Project bootstrap
- [x] Run `scripts/setup.sh` (deps, supabase init, functions scaffolds, secrets prompts).
- [x] Apply `supabase/migrations/0001_initial_schema.sql` (+ `0002_store_readiness.sql` for storage).
- [x] Create Supabase Storage buckets: `specimen-photos` (private), `check-uploads` (private) — via migration 0002.
- [ ] Fill `.env` from `.env.example`; confirm app boots in Expo Go / **dev client** (IAP + Apple need native).

## Phase 1 — Auth + Catalog (core value, zero billing)
- [x] Supabase Auth: email/password sign-up, login, password reset → `sage://reset-password`.
- [x] Sign in with Apple + Google OAuth (wire providers + Google client IDs in Supabase / `.env`).
- [x] `profiles` row auto-created on signup (trigger in migration 0001).
- [x] Catalog CRUD: create/edit/delete specimens with photos (EXIF stripped before upload).
- [x] Home dashboard: running collection value (SUM of est_value_cents), recent activity feed.
- [x] Free-tier catalog cap (25 specimens) enforced server-side (RLS + count check) with upgrade prompt in UI.
- [x] Account settings: update name/email (re-verify), change password, delete account
      (soft-delete + 30-day purge via `purge-deleted-accounts`), sign out (token revocation).
- [ ] Enable Apple + Google providers in the live Supabase project; schedule purge cron.

## Phase 2 — Visual Check (AI, quota-gated; no payments yet)
- [x] `visual-check` Edge Function: image → Anthropic vision prompt → structured `result_json`.
- [x] Quota logic: free = 3 checks/month; consume monthly allowance first, then credits (refund on AI failure).
- [x] Rate-limit the endpoint; log every check to `visual_checks`.
- [x] Result screen: "Most likely / Watch out for / price range" + mandatory second-opinion disclaimer + "Save to catalog".
- [ ] Legal review pass on disclaimer copy before public rollout.
- [ ] Deploy function + set `ANTHROPIC_API_KEY` on the project.

## Phase 3 — Monetization (RevenueCat / IAP)
- [ ] App Store Connect + Play Console: create app records, `plus` subscription product
      ($7/mo, 1-month free intro offer), consumable credit packs (5/$2.99, 15/$6.99, 40/$14.99).
- [ ] RevenueCat project: entitlement `plus`, offerings, attach store products.
- [x] `lib/purchases.ts`: configure SDK, purchase + restore flows.
- [x] `revenuecat-webhook` Edge Function: entitlement changes + consumables + `BILLING_ISSUE` pause.
- [x] Paywall screen wired to offerings; gates: free = 3 checks + 25 specimens; plus = unlimited.
- [x] Cancel flow deep-links to platform subscription management; state reflected via webhook.
- [ ] Sandbox purchase test → webhook writes `profiles.plan` / `credit_ledger`.

## Phase 4 — Marketplace + Escrow (Stripe Connect)
> First store submission **gates** Market / Buy / Checkout as "Coming soon". Backend scaffolds remain.
- [ ] Seller onboarding via Stripe Connect Express; gate listing creation on
      `connect_onboarding_status = 'active'` (`account.updated` webhook).
- [ ] Listings CRUD + marketplace feed + listing detail (client Buy disabled until this ships).
- [x] `create-order`: PaymentIntent (manual capture, destination charge, platform fee) — function exists.
- [ ] Shipping: seller tracking UI + 7-day auto-confirm cron → `confirm-delivery`.
- [ ] Disputes → human review queue; refund cancels uncaptured intent or refunds captured.
- [x] Ratings schema + insert screen + credibility trigger (post-order prompts when Market ships).
- [ ] Seller tiers ops documentation-review flag workflow.

## Phase 5 — Launch hardening
- [x] EAS Build profiles (`eas.json` development / preview / production) + submit stubs.
- [x] Deep-link scheme `sage://` + in-app reset-password screen.
- [ ] Push notifications (order events, rating prompts) via Expo Notifications — deferred with Market.
- [x] Privacy strings / encryption flag in `app.json`; Data safety answers in `docs/STORE_SUBMISSION.md`.
- [ ] Reconciliation job: unbilled/failed webhook events; credit balance audit.
- [ ] App review prep: demo account, IAP review notes (template in `docs/STORE_SUBMISSION.md`), screenshots.
- [ ] Replace `REPLACE_WITH_*` placeholders in `app.json` / `eas.json`; run EAS Submit.
