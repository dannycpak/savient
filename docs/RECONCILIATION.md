# Sage — Reconciliation

Edge Function: `POST /functions/v1/reconcile` (deploy with `--no-verify-jwt`).

## Auth
Send either:
- `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, or
- `x-cron-secret: <RECONCILE_CRON_SECRET>` (set via `supabase secrets set`)

## What it does
1. **Credit audit** — runs `reconcile_credit_anomalies` + samples `audit_credit_balances`.
2. **Unprocessed webhooks** — lists `webhook_events` stuck unprocessed > 5 minutes (RevenueCat/Stripe payloads are logged by those webhooks).
3. **Auto-confirm** — captures PaymentIntents for shipped+tracked orders older than 7 days; marks `released`.
4. **Purge candidates** — lists profiles with `purge_after` in the past (soft-deleted accounts ready for hard purge).

## Schedule
Hourly cron example (GitHub Actions / Supabase scheduled functions / external):

```bash
curl -X POST "$SUPABASE_URL/functions/v1/reconcile" \
  -H "x-cron-secret: $RECONCILE_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Ops tables
- `webhook_events` — append-only ingress log; `processed` / `error` updated after handling.
- `dispute_queue` — opened on `charge.dispute.created` for human review.
