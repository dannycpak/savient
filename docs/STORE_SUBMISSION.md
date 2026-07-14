# Sage — Store submission guide

This release targets a first App Store / Play submission for **Auth + Catalog + Visual Check + IAP**.
Marketplace escrow (Stripe Connect) is intentionally gated as "Coming soon" until Phase 4.

## Prerequisites (outside this repo)

| Item | Where |
|---|---|
| Apple Developer Program | developer.apple.com |
| Google Play Console | play.google.com/console |
| Expo / EAS account | expo.dev — run `eas init` and replace `extra.eas.projectId` + `owner` in `app.json` |
| Supabase project | Auth (email, Apple, Google), migrate `0001`+`0002`, deploy functions via `scripts/setup.sh` |
| Anthropic API key | Edge Function secret `ANTHROPIC_API_KEY` |
| RevenueCat project | Entitlement `plus`, offerings, App Store + Play products linked |
| Google OAuth client IDs | Supabase Auth Google provider + `EXPO_PUBLIC_GOOGLE_*` |
| Apple Sign In | App ID capability + Supabase Apple provider (Services ID / key) |

## IAP products to create

| Product | Type | Price | Notes |
|---|---|---|---|
| `plus` / Sage+ | Auto-renewable subscription | $7/mo | 1-month free introductory offer |
| `credits_5` | Consumable | $2.99 | 5 Visual Check credits |
| `credits_15` | Consumable | $6.99 | 15 credits |
| `credits_40` | Consumable | $14.99 | 40 credits |

Wire these in RevenueCat to entitlement `plus` (subscription) and consumable packages.
Webhook: `POST {SUPABASE_URL}/functions/v1/revenuecat-webhook` with `Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH>`.

## Build & submit

```bash
cp .env.example .env   # fill EXPO_PUBLIC_* values
npm install
npx eas-cli login
npx eas-cli init       # writes real projectId into app.json
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
npx eas submit --platform ios --profile production
npx eas submit --platform android --profile production
```

IAP and Sign in with Apple require a **dev client / production binary**, not Expo Go:
`npx expo run:ios` / `npx expo run:android` or an EAS `development` build.

## App Review notes (paste into ASC)

> Sage is a mineral-specimen catalog with an AI Visual Check second opinion.
> Demo account: [CREATE BEFORE SUBMIT — email/password]
> Digital goods (Sage+ subscription, Visual Check credit packs) use StoreKit via RevenueCat.
> Visual Check is framed as a second opinion — not certified authentication (disclaimer on results).
> Account deletion: Profile → Account → Delete account (soft-delete + 30-day purge).
> Marketplace checkout is not enabled in this build ("Coming soon").

## Privacy (App Store / Play Data safety)

| Data | Collected | Linked to user | Purpose |
|---|---|---|---|
| Email / name | Yes | Yes | Account |
| Photos (specimen / check) | Yes | Yes | App functionality; EXIF/GPS stripped client-side before upload |
| Purchase history | Yes (via Apple/Google + RevenueCat webhook) | Yes | Subscriptions / credits |
| Precise location | No | — | Not collected (GPS stripped) |

iOS: `ITSAppUsesNonExemptEncryption = false` is set in `app.json`.

## Cron: 30-day account purge

Schedule daily:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/purge-deleted-accounts" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Checklist before pressing Submit

- [ ] `eas.json` submit.ios.ascAppId filled
- [ ] Real EAS `projectId` / `owner` in `app.json`
- [ ] Production `.env` / EAS secrets for `EXPO_PUBLIC_*`
- [ ] Migrations applied; functions + secrets deployed
- [ ] Apple + Google Auth providers live
- [ ] RevenueCat products + webhook verified (sandbox purchase → `profiles.plan` / credits)
- [ ] Demo account created for App Review
- [ ] Screenshots for 6.7" / 6.5" / Android phone
- [ ] Legal sign-off on Visual Check disclaimer (`constants/copy.ts`)
