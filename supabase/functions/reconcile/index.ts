import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { corsHeaders, json } from "../_shared/cors.ts";

/**
 * Reconciliation job — invoke on a schedule (Supabase cron / external).
 * Auth: service role bearer OR RECONCILE_CRON_SECRET header.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const cronSecret = Deno.env.get("RECONCILE_CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  const cronHeader = req.headers.get("x-cron-secret") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const allowed =
    auth === `Bearer ${serviceKey}` ||
    (cronSecret && (cronHeader === cronSecret || auth === `Bearer ${cronSecret}`));
  if (!allowed) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  const report: Record<string, unknown> = {
    webhook_replayed: 0,
    webhook_errors: 0,
    credit_anomalies: [] as unknown[],
    auto_confirmed: 0,
    auto_confirm_errors: 0,
    accounts_purged: 0,
  };

  const { data: anomalies } = await admin.rpc("reconcile_credit_anomalies");
  report.credit_anomalies = anomalies ?? [];

  const { data: balances } = await admin.rpc("audit_credit_balances");
  report.credit_balances_sampled = (balances ?? []).slice(0, 20);

  // Replay stuck webhook_events (mark processed after re-dispatch note)
  const { data: stuck } = await admin
    .from("webhook_events")
    .select("id, source, event_type, payload, error, created_at")
    .eq("processed", false)
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(50);
  report.unprocessed_webhooks = stuck ?? [];

  for (const ev of stuck ?? []) {
    try {
      // Mark for ops: payload retained; set processed with note that cron reviewed it.
      // Full Stripe/RC re-delivery still happens via provider retry; we clear stuck rows
      // that are informational after 24h.
      const ageMs = Date.now() - new Date(ev.created_at).getTime();
      if (ageMs > 24 * 60 * 60 * 1000) {
        await admin
          .from("webhook_events")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error: ev.error ? `${ev.error} | archived by reconcile` : "archived by reconcile",
          })
          .eq("id", ev.id);
        report.webhook_replayed = (report.webhook_replayed as number) + 1;
      }
    } catch {
      report.webhook_errors = (report.webhook_errors as number) + 1;
    }
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (stripeKey) {
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const { data: due } = await admin.rpc("orders_due_for_auto_confirm");
    for (const order of due ?? []) {
      try {
        if (order.stripe_payment_intent_id) {
          await stripe.paymentIntents.capture(order.stripe_payment_intent_id);
        }
        await admin.from("orders").update({ status: "released" }).eq("id", order.id);
        await admin.from("listings").update({ status: "sold" }).eq("id", order.listing_id);
        report.auto_confirmed = (report.auto_confirmed as number) + 1;
      } catch (e) {
        report.auto_confirm_errors = (report.auto_confirm_errors as number) + 1;
        await admin.from("webhook_events").insert({
          source: "stripe",
          event_type: "reconcile.auto_confirm_failed",
          payload: { order_id: order.id, error: e instanceof Error ? e.message : String(e) },
          processed: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  const { data: purged, error: purgeErr } = await admin.rpc("purge_due_accounts");
  if (!purgeErr && typeof purged === "number") report.accounts_purged = purged;

  return json({ ok: true, report });
});
