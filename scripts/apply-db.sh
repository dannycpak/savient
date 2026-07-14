#!/usr/bin/env bash
# Apply Sage schema + RLS migrations to the linked Supabase project.
# Requires: supabase login (or SUPABASE_ACCESS_TOKEN) and `supabase link`.
set -euo pipefail

cd "$(dirname "$0")/.."

command -v supabase >/dev/null || {
  echo "Install Supabase CLI: https://supabase.com/docs/guides/cli"
  exit 1
}

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "▸ No SUPABASE_ACCESS_TOKEN — using existing CLI login session (supabase login)."
fi

echo "▸ Pushing migrations (0001 schema+RLS, 0002 storage+hardening)…"
supabase db push

echo "▸ Done. Verify in Dashboard → Authentication → Policies / Storage → Buckets:"
echo "    • specimen-photos (private)"
echo "    • check-uploads (private)"
echo "    • RLS enabled on all public tables"
