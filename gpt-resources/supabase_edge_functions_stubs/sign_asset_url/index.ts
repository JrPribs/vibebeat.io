// Deno Edge Function for Supabase
// Uses std/http and supabase-js via ESM.
// Ensure env: SUPABASE_URL, SUPABASE_ANON_KEY, (and SERVICE_ROLE for sign_url) are set.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // required for createSignedUrl

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

  // Use user client to verify ownership via RLS
  const supaUser = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await supaUser.auth.getUser();
  if (!userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
  const uid = userData.user.id;

  const payload = await req.json().catch(() => ({}));
  const path: string | undefined = payload.path;
  if (!path) return jsonResponse({ error: "path is required" }, 400);

  // Verify asset exists and belongs to user (RLS enforces ownership)
  const { data: asset, error: assetErr } = await supaUser
    .from("assets")
    .select("id, path")
    .eq("path", path)
    .single();

  if (assetErr || !asset) return jsonResponse({ error: "Asset not found or not yours" }, 404);

  // Admin client to sign URL
  const supaAdmin = createClient(url, service);
  const { data: signed, error: signErr } = await supaAdmin.storage
    .from("user-assets")
    .createSignedUrl(path, 600); // 10 minutes

  if (signErr || !signed?.signedUrl) {
    return jsonResponse({ error: "Failed to sign URL", details: signErr?.message }, 400);
  }

  return jsonResponse({ url: signed.signedUrl }, 200);
});
