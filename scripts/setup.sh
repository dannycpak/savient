#!/usr/bin/env bash
# Sage — one-shot local bootstrap. Run from the project root.
set -euo pipefail

echo "▸ Installing app dependencies…"
npm install

echo "▸ Checking Supabase CLI…"
command -v supabase >/dev/null || { echo "Install the Supabase CLI first: https://supabase.com/docs/guides/cli"; exit 1; }

if [ ! -f supabase/config.toml ]; then
  echo "▸ Initializing Supabase project…"
  supabase init
fi

echo "▸ Linking to your Supabase cloud project (skip with ctrl-c if local-only)…"
supabase link || true

echo "▸ Applying migrations (schema + storage buckets/policies)…"
supabase db push

echo "▸ Setting Edge Function secrets (paste values when prompted)…"
read -r -p "ANTHROPIC_API_KEY: "        ANTHROPIC_API_KEY
read -r -p "STRIPE_SECRET_KEY: "        STRIPE_SECRET_KEY
read -r -p "STRIPE_WEBHOOK_SECRET: "    STRIPE_WEBHOOK_SECRET
read -r -p "REVENUECAT_WEBHOOK_AUTH (any strong random string; mirror it in the RC dashboard): " RC_AUTH
read -r -p "CRON_SECRET (Bearer for purge-deleted-accounts): " CRON_SECRET
supabase secrets set \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  REVENUECAT_WEBHOOK_AUTH="$RC_AUTH" \
  CRON_SECRET="$CRON_SECRET"

echo "▸ Deploying Edge Functions…"
supabase functions deploy visual-check
supabase functions deploy create-order
supabase functions deploy confirm-delivery
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy purge-deleted-accounts --no-verify-jwt

echo "▸ Reminders:"
echo "  1. Storage buckets specimen-photos + check-uploads are created by migration 0002."
echo "  2. Enable Apple + Google providers in Supabase Auth; add EXPO_PUBLIC_GOOGLE_* to .env."
echo "  3. Point RevenueCat webhook at .../functions/v1/revenuecat-webhook with Bearer auth."
echo "  4. Schedule a daily cron hitting .../functions/v1/purge-deleted-accounts with CRON_SECRET."
echo "  5. Copy .env.example → .env; set EAS project id in app.json; see docs/STORE_SUBMISSION.md."
echo "✓ Done. Start the app with: npx expo start  (IAP needs a dev client: npx expo run:ios)"
