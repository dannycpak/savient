# Sage — Store & vendor setup (manual)

These steps require your accounts — they cannot be automated from this repo alone.

## Supabase
1. Create a project → copy URL + anon key into `.env`.
2. Enable Auth providers: Email, Apple, Google.
3. Auth redirect URLs: `sage://auth/callback`, `sage://reset-password`.
4. Run `./scripts/setup.sh` (or `supabase db push` + function deploys).
5. Set Edge secrets: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REVENUECAT_WEBHOOK_AUTH`.

## RevenueCat / IAP (digital goods only)
1. App Store Connect + Play Console: create app records.
2. Products:
   - Subscription `plus` — $7/mo, 1-month free intro
   - Consumables: 5/$2.99 · 15/$6.99 · 40/$14.99
3. RevenueCat: entitlement `plus`, offerings, attach store products.
4. Webhook → `.../functions/v1/revenuecat-webhook` with Bearer = `REVENUECAT_WEBHOOK_AUTH`.
5. Put public SDK keys in `.env` (`EXPO_PUBLIC_REVENUECAT_*`).

## Stripe Connect (physical goods only)
1. Enable Connect Express.
2. Webhook → `.../functions/v1/stripe-webhook` for:
   `account.updated`, `payment_intent.amount_capturable_updated`,
   `payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created`.
3. Put publishable key in `.env` (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`).

## Privacy / app review
- Photos: processed for catalog + Visual Check; EXIF/GPS stripped client-side; no location retained.
- Account deletion: soft-delete + 30-day purge (`soft_delete_account`).
- Sign in with Apple required because Google is offered.
- Demo account + IAP review notes before submission.
- Visual Check disclaimer must remain visible on every result screen.
