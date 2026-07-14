import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/cors.ts";

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
  if (!appUserId) return json({ error: "missing app_user_id" }, 400);

  try {
    if (["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"].includes(type)) {
      const entitlementIds: string[] = event.entitlement_ids ?? [];
      const entitlement = entitlementIds[0] ?? "plus";
      if (entitlement === "plus" || entitlementIds.includes("plus")) {
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

    if (type === "BILLING_ISSUE") {
      // Keep profiles.plan = plus for grace UX messaging, but pause checks via status.
      await admin.from("subscriptions").upsert({
        user_id: appUserId,
        rc_app_user_id: appUserId,
        rc_entitlement: "plus",
        status: "billing_issue",
        updated_at: new Date().toISOString(),
      });
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
      const productId = ((event.product_id as string) ?? "").toLowerCase();
      let credits = 0;
      if (productId.includes("credits_40") || productId.includes("40")) credits = 40;
      else if (productId.includes("credits_15") || productId.includes("15")) credits = 15;
      else if (productId.includes("credits_5") || productId.includes("5")) credits = 5;
      else credits = Number(event.purchased_quantity ?? 0) || 0;

      const tx = event.transaction_id as string | undefined;
      if (credits > 0) {
        await admin.from("credit_ledger").upsert(
          {
            user_id: appUserId,
            delta: credits,
            reason: "purchase",
            rc_transaction_id: tx ?? `${appUserId}-${event.id ?? Date.now()}`,
          },
          { onConflict: "rc_transaction_id", ignoreDuplicates: true },
        );
      }
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
