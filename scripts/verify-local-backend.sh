#!/usr/bin/env bash
# Smoke-test local Supabase soft-launch readiness (auth, catalog, soft-delete, purge).
set -euo pipefail
export PATH="${HOME}/.local/share/supabase:${PATH}"

ANON="${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
BASE="${SUPABASE_URL:-http://127.0.0.1:54321}"
CRON_SECRET="${CRON_SECRET:-local-cron-secret-change-me}"
EMAIL="verify-$(date +%s)@sage.test"
PASS="sage-test-1234"

echo "▸ Signup $EMAIL"
SIGN=$(curl -s -X POST "$BASE/auth/v1/signup" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"data\":{\"display_name\":\"Verify\"}}")
TOKEN=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('access_token') or '')" "$SIGN")
if [ -z "$TOKEN" ]; then
  TOKEN=$(curl -s -X POST "$BASE/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
fi
USER_ID=$(curl -s -X POST "$BASE/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['user']['id'])")
echo "  user=$USER_ID"

echo "▸ Profile row"
curl -sf "$BASE/rest/v1/profiles?select=display_name,plan&id=eq.$USER_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | grep -q Verify
echo "  ok"

echo "▸ Specimen create"
SPEC=$(curl -sf -X POST "$BASE/rest/v1/specimens" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"owner_id\":\"$USER_ID\",\"species\":\"Fluorite\",\"locality\":\"Weardale\",\"est_value_cents\":52000}")
SID=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])[0]['id'])" "$SPEC")
echo "  specimen=$SID"

echo "▸ Specimen update + delete"
curl -sf -X PATCH "$BASE/rest/v1/specimens?id=eq.$SID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"locality":"Rogerley Mine"}' >/dev/null
curl -sf -X DELETE "$BASE/rest/v1/specimens?id=eq.$SID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "  ok"

echo "▸ Password reset email"
curl -sf -X POST "$BASE/auth/v1/recover" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}" >/dev/null
echo "  ok (check Mailpit at :54324)"

echo "▸ Soft-delete account"
curl -sf -X POST "$BASE/rest/v1/rpc/soft_delete_account" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' >/dev/null
curl -sf "$BASE/rest/v1/profiles?select=deleted_at,purge_after&id=eq.$USER_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | grep -q deleted_at
echo "  ok"

echo "▸ Purge cron (force purge_after to past)"
docker exec -i supabase_db_sage psql -U postgres -c \
  "update public.profiles set purge_after=now()-interval '1 minute' where id='$USER_ID';" >/dev/null
PURGE=$(curl -s -X POST "$BASE/functions/v1/purge-deleted-accounts" \
  -H "Authorization: Bearer $CRON_SECRET")
echo "  response=$PURGE"
python3 -c "import json,sys; d=json.loads(sys.argv[1]); assert d.get('ok') is True, d" "$PURGE"

echo "▸ Login after purge (should fail)"
CODE=$(curl -s -o /tmp/login_after.json -w "%{http_code}" -X POST "$BASE/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
test "$CODE" != "200"
echo "  ok (HTTP $CODE)"

echo "✓ Local backend soft-launch checks passed"
