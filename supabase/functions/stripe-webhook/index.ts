import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { corsHeaders, json, logWebhookEvent, markWebhookRow } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  const rowId = await logWebhookEvent(admin, "stripe", event.type, event, event.id);

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const status =
          account.charges_enabled && account.payouts_enabled
            ? "active"
            : account.requirements?.disabled_reason
              ? "restricted"
              : "pending";
        await admin
          .from("sellers")
          .update({ connect_onboarding_status: status })
          .eq("stripe_connect_account_id", account.id);
        break;
      }
      case "payment_intent.amount_capturable_updated": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await admin
          .from("orders")
          .update({ status: "escrow_held" })
          .eq("stripe_payment_intent_id", pi.id);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await admin
          .from("orders")
          .update({ status: "released" })
          .eq("stripe_payment_intent_id", pi.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await admin
            .from("orders")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent);
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        if (dispute.payment_intent) {
          const { data: order } = await admin
            .from("orders")
            .update({ status: "disputed" })
            .eq("stripe_payment_intent_id", dispute.payment_intent)
            .select("id")
            .maybeSingle();
          if (order?.id) {
            await admin.from("dispute_queue").insert({
              order_id: order.id,
              stripe_dispute_id: dispute.id,
              status: "open",
              notes: dispute.reason ?? null,
            });
          }
        }
        break;
      }
    }
    await markWebhookRow(admin, rowId, true);
    return json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    await markWebhookRow(admin, rowId, false, msg);
    return json({ error: msg }, 500);
  }
});
