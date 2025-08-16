/**
 * Project Management Edge Function
 * Handles saving, loading, and listing user projects
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ProjectData {
  title: string;
  json: any;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
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
    
    // GET /projects - List user projects
    if (method === 'GET' && pathParts.length === 0) {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, created_at, updated_at')
        .eq('owner', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to load projects: ${error.message}`);
      }

      return new Response(JSON.stringify({ projects }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /projects/:id - Load specific project
    if (method === 'GET' && pathParts.length === 1) {
      const projectId = pathParts[0];
      
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('owner', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to load project: ${error.message}`);
      }

      return new Response(JSON.stringify({ project }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /projects - Create new project
    if (method === 'POST' && pathParts.length === 0) {
      const projectData: ProjectData = await req.json();
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          owner: user.id,
          title: projectData.title,
          json: projectData.json
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      return new Response(JSON.stringify({ project }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT /projects/:id - Update existing project
    if (method === 'PUT' && pathParts.length === 1) {
      const projectId = pathParts[0];
      const projectData: ProjectData = await req.json();
      
      const { data: project, error } = await supabase
        .from('projects')
        .update({
          title: projectData.title,
          json: projectData.json
        })
        .eq('id', projectId)
        .eq('owner', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update project: ${error.message}`);
      }

      return new Response(JSON.stringify({ project }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /projects/:id - Delete project
    if (method === 'DELETE' && pathParts.length === 1) {
      const projectId = pathParts[0];
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('owner', user.id);

      if (error) {
        throw new Error(`Failed to delete project: ${error.message}`);
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
    console.error('Project management error:', error);
    
    const errorResponse = {
      error: {
        code: 'PROJECT_MANAGEMENT_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});