#!/usr/bin/env bash
# Sage — one-shot local bootstrap. Run from the project root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▸ Installing app dependencies…"
npm install

if [ ! -f .env ]; then
  echo "▸ Creating .env from .env.example (fill EXPO_PUBLIC_* values before running the app)…"
  cp .env.example .env
fi

echo "▸ Checking Supabase CLI…"
if ! command -v supabase >/dev/null; then
  echo "  Supabase CLI not found — installing via npx for this session."
  SUPABASE=(npx supabase)
else
  SUPABASE=(supabase)
fi

if [ ! -f supabase/config.toml ]; then
  echo "▸ Initializing Supabase project…"
  "${SUPABASE[@]}" init
fi

echo "▸ Linking to your Supabase cloud project (skip with ctrl-c / set SKIP_LINK=1)…"
if [ "${SKIP_LINK:-0}" != "1" ]; then
  "${SUPABASE[@]}" link || true
fi

echo "▸ Applying migrations (schema + storage buckets)…"
if [ "${SKIP_DB:-0}" != "1" ]; then
  "${SUPABASE[@]}" db push || {
    echo "  db push failed — ensure you ran supabase link, or use: supabase db reset --local"
  }
fi

if [ "${SKIP_SECRETS:-0}" != "1" ]; then
  echo "▸ Setting Edge Function secrets (paste values when prompted; SKIP_SECRETS=1 to skip)…"
  read -r -p "ANTHROPIC_API_KEY: "        ANTHROPIC_API_KEY
  read -r -p "STRIPE_SECRET_KEY: "        STRIPE_SECRET_KEY
  read -r -p "STRIPE_WEBHOOK_SECRET: "    STRIPE_WEBHOOK_SECRET
  read -r -p "REVENUECAT_WEBHOOK_AUTH (strong random string; mirror in RC dashboard): " RC_AUTH
  "${SUPABASE[@]}" secrets set \
    ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    REVENUECAT_WEBHOOK_AUTH="$RC_AUTH"
fi

if [ "${SKIP_DEPLOY:-0}" != "1" ]; then
  echo "▸ Deploying Edge Functions…"
  "${SUPABASE[@]}" functions deploy visual-check
  "${SUPABASE[@]}" functions deploy create-order
  "${SUPABASE[@]}" functions deploy confirm-delivery
  "${SUPABASE[@]}" functions deploy create-connect-account
  "${SUPABASE[@]}" functions deploy add-tracking
  "${SUPABASE[@]}" functions deploy stripe-webhook --no-verify-jwt
  "${SUPABASE[@]}" functions deploy revenuecat-webhook --no-verify-jwt
fi

echo "▸ Reminders:"
echo "  1. Storage buckets specimen-photos + check-uploads are created by migration 0002."
echo "  2. Point Stripe webhook at .../functions/v1/stripe-webhook."
echo "  3. Point RevenueCat webhook at .../functions/v1/revenuecat-webhook with Bearer auth."
echo "  4. Enable Apple + Google providers in Supabase Auth; set EXPO_PUBLIC_GOOGLE_* in .env."
echo "  5. Fill remaining EXPO_PUBLIC_* values in .env."
echo "✓ Done. Start the app with: npx expo start"
echo "  (RevenueCat + Apple Sign-In need a dev client: npx expo run:ios)"
