import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

    const { order_id, tracking_number } = await req.json();
    if (!order_id || !tracking_number) {
      return json({ error: "order_id and tracking_number required" }, 400);
    }

    const { data: order } = await admin.from("orders").select("*").eq("id", order_id).single();
    if (!order) return json({ error: "Order not found" }, 404);

    const { data: seller } = await admin
      .from("sellers")
      .select("id, profile_id")
      .eq("id", order.seller_id)
      .single();
    if (!seller || seller.profile_id !== userData.user.id) {
      return json({ error: "Forbidden" }, 403);
    }
    if (!["escrow_held", "pending"].includes(order.status)) {
      return json({ error: `Cannot ship from status ${order.status}` }, 400);
    }

    const { error } = await admin
      .from("orders")
      .update({
        tracking_number: String(tracking_number).trim(),
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", order_id);
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, status: "shipped" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
