#!/usr/bin/env bash
# Apply Sage schema + RLS migrations to the linked Supabase project.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v supabase >/dev/null || {
  echo "Install Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
}

echo "▸ Pushing migrations 0001–0007…"
supabase db push
echo "✓ Applied. See docs/STORE_SETUP.md for Auth providers + webhooks."
