# Sage — App Store / Play / RevenueCat product setup

Canonical product IDs live in `config/iap-products.json`. Create these exact products in each console, then attach them in RevenueCat.

## 1. App Store Connect
1. Create iOS app with bundle ID `com.jbstratis.sage`.
2. Subscriptions → group **Sage Plus** → product `sage_plus_monthly`
   - Price: **$7.00 / month**
   - Introductory offer: **1 month free**
3. In-App Purchases (Consumable):
   - `sage_credits_5` — $2.99
   - `sage_credits_15` — $6.99
   - `sage_credits_40` — $14.99
4. Submit products for review with the notes in `docs/APP_REVIEW.md`.

## 2. Google Play Console
1. Create app with package `com.jbstratis.sage`.
2. Subscriptions: `sage_plus_monthly` base plan `monthly` at $7 with 1-month free trial.
3. One-time products (managed / consumable): same three credit product IDs and prices as above.

## 3. RevenueCat
1. Create project **Sage**; add iOS + Android apps; paste public SDK keys into `.env`.
2. Entitlement: **`plus`** (must match `lib/purchases.ts` → `ENTITLEMENT_PLUS`).
3. Products: import/store-link the four product IDs above.
4. Offering **`default`**:
   - `$rc_monthly` → `sage_plus_monthly`
   - `credits_5` / `credits_15` / `credits_40` → matching consumables
5. Webhook: `POST https://<project>.supabase.co/functions/v1/revenuecat-webhook`  
   Authorization: `Bearer <REVENUECAT_WEBHOOK_AUTH>`  
   Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, NON_RENEWING_PURCHASE, BILLING_ISSUE

## 4. Verify
- Paywall shows Sage+ + credit packs from the current offering.
- Test purchase on sandbox → `profiles.plan = plus` or `credit_ledger` +N via webhook.
- Restore purchases works on a second device.

**Billing isolation:** digital goods only via IAP/RevenueCat. Never sell Sage+ or credits through Stripe in the app.
