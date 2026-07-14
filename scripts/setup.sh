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

echo "▸ Applying migrations (schema, RLS, private storage buckets)…"
supabase db push

echo "▸ Setting Edge Function secrets (paste values when prompted)…"
read -r -p "ANTHROPIC_API_KEY: "        ANTHROPIC_API_KEY
read -r -p "STRIPE_SECRET_KEY: "        STRIPE_SECRET_KEY
read -r -p "STRIPE_WEBHOOK_SECRET: "    STRIPE_WEBHOOK_SECRET
read -r -p "REVENUECAT_WEBHOOK_AUTH (any strong random string; mirror it in the RC dashboard): " RC_AUTH
supabase secrets set \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  REVENUECAT_WEBHOOK_AUTH="$RC_AUTH"

echo "▸ Deploying Edge Functions…"
supabase functions deploy visual-check
supabase functions deploy create-order
supabase functions deploy confirm-delivery
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt

echo "▸ Reminders:"
echo "  1. Storage buckets specimen-photos + check-uploads are created by migration (private, path = {uid}/…)."
echo "  2. Point the Stripe webhook endpoint at .../functions/v1/stripe-webhook."
echo "  3. Point the RevenueCat webhook at .../functions/v1/revenuecat-webhook with the Bearer auth you just set."
echo "  4. Copy .env.example → .env and fill the EXPO_PUBLIC_ values."
echo "✓ Done. Start the app with: npx expo start"
