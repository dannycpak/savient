// Cron/manual: hard-delete accounts past purge_after (App Store 30-day deletion).
// Deploy with --no-verify-jwt and protect via CRON_SECRET Bearer token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("Authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: doomed, error } = await admin
    .from("profiles")
    .select("id")
    .not("purge_after", "is", null)
    .lte("purge_after", new Date().toISOString())
    .limit(50);

  if (error) return json({ error: error.message }, 500);

  const purged: string[] = [];
  for (const row of doomed ?? []) {
    const uid = row.id as string;
    try {
      for (const bucket of ["specimen-photos", "check-uploads"]) {
        const { data: files } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
        if (files?.length) {
          await admin.storage.from(bucket).remove(files.map((f) => `${uid}/${f.name}`));
        }
      }
      const { error: delErr } = await admin.auth.admin.deleteUser(uid);
      if (delErr) {
        console.error("deleteUser failed", uid, delErr.message);
        continue;
      }
      purged.push(uid);
    } catch (e) {
      console.error("purge failed", uid, e);
    }
  }

  return json({ ok: true, purged_count: purged.length, purged });
});
