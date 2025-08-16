/**
 * Share Link Management Edge Function
 * Handles creating and retrieving public share links for projects
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Generate a unique, URL-safe slug
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split('/').filter(p => p);
    
    // GET /:slug - Get shared project (public access)
    if (method === 'GET' && pathParts.length === 1) {
      const slug = pathParts[0];
      
      // Get share record with project data
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select(`
          id,
          created_at,
          expires_at,
          project:projects!inner (
            id,
            title,
            json,
            created_at,
            owner
          )
        `)
        .eq('slug', slug)
        .gt('expires_at', 'now()')
        .single();

      if (shareError || !share) {
        return new Response(JSON.stringify({ 
          error: 'Share link not found or expired' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get associated assets for the project
      const { data: assets } = await supabase
        .from('assets')
        .select('id, kind, path, mime_type')
        .eq('owner', share.project.owner);

      // Generate signed URLs for assets
      const assetsWithUrls = await Promise.all(
        (assets || []).map(async (asset) => {
          const { data: signedUrl } = await supabase.storage
            .from('user-assets')
            .createSignedUrl(asset.path, 3600); // 1 hour
          
          return {
            ...asset,
            signedUrl: signedUrl?.signedUrl
          };
        })
      );

      return new Response(JSON.stringify({ 
        share: {
          id: share.id,
          created_at: share.created_at,
          expires_at: share.expires_at,
          project: {
            id: share.project.id,
            title: share.project.title,
            json: share.project.json,
            created_at: share.project.created_at
          },
          assets: assetsWithUrls
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Authenticated endpoints require authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // POST /create - Create new share link
    if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'create') {
      const { projectId, expiresInDays = 30 } = await req.json();
      
      // Verify user owns the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('owner', user.id)
        .single();

      if (projectError || !project) {
        throw new Error('Project not found or access denied');
      }

      // Generate unique slug with retry logic
      let slug: string;
      let attempts = 0;
      const maxAttempts = 5;
      
      do {
        slug = generateSlug();
        attempts++;
        
        const { data: existing } = await supabase
          .from('shares')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!existing) break;
        
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique slug');
        }
      } while (true);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Create share record
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .insert({
          project: projectId,
          slug: slug,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (shareError) {
        throw new Error(`Failed to create share: ${shareError.message}`);
      }

      return new Response(JSON.stringify({ 
        share: {
          id: share.id,
          slug: share.slug,
          url: `${url.origin}/share/${share.slug}`,
          expires_at: share.expires_at
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /list - List user's share links
    if (method === 'GET' && pathParts.length === 1 && pathParts[0] === 'list') {
      const { data: shares, error } = await supabase
        .from('shares')
        .select(`
          id,
          slug,
          created_at,
          expires_at,
          project:projects!inner (
            id,
            title
          )
        `)
        .eq('projects.owner', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to load shares: ${error.message}`);
      }

      const sharesWithUrls = shares.map(share => ({
        ...share,
        url: `${url.origin}/share/${share.slug}`
      }));

      return new Response(JSON.stringify({ shares: sharesWithUrls }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /:shareId - Delete share link
    if (method === 'DELETE' && pathParts.length === 1) {
      const shareId = pathParts[0];
      
      // Verify user owns the project associated with this share
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId)
        .eq('projects.owner', user.id);

      if (error) {
        throw new Error(`Failed to delete share: ${error.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Invalid endpoint
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Share management error:', error);
    
    const errorResponse = {
      error: {
        code: 'SHARE_MANAGEMENT_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});