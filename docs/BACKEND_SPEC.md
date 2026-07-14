# Sage — Backend Specification (authoritative)

This document supersedes all earlier "Stone Collector / Stripe metered billing" drafts.
Reason: Sage ships as a mobile app, and Apple/Google require in-app purchase for digital
goods. Stripe metered billing for Visual Checks would fail app review. The three billing
rails below are final.

## 1. Billing rails (keep strictly separate)

| Rail | Goods | Processor | Local tables |
|---|---|---|---|
| Sage+ subscription ($7/mo, first month free) | digital | RevenueCat → StoreKit 2 / Play Billing | `subscriptions`, `profiles.plan` |
| Visual Check credit packs (5/$2.99, 15/$6.99, 40/$14.99) | digital consumable | RevenueCat consumable IAP | `credit_ledger` |
| Marketplace specimen purchases | physical | Stripe Connect (destination charge, manual capture) | `orders` |

Why separate: different money moves in different directions with different tax treatment
(1099-K obligations attach to the Connect side only). One clean Stripe object graph per rail
keeps reconciliation and tax time sane.

## 2. Data model

Tenancy is row-level ownership (B2C), not tenant partitioning: every user-data table carries
an owner FK with RLS scoped to `auth.uid()`, plus explicit public-read policies where the
marketplace/community needs them. Full DDL with RLS lives in
`supabase/migrations/0001_initial_schema.sql`. Summary:

```
profiles         id (= auth.users.id), username, display_name, avatar_url, plan (free|plus),
                 checks_used_month, checks_month_key, created_at
specimens        id, owner_id, species, variety, locality, formation, matrix, dims jsonb,
                 provenance, acquired_at, acquisition_price_cents, est_value_cents,
                 rarity, condition, visibility (private|public), created_at, updated_at
specimen_photos  id, specimen_id, storage_path, is_primary, uploaded_at
visual_checks    id, user_id, image_path, status (queued|processing|complete|failed),
                 model_used, result_json jsonb, confidence, consumed (allowance|credit),
                 created_at, completed_at
sellers          id, profile_id, business_name, tier (self_certified|documented|lab_verified),
                 credibility_score, ratings_count, stripe_connect_account_id,
                 connect_onboarding_status (pending|active|restricted), docs_review_flag
listings         id, seller_id, specimen_id nullable, species, locality, title, description,
                 price_cents, currency, photo_verified bool, status (draft|active|sold|cancelled)
orders           id, listing_id, buyer_id, seller_id, amount_cents, platform_fee_cents,
                 stripe_payment_intent_id, tracking_number, status
                 (pending|escrow_held|shipped|delivered|disputed|released|refunded), created_at
ratings          id, order_id unique, buyer_id, seller_id,
                 accuracy (as_described|minor|not_as_described), photo_match bool, created_at
subscriptions    user_id, rc_app_user_id, rc_entitlement, status (trialing|active|canceled|expired),
                 renews_at, store (app_store|play|stripe_web)
credit_ledger    id, user_id, delta int, reason (purchase|check_used|grant|refund),
                 rc_transaction_id nullable, created_at        -- APPEND-ONLY
```

Design notes carried over from the data-model doc:
- `visual_checks.result_json` stays jsonb — appraisal schemas evolve with prompt tuning;
  don't force a migration per prompt change.
- `credit_ledger` is the source of truth; `credits_balance` is computed
  (`SUM(delta)`) via a SQL function, never a mutable column the client can race.
- Decouple Visual Check from specimens: users check photos of things they don't own yet
  ("what is this thing"). `Save to catalog` promotes a check into a specimen.
- Idempotency everywhere money moves: RevenueCat `transaction_id` unique on ledger inserts;
  Stripe idempotency keys = our `orders.id`.

## 3. Auth
- Supabase Auth: email/password, Sign in with Apple (required if any social login is offered),
  Google OAuth.
- Password reset via magic link → in-app reset screen (matches prototype flow).
- Email change requires re-verification. Delete account = soft-delete + 30-day purge
  (App Store requirement). Sign-out revokes refresh tokens.

## 4. Visual Check pipeline
1. App uploads image to `check-uploads` bucket (EXIF/GPS stripped client-side), calls
   `POST /functions/v1/visual-check` with the storage path.
2. Function (JWT-verified) checks gate: `plan = 'plus'` → unlimited; else monthly allowance
   (3, keyed by `checks_month_key`) → then `credit_ledger` balance. No allowance and no
   credits → 402 with paywall hint.
3. Calls Anthropic vision model server-side; writes `visual_checks` row with `result_json`
   (species candidates + confidence, red flags for the species — dye/treatment/implausible
   locality or price, price-range placeholder until comps data exists).
4. On success: increments `checks_used_month` OR inserts `credit_ledger` −1
   (`reason='check_used'`), atomically in one RPC.
5. Response is always framed as a second opinion, not certified authentication.
Rate-limit per user; log every request.

## 5. Marketplace / escrow (Stripe Connect)
1. Sellers onboard via Connect Express (Stripe handles KYC). `account.updated` webhook keeps
   `connect_onboarding_status` current; listings gated on `active`.
2. Buy: `create-order` function creates a PaymentIntent — destination charge to the seller's
   connected account, `capture_method: manual`, `application_fee_amount` = platform fee.
   Order `pending` → authorized → `escrow_held`.
3. Seller ships with tracking → `shipped`. Buyer confirms delivery (or 7-day auto-confirm
   after tracked delivery) → `confirm-delivery` captures the intent → funds transfer minus
   fee → `released`.
4. Dispute → `disputed` → human review queue; refund = cancel uncaptured intent, or refund
   captured charge.
5. All price math server-side in cents. Client never sends an amount.

## 6. Credibility scoring
Score 0–10 from ratings on material accuracy only (not general satisfaction).
Recency-weighted rolling average (recent orders weigh more), recomputed on each new rating
(`POST /ratings`, one per order, enforced by unique constraint). Documentation tiers
(Self-Certified → Documented Sourcing → Lab-Verified) additionally require an ops-set
`docs_review_flag` — badges are earned, never bought.

## 7. Edge Function surface

```
POST /functions/v1/visual-check         image path → AI result; consumes allowance/credit
POST /functions/v1/create-order         listing_id → PaymentIntent client_secret
POST /functions/v1/confirm-delivery     order_id → capture + transfer (buyer or cron)
POST /functions/v1/revenuecat-webhook   entitlements + consumables   (--no-verify-jwt, HMAC-authed)
POST /functions/v1/stripe-webhook       Connect + payment events     (--no-verify-jwt, sig-verified)
```
CRUD for specimens/listings/ratings/profile goes straight through supabase-js under RLS —
no function needed.

## 8. Webhooks to handle
RevenueCat: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`,
`NON_RENEWING_PURCHASE` (credit packs), `BILLING_ISSUE` (grace period: pause checks, don't
cancel). Stripe: `account.updated`, `payment_intent.amount_capturable_updated`,
`payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created`.

## 9. Security checklist
- RLS on every table; storage buckets private with signed URLs.
- Secrets only in Edge env (`supabase secrets set`): ANTHROPIC_API_KEY, STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET, REVENUECAT_WEBHOOK_AUTH.
- Validate IAP receipts server-side (RevenueCat does this; trust its webhook, not the client).
- Strip EXIF GPS from photos before storage.
- Rate-limit visual-check; cap upload size; validate mime type server-side.
