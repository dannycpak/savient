import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/cors.ts";

const SYSTEM = `You are Sage Visual Check — a careful mineral specimen second opinion.
Return ONLY valid JSON with this shape:
{
  "candidates": [{"species": string, "confidence": number, "notes": string}],
  "observations": string,
  "red_flags": string[],
  "price_range": {"low_cents": number, "high_cents": number, "currency": "usd"} | null
}
Never claim certified authentication. Flag dye/treatment/implausible locality or price concerns.`;

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

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { image_path } = await req.json();
    if (!image_path || typeof image_path !== "string") {
      return json({ error: "image_path required" }, 400);
    }
    if (!image_path.startsWith(`${userId}/`)) {
      return json({ error: "Invalid path" }, 403);
    }

    // Quota gate
    const { data: consumed, error: consumeErr } = await admin.rpc("consume_check", {
      p_user_id: userId,
    });
    if (consumeErr) {
      if (consumeErr.message?.includes("NO_CHECKS")) {
        return json({ error: "Out of checks", paywall: true }, 402);
      }
      return json({ error: consumeErr.message }, 400);
    }

    const { data: signed, error: signErr } = await admin.storage
      .from("check-uploads")
      .createSignedUrl(image_path, 120);
    if (signErr || !signed?.signedUrl) return json({ error: "Image not found" }, 404);

    const { data: checkRow, error: insertErr } = await admin
      .from("visual_checks")
      .insert({
        user_id: userId,
        image_path,
        status: "processing",
        model_used: "claude-sonnet-4-20250514",
        consumed,
      })
      .select("id")
      .single();
    if (insertErr) return json({ error: insertErr.message }, 500);

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return json({ error: "AI not configured" }, 500);

    const imgRes = await fetch(signed.signedUrl);
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    let binary = "";
    for (const b of buf) binary += String.fromCharCode(b);
    const b64 = btoa(binary);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: b64 },
              },
              {
                type: "text",
                text: "Identify likely mineral species and note red flags for a collector purchase decision.",
              },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      await admin
        .from("visual_checks")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", checkRow.id);
      return json({ error: "Vision model failed" }, 502);
    }

    const aiJson = await aiRes.json();
    const text = aiJson.content?.find((c: { type: string }) => c.type === "text")?.text ?? "{}";
    let result;
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = {
        candidates: [],
        observations: text,
        red_flags: [],
        price_range: null,
      };
    }

    const confidence = result.candidates?.[0]?.confidence ?? null;
    await admin
      .from("visual_checks")
      .update({
        status: "complete",
        result_json: result,
        confidence,
        completed_at: new Date().toISOString(),
      })
      .eq("id", checkRow.id);

    return json({ id: checkRow.id, result });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
