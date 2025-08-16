// Deno Edge Function for Supabase
// Uses std/http and supabase-js via ESM.
// Ensure env: SUPABASE_URL, SUPABASE_ANON_KEY, (and SERVICE_ROLE for sign_url) are set.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Use POST" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return jsonResponse({ error: "Missing Authorization header" }, 401);

  const supaUser = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userErr } = await supaUser.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
  const uid = userData.user.id;

  const payload = await req.json().catch(() => ({}));
  const tool: string | undefined = payload.tool;
  const meta = payload.meta ?? {};
  if (!tool) return jsonResponse({ error: "tool is required" }, 400);

  // Rate limit: 5/min per user per tool
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countErr } = await supaUser
    .from("ai_logs")
    .select("id", { count: "exact", head: true })
    .eq("owner", uid)
    .eq("tool", tool)
    .gte("created_at", since);

  if (countErr) return jsonResponse({ error: "Rate check failed" }, 400);
  if ((count ?? 0) >= 5) {
    return jsonResponse({ error: "Too many requests", retry_after_seconds: 15 }, 429);
  }

  // Log the attempt (owner RLS enforced)
  const { error: insErr } = await supaUser.from("ai_logs").insert({
    owner: uid,
    tool,
    meta
  });

  if (insErr) return jsonResponse({ error: "Failed to log", details: insErr.message }, 400);

  return jsonResponse({ ok: true }, 200);
});
