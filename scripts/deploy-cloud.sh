#!/usr/bin/env bash
# Non-interactive cloud deploy (link + secrets must already be done).
# Usage (from repo root, after `supabase link`):
#   supabase secrets set ANTHROPIC_API_KEY=… REVENUECAT_WEBHOOK_AUTH=… CRON_SECRET=…
#   ./scripts/deploy-cloud.sh
set -euo pipefail
export PATH="${HOME}/.local/share/supabase:${PATH}"

echo "▸ Pushing migrations…"
supabase db push

echo "▸ Deploying Edge Functions…"
supabase functions deploy visual-check
supabase functions deploy create-order
supabase functions deploy confirm-delivery
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy purge-deleted-accounts --no-verify-jwt

echo "✓ Deployed. Enable Auth providers + schedule purge cron — see docs/SOFT_LAUNCH.md"
