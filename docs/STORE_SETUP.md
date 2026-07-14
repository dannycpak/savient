# Sage — Store & vendor setup (manual console clicks)

Repo artifacts are complete; these steps apply them in vendor dashboards.

## Supabase
1. Create a project → copy URL + anon key into `.env`.
2. Enable Auth providers: Email, Apple, Google.
3. Auth redirect URLs: `sage://auth/callback`, `sage://reset-password`.
4. Run `./scripts/setup.sh` (migrations, secrets, function deploys including `reconcile`).
5. Schedule hourly reconcile — `docs/RECONCILIATION.md`.

## RevenueCat / IAP (digital goods only)
Follow **`docs/IAP_PRODUCTS.md`** using IDs in **`config/iap-products.json`**:
- `sage_plus_monthly` ($7/mo, 1-month free)
- `sage_credits_5` / `_15` / `_40`
- Entitlement `plus`, offering `default`

## Stripe Connect (physical goods only)
1. Enable Connect Express.
2. Webhook → `.../functions/v1/stripe-webhook`.
3. Publishable key → `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## App review
Follow **`docs/APP_REVIEW.md`** (demo account, IAP notes, privacy).  
Disclaimer: **`docs/LEGAL_DISCLAIMER.md`**.
