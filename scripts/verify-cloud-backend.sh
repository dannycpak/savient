#!/usr/bin/env bash
# Smoke-test linked cloud Supabase (auth, catalog, soft-delete, purge).
# Uses Auth Admin createUser to avoid email rate limits.
set -euo pipefail
export PATH="${HOME}/.local/share/supabase:${PATH}"

REF="${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF to your Supabase project ref}"
URL="${EXPO_PUBLIC_SUPABASE_URL:-https://${REF}.supabase.co}"
ANON_FILE="${HOME}/.config/sage/anon_key"
SERVICE_FILE="${HOME}/.config/sage/service_role_key"
CRON_FILE="${HOME}/.config/sage/cron_secret"
TOKEN_FILE="${HOME}/.config/sage/supabase_access_token"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && [ -f "$TOKEN_FILE" ]; then
  export SUPABASE_ACCESS_TOKEN="$(cat "$TOKEN_FILE")"
fi

mkdir -p "${HOME}/.config/sage"
umask 077
if [ ! -f "$ANON_FILE" ] || [ ! -f "$SERVICE_FILE" ]; then
  curl -sS "https://api.supabase.com/v1/projects/${REF}/api-keys" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" |
    python3 -c "
import json,sys
from pathlib import Path
keys=json.load(sys.stdin)
Path('${ANON_FILE}').write_text(next(k['api_key'] for k in keys if k.get('name')=='anon'))
Path('${SERVICE_FILE}').write_text(next(k['api_key'] for k in keys if k.get('name')=='service_role'))
"
fi

ANON="$(cat "$ANON_FILE")"
SERVICE="$(cat "$SERVICE_FILE")"
CRON="$(cat "$CRON_FILE")"
EMAIL="cloud-verify-$(date +%s)@sage.test"
PASS="SageCloudTest123!"

echo "▸ Admin create + login $EMAIL"
curl -sf --max-time 30 -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"email_confirm\":true,\"user_metadata\":{\"display_name\":\"CloudVerify\"}}" >/tmp/au.json
USER_ID=$(python3 -c "import json; print(json.load(open('/tmp/au.json'))['id'])")
LOGIN=$(curl -sf --max-time 20 -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['access_token'])" "$LOGIN")
echo "  user=$USER_ID"

echo "▸ Profile + credits_balance"
curl -sf --max-time 20 "$URL/rest/v1/profiles?select=display_name,plan,purge_after&id=eq.$USER_ID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | grep -q CloudVerify
curl -sf --max-time 20 -X POST "$URL/rest/v1/rpc/credits_balance" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' >/dev/null
echo "  ok"

echo "▸ Specimen CRUD"
SPEC=$(curl -sf --max-time 20 -X POST "$URL/rest/v1/specimens" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"owner_id\":\"$USER_ID\",\"species\":\"Fluorite\",\"locality\":\"Weardale\",\"est_value_cents\":52000}")
SID=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])[0]['id'])" "$SPEC")
curl -sf --max-time 20 -X PATCH "$URL/rest/v1/specimens?id=eq.$SID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"locality":"Rogerley Mine"}' >/dev/null
curl -sf --max-time 20 -X DELETE "$URL/rest/v1/specimens?id=eq.$SID" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" >/dev/null
echo "  ok specimen=$SID"

echo "▸ Soft-delete + purge"
curl -sf --max-time 20 -X POST "$URL/rest/v1/rpc/soft_delete_account" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}' >/dev/null
curl -sf --max-time 20 -X PATCH "$URL/rest/v1/profiles?id=eq.$USER_ID" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" -H "Content-Type: application/json" \
  -d '{"purge_after":"2020-01-01T00:00:00Z"}' >/dev/null
PURGE=$(curl -sf --max-time 60 -X POST "$URL/functions/v1/purge-deleted-accounts" \
  -H "Authorization: Bearer $CRON" -H "apikey: $ANON")
echo "  $PURGE"
echo "$PURGE" | grep -q '"ok":true'
code=$(curl -s --max-time 20 -o /tmp/login-after-purge.json -w '%{http_code}' -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
test "$code" != "200"
echo "  login after purge HTTP $code"

echo "✓ Cloud backend soft-launch checks passed"
