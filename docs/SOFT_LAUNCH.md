# Soft-launch runbook (local → cloud)

Excludes App Store / Play submission and Stripe marketplace.

## 1. Local backend (done in cloud agent / repeatable)

```bash
# Docker + CLI (once)
export PATH="$HOME/.local/share/supabase:$PATH"

cd /workspace
supabase start                    # applies migrations 0001–0003
supabase functions serve --env-file supabase/.env.local --no-verify-jwt

# Point the app at local Supabase
cp supabase/.env.local.example supabase/.env.local   # if present
# Fill ANTHROPIC_API_KEY for Visual Check
# .env (Expo):
#   EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>

chmod +x scripts/verify-local-backend.sh
./scripts/verify-local-backend.sh
```

Studio: http://127.0.0.1:54323 · Mailpit: http://127.0.0.1:54324

## 2. Cloud Supabase (you / ops)

1. Create a Supabase project; copy project ref.
2. From repo root:
   ```bash
   export PATH="$HOME/.local/share/supabase:$PATH"
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set \
     ANTHROPIC_API_KEY=… \
     REVENUECAT_WEBHOOK_AUTH=… \
     CRON_SECRET=…
   # Optional until Market ships: STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
   ./scripts/deploy-cloud.sh
   ```
   Interactive alternative: `scripts/setup.sh`.
3. Schedule daily cron (GitHub Actions, Supabase cron, or external):
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/purge-deleted-accounts" \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
4. Auth → enable Email; enable Apple + Google with real client IDs.
5. Auth → URL config: Site URL / redirects include `sage://reset-password`.
6. Close superseded open PR **#8** manually if still open (store-readiness already on `main` via #9).

## 3. App env

Fill `.env` / EAS secrets from `.env.example` with cloud URL + anon key + Google + RevenueCat public keys.

## 4. Remaining gates

| Item | Status |
|---|---|
| Email auth + catalog CRUD + soft-delete | Verified locally |
| Password reset email | Verified via Mailpit |
| Purge function | Verified when functions serve + service role env set |
| Apple / Google providers | Needs cloud Supabase + Apple/Google consoles |
| Visual Check + Anthropic | Needs `ANTHROPIC_API_KEY` |
| Native iOS/Android E2E | Needs Mac / device — not available in this Linux VM |
| Legal counsel sign-off | Drafts in `docs/LEGAL.md` — human review |
| Privacy / Terms host public URL | In-app routes `/legal/*` shipped; optional public web host later |
