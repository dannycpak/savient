# Sage — App Review Prep

## Demo account
After applying migrations, create the reviewer account in Supabase Auth (Dashboard → Users → Add user) **or** run the SQL helper in `supabase/seed/demo_reviewer.sql` instructions.

Suggested credentials (set these in App Store Connect / Play review notes):

| Field | Value |
|---|---|
| Email | `reviewer@sage.demo` |
| Password | `SageReview-2026!` |
| Plan | `plus` (pre-granted so Visual Check is unlimited) |

Do **not** commit real production passwords. Rotate after review if this inbox is shared.

## IAP review notes (paste into App Store Connect)

> Sage sells a subscription (**Sage+**, product `sage_plus_monthly`, $7/mo with 1-month free trial) and consumable Visual Check credit packs (`sage_credits_5`, `sage_credits_15`, `sage_credits_40`).  
> Digital goods use StoreKit / RevenueCat only. Marketplace specimen purchases (when enabled) are physical goods via Stripe Connect and are separate from IAP.  
> Demo: sign in with the reviewer account above → Profile shows Sage+ → Visual Check tab → add a specimen photo → run check. Every result screen shows the second-opinion disclaimer.  
> Restore Purchases is on the Sage+ paywall. Cancel subscription via iOS Settings → Subscriptions (deep-linked from Account → Billing).

## Play Data safety / App Privacy
- **Photos**: collected for catalog + Visual Check; processed on-device (EXIF strip) then uploaded; not used for tracking.
- **Purchase history**: handled by Apple/Google + RevenueCat; subscription status synced server-side.
- **Location**: not collected. GPS EXIF is stripped client-side before upload (`lib/images.ts`).
- **Account deletion**: Settings → Delete account (soft-delete + 30-day purge).

## Second-opinion disclaimer
Must remain visible on every Visual Check result. Canonical text: `docs/LEGAL_DISCLAIMER.md` / `constants/copy.ts`.

## Screenshots checklist
1. Home with collection value  
2. Catalog list  
3. Visual Check result **with disclaimer visible**  
4. Paywall (Sage+ + credit packs)  
5. Marketplace listing with seller credibility badge  
