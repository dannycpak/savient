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

    const body = await req.json().catch(() => ({}));
    const businessName = (body.business_name as string | undefined)?.trim() || "Sage Seller";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let { data: seller } = await admin
      .from("sellers")
      .select("*")
      .eq("profile_id", userData.user.id)
      .maybeSingle();

    if (!seller) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { supabase_user_id: userData.user.id },
      });

      const { data: created, error } = await admin
        .from("sellers")
        .insert({
          profile_id: userData.user.id,
          business_name: businessName,
          stripe_connect_account_id: account.id,
          connect_onboarding_status: "pending",
        })
        .select("*")
        .single();
      if (error) return json({ error: error.message }, 500);
      seller = created;
    } else if (!seller.stripe_connect_account_id) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { supabase_user_id: userData.user.id },
      });
      const { data: updated, error } = await admin
        .from("sellers")
        .update({
          stripe_connect_account_id: account.id,
          business_name: businessName,
          connect_onboarding_status: "pending",
        })
        .eq("id", seller.id)
        .select("*")
        .single();
      if (error) return json({ error: error.message }, 500);
      seller = updated;
    }

    const link = await stripe.accountLinks.create({
      account: seller.stripe_connect_account_id!,
      refresh_url: "sage://seller/onboarding?refresh=1",
      return_url: "sage://seller/onboarding?return=1",
      type: "account_onboarding",
    });

    return json({
      seller_id: seller.id,
      onboarding_url: link.url,
      connect_onboarding_status: seller.connect_onboarding_status,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
