import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return json({ error: "Unauthorized" }, 401);

    const { order_id } = await req.json();
    if (!order_id) return json({ error: "order_id required" }, 400);

    const { data: order } = await admin.from("orders").select("*").eq("id", order_id).single();
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.buyer_id !== userData.user.id) return json({ error: "Forbidden" }, 403);
    if (!["escrow_held", "shipped", "delivered"].includes(order.status)) {
      return json({ error: `Cannot capture from status ${order.status}` }, 400);
    }
    if (!order.stripe_payment_intent_id) return json({ error: "No payment intent" }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    await stripe.paymentIntents.capture(order.stripe_payment_intent_id);
    await admin.from("orders").update({ status: "delivered" }).eq("id", order_id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
