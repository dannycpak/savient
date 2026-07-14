import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json, logWebhookEvent, markWebhookRow } from "../_shared/cors.ts";

const CREDIT_PRODUCTS: Record<string, number> = {
  sage_credits_5: 5,
  sage_credits_15: 15,
  sage_credits_40: 40,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  const auth = req.headers.get("Authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const payload = await req.json();
  const event = payload.event ?? payload;
  const type = event.type as string;
  const appUserId = event.app_user_id as string;
  const eventId = String(event.id ?? event.transaction_id ?? `${type}-${Date.now()}`);
  const rowId = await logWebhookEvent(admin, "revenuecat", type, payload, eventId);

  if (!appUserId) {
    await markWebhookRow(admin, rowId, false, "missing app_user_id");
    return json({ error: "missing app_user_id" }, 400);
  }

  try {
    if (["INITIAL_PURCHASE", "RENEWAL"].includes(type)) {
      const ids: string[] = event.entitlement_ids ?? [];
      if (ids.includes("plus") || event.product_id === "sage_plus_monthly") {
        await admin.from("profiles").update({ plan: "plus" }).eq("id", appUserId);
        await admin.from("subscriptions").upsert({
          user_id: appUserId,
          rc_app_user_id: appUserId,
          rc_entitlement: "plus",
          status: event.period_type === "trial" ? "trialing" : "active",
          renews_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          store:
            event.store === "APP_STORE"
              ? "app_store"
              : event.store === "PLAY_STORE"
                ? "play"
                : null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (["CANCELLATION", "EXPIRATION"].includes(type)) {
      await admin.from("profiles").update({ plan: "free" }).eq("id", appUserId);
      await admin.from("subscriptions").upsert({
        user_id: appUserId,
        rc_app_user_id: appUserId,
        rc_entitlement: "plus",
        status: type === "CANCELLATION" ? "canceled" : "expired",
        updated_at: new Date().toISOString(),
      });
    }

    if (type === "NON_RENEWING_PURCHASE") {
      const productId = (event.product_id as string) ?? "";
      const credits =
        CREDIT_PRODUCTS[productId] ??
        (productId.includes("credits_40")
          ? 40
          : productId.includes("credits_15")
            ? 15
            : productId.includes("credits_5")
              ? 5
              : 0);
      const tx = event.transaction_id as string | undefined;
      if (credits > 0) {
        await admin.from("credit_ledger").upsert(
          {
            user_id: appUserId,
            delta: credits,
            reason: "purchase",
            rc_transaction_id: tx ?? `${appUserId}-${eventId}`,
          },
          { onConflict: "rc_transaction_id", ignoreDuplicates: true },
        );
      }
    }

    await markWebhookRow(admin, rowId, true);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    await markWebhookRow(admin, rowId, false, msg);
    return json({ error: msg }, 500);
  }
});
