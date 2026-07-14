export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, stripe-signature",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
type Sb = any;

/** Persist webhook payload for reconciliation. Best-effort; never throws to caller. */
export async function logWebhookEvent(
  admin: Sb,
  source: "revenuecat" | "stripe",
  eventType: string,
  payload: unknown,
  eventId?: string | null,
) {
  try {
    const { data, error } = await admin
      .from("webhook_events")
      .insert({
        source,
        event_type: eventType,
        event_id: eventId ?? null,
        payload,
        processed: false,
      })
      .select("id")
      .maybeSingle();
    if (error) return null;
    return data?.id as string | undefined;
  } catch {
    return null;
  }
}

export async function markWebhookRow(
  admin: Sb,
  rowId: string | null | undefined,
  ok: boolean,
  errorMsg?: string,
) {
  if (!rowId) return;
  try {
    await admin
      .from("webhook_events")
      .update({
        processed: ok,
        error: errorMsg ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", rowId);
  } catch {
    /* ignore */
  }
}
