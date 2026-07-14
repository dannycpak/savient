import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { corsHeaders, json } from "../_shared/cors.ts";

const PLATFORM_FEE_BPS = 1200; // 12%

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

    const { listing_id } = await req.json();
    if (!listing_id) return json({ error: "listing_id required" }, 400);

    const { data: listing, error } = await admin
      .from("listings")
      .select("id, price_cents, status, seller_id, sellers(stripe_connect_account_id, connect_onboarding_status)")
      .eq("id", listing_id)
      .single();
    if (error || !listing) return json({ error: "Listing not found" }, 404);
    if (listing.status !== "active") return json({ error: "Listing not active" }, 400);

    const seller = listing.sellers as {
      stripe_connect_account_id: string | null;
      connect_onboarding_status: string;
    } | null;
    if (!seller?.stripe_connect_account_id || seller.connect_onboarding_status !== "active") {
      return json({ error: "Seller not ready for payouts" }, 400);
    }

    const amount = listing.price_cents as number;
    const fee = Math.round((amount * PLATFORM_FEE_BPS) / 10000);
    const orderId = crypto.randomUUID();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const pi = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        capture_method: "manual",
        application_fee_amount: fee,
        transfer_data: { destination: seller.stripe_connect_account_id },
        metadata: { order_id: orderId, listing_id },
      },
      { idempotencyKey: orderId },
    );

    const { error: orderErr } = await admin.from("orders").insert({
      id: orderId,
      listing_id,
      buyer_id: userData.user.id,
      seller_id: listing.seller_id,
      amount_cents: amount,
      platform_fee_cents: fee,
      stripe_payment_intent_id: pi.id,
      status: "pending",
    });
    if (orderErr) return json({ error: orderErr.message }, 500);

    return json({ order_id: orderId, client_secret: pi.client_secret });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
