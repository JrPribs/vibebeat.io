// Audio Upload Edge Function
// Handles secure upload of recorded audio files to Supabase Storage

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
        const { audioData, fileName, metadata = {} } = await req.json();

        if (!audioData || !fileName) {
            throw new Error('Audio data and filename are required');
        }

        // Get the service role key
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header - user must be authenticated');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token - user authentication failed');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Extract binary data from base64 or blob
        let binaryData: Uint8Array;
        let mimeType = 'audio/wav'; // default

        if (audioData.startsWith('data:')) {
            // Handle data URL
            const base64Data = audioData.split(',')[1];
            mimeType = audioData.split(';')[0].split(':')[1];
            binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
            // Handle raw base64
            binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
        }

        // Create unique filename with user ID prefix
        const timestamp = Date.now();
        const uniqueFileName = `${userId}/${timestamp}-${fileName}`;

        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/user-assets/${uniqueFileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': mimeType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/user-assets/${uniqueFileName}`;

        // Create signed URL for secure access (expires in 1 year)
        const signUrlResponse = await fetch(`${supabaseUrl}/storage/v1/object/sign/user-assets/${uniqueFileName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expiresIn: 31536000 }) // 1 year
        });

        let signedUrl = publicUrl;
        if (signUrlResponse.ok) {
            const signData = await signUrlResponse.json();
            signedUrl = `${supabaseUrl}/storage/v1${signData.signedURL}`;
        }

        // Save audio metadata to recordings table
        const recordingData = {
            user_id: userId,
            filename: fileName,
            storage_path: uniqueFileName,
            public_url: publicUrl,
            signed_url: signedUrl,
            file_size: binaryData.length,
            mime_type: mimeType,
            duration_sec: metadata.duration || null,
            sample_rate: metadata.sampleRate || null,
            bpm: metadata.bpm || null,
            detected_key: metadata.key || null,
            bar_count: metadata.barCount || null,
            recording_type: metadata.recordingType || 'microphone',
            created_at: new Date().toISOString()
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/recordings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(recordingData)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('Database insert failed, but file uploaded successfully:', errorText);
            // Don't fail the entire operation, just log the error
        }

        const recordingRecord = insertResponse.ok ? await insertResponse.json() : null;

        return new Response(JSON.stringify({
            data: {
                publicUrl,
                signedUrl,
                storagePath: uniqueFileName,
                fileSize: binaryData.length,
                mimeType,
                recording: recordingRecord?.[0] || null
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Audio upload error:', error);

        const errorResponse = {
            error: {
                code: 'AUDIO_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});