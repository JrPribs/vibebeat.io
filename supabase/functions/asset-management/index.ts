/**
 * Asset Management Edge Function
 * Handles uploading, listing, and managing user assets (recordings, uploads)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AssetUpload {
  kind: 'recording' | 'upload' | 'export';
  filename: string;
  content: string; // Base64 encoded
  mimeType: string;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split('/').filter(p => p);
    
    // GET /assets - List user assets
    if (method === 'GET' && pathParts.length === 0) {
      const kind = url.searchParams.get('kind');
      
      let query = supabase
        .from('assets')
        .select('*')
        .eq('owner', user.id)
        .order('created_at', { ascending: false });
      
      if (kind) {
        query = query.eq('kind', kind);
      }
      
      const { data: assets, error } = await query;

      if (error) {
        throw new Error(`Failed to load assets: ${error.message}`);
      }

      return new Response(JSON.stringify({ assets }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /assets - Upload new asset
    if (method === 'POST' && pathParts.length === 0) {
      const assetData: AssetUpload = await req.json();
      
      // Decode base64 content
      const binaryData = Uint8Array.from(atob(assetData.content), c => c.charCodeAt(0));
      
      // Generate unique filename
      const timestamp = Date.now();
      const extension = assetData.filename.split('.').pop() || 'bin';
      const uniqueFilename = `${user.id}/${assetData.kind}/${timestamp}-${assetData.filename}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(uniqueFilename, binaryData, {
          contentType: assetData.mimeType,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload asset: ${uploadError.message}`);
      }

      // Record asset in database
      const { data: asset, error: dbError } = await supabase
        .from('assets')
        .insert({
          owner: user.id,
          kind: assetData.kind,
          path: uploadData.path,
          size_bytes: binaryData.length,
          mime_type: assetData.mimeType
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('user-assets')
          .remove([uploadData.path]);
        
        throw new Error(`Failed to record asset: ${dbError.message}`);
      }

      // Generate signed URL for immediate access
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('user-assets')
        .createSignedUrl(uploadData.path, 3600); // 1 hour

      if (urlError) {
        console.warn('Failed to create signed URL:', urlError.message);
      }

      return new Response(JSON.stringify({ 
        asset: {
          ...asset,
          signedUrl: signedUrl?.signedUrl
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /assets/:id/url - Get signed URL for asset
    if (method === 'GET' && pathParts.length === 2 && pathParts[1] === 'url') {
      const assetId = pathParts[0];
      
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('path')
        .eq('id', assetId)
        .eq('owner', user.id)
        .single();

      if (assetError) {
        throw new Error(`Asset not found: ${assetError.message}`);
      }

      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('user-assets')
        .createSignedUrl(asset.path, 3600); // 1 hour

      if (urlError) {
        throw new Error(`Failed to create signed URL: ${urlError.message}`);
      }

      return new Response(JSON.stringify({ signedUrl: signedUrl.signedUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /assets/:id - Delete asset
    if (method === 'DELETE' && pathParts.length === 1) {
      const assetId = pathParts[0];
      
      // Get asset info first
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('path')
        .eq('id', assetId)
        .eq('owner', user.id)
        .single();

      if (assetError) {
        throw new Error(`Asset not found: ${assetError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-assets')
        .remove([asset.path]);

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError.message);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)
        .eq('owner', user.id);

      if (dbError) {
        throw new Error(`Failed to delete asset record: ${dbError.message}`);
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
    console.error('Asset management error:', error);
    
    const errorResponse = {
      error: {
        code: 'ASSET_MANAGEMENT_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});