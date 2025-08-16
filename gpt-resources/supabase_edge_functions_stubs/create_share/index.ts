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

function randomSlug(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 7; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
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

  const payload = await req.json().catch(() => ({}));
  const projectId: string | undefined = payload.project_id || payload.projectId;
  if (!projectId) return jsonResponse({ error: "project_id is required" }, 400);

  // Check ownership via RLS (select will only succeed if user owns it or it's shared)
  const { data: proj, error: projErr } = await supaUser
    .from("projects")
    .select("id, owner")
    .eq("id", projectId)
    .single();

  if (projErr || !proj) return jsonResponse({ error: "Project not found or not yours" }, 404);

  // Return existing share if present
  const { data: existing, error: existErr } = await supaUser
    .from("shares")
    .select("slug")
    .eq("project", projectId)
    .maybeSingle();

  if (!existErr && existing?.slug) return jsonResponse({ slug: existing.slug }, 200);

  // Generate unique slug (fallback if DB function isn't available)
  let slug = randomSlug();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supaUser.from("shares").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = randomSlug();
  }

  // Insert share row (policy requires project ownership)
  const { data: newShare, error: insErr } = await supaUser
    .from("shares")
    .insert({ project: projectId, slug })
    .select("slug")
    .single();

  if (insErr) return jsonResponse({ error: "Failed to create share", details: insErr.message }, 400);

  return jsonResponse({ slug: newShare.slug }, 201);
});
