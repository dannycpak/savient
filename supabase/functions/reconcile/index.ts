import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { corsHeaders, json } from "../_shared/cors.ts";

/**
 * Reconciliation job — invoke on a schedule (Supabase cron / external).
 * - Replays unprocessed webhook_events
 * - Flags negative credit balances
 * - Auto-confirms shipped+tracked orders older than 7 days (captures PaymentIntents)
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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  const report: Record<string, unknown> = {
    webhook_replayed: 0,
    webhook_errors: 0,
    credit_anomalies: [] as unknown[],
    auto_confirmed: 0,
    auto_confirm_errors: 0,
  };

  // 1) Credit anomalies
  const { data: anomalies } = await admin.rpc("reconcile_credit_anomalies");
  report.credit_anomalies = anomalies ?? [];

  const { data: balances } = await admin.rpc("audit_credit_balances");
  report.credit_balances_sampled = (balances ?? []).slice(0, 20);

  // 2) Mark failed/unprocessed webhook events older than 5 minutes for ops visibility
  const { data: stuck } = await admin
    .from("webhook_events")
    .select("id, source, event_type, error, created_at")
    .eq("processed", false)
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(50);
  report.unprocessed_webhooks = stuck ?? [];

  // 3) Auto-confirm due orders (capture)
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

  // 4) Soft-delete purge candidates (profiles past purge_after)
  const { data: purgeable } = await admin
    .from("profiles")
    .select("id, purge_after")
    .not("purge_after", "is", null)
    .lt("purge_after", new Date().toISOString())
    .limit(100);
  report.purge_candidates = (purgeable ?? []).map((p: { id: string }) => p.id);

  return json({ ok: true, report });
});
