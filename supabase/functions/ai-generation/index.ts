/**
 * AI Generation Edge Function
 * Handles secure AI generation using OpenAI API with vault access
 */

Deno.serve(async (req) => {
    // Get the origin from the request
    const origin = req.headers.get('origin') || '';
    
    // Define allowed origins
    const allowedOrigins = [
        'https://qkjrwb29cgkh.space.minimax.io',
        'http://localhost:3000',
        'http://localhost:5173',
        'https://localhost:3000',
        'https://localhost:5173'
    ];
    
    // Determine if origin is allowed
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://qkjrwb29cgkh.space.minimax.io',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin'
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return new Response('OK', { 
            status: 200, 
            headers: {
                ...corsHeaders,
                'Content-Length': '2'
            }
        });
    }

    try {
        const { type, input, action } = await req.json();

        // Handle API key request
        if (action === 'get_api_key') {
            const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
            if (!openaiApiKey) {
                throw new Error('OpenAI API key not found in vault');
            }
            
            return new Response(JSON.stringify({
                apiKey: openaiApiKey
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!type || !input) {
            throw new Error('Missing type or input parameters');
        }

        if (!['drum_pattern', 'melody'].includes(type)) {
            throw new Error('Invalid generation type. Must be drum_pattern or melody');
        }

        // Get OpenAI API key from Supabase vault
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not found in vault');
        }

        // Validate and prepare the OpenAI request
        let prompt: string;
        if (type === 'drum_pattern') {
            prompt = generateDrumPrompt(input);
        } else {
            prompt = generateMelodyPrompt(input);
        }

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: type === 'drum_pattern' 
                            ? 'You are a professional music producer AI that generates drum patterns in JSON format. Return ONLY valid JSON, no explanations or markdown.'
                            : 'You are a professional music composer AI that generates melodies in JSON format. Return ONLY valid JSON, no explanations or markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
        }

        const openaiData = await openaiResponse.json();
        const content = openaiData.choices[0]?.message?.content;
        
        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        // Parse and validate the response
        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            // Try to clean up the response and parse again
            const cleaned = cleanOpenAIResponse(content);
            try {
                result = JSON.parse(cleaned);
            } catch (retryError) {
                throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
            }
        }

        // Validate the structure and repair if needed
        if (type === 'drum_pattern') {
            result = validateAndRepairDrumPattern(result, input);
        } else {
            result = validateAndRepairMelody(result, input);
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI generation error:', error);

        const errorResponse = {
            error: {
                code: 'AI_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
function generateDrumPrompt(input: any): string {
    return `Generate a ${input.style} drum pattern with the following specifications:

- Tempo: ${input.tempo} BPM
- Bars: ${input.bars}
- Density: ${input.density}
- Swing: ${input.swing}%
- Grid: 16 steps per bar (1/16 notes)

Return a JSON object with this structure:
{
  "steps": number (total steps = bars * 16),
  "pads": [
    {
      "pad": "KICK" | "SNARE" | "HIHAT_CLOSED" | "HIHAT_OPEN" | "CLAP" | "CRASH",
      "hits": [
        {
          "step": number (0 to steps-1),
          "vel": number (1-127)
        }
      ]
    }
  ]
}

Make it musically appropriate for the ${input.style} style with ${input.density} density.`;
}

function generateMelodyPrompt(input: any): string {
    return `Generate a melody in ${input.key} ${input.scale} with these specifications:

- Tempo: ${input.tempo} BPM
- Bars: ${input.bars}
- Key: ${input.key}
- Scale: ${input.scale}
- Contour: ${input.contour}
- Density: ${input.density}
- Octave range: ${input.octaveRange[0]} to ${input.octaveRange[1]}

Return a JSON object with this structure:
{
  "steps": number (total steps = bars * 16),
  "notes": [
    {
      "step": number (0 to steps-1),
      "pitch": string (note name like "C4", "F#3", "Bb5"),
      "durSteps": number (note duration in steps),
      "vel": number (1-127)
    }
  ]
}

Create a musically coherent melody with ${input.contour} contour and ${input.density} note density.`;
}

function cleanOpenAIResponse(content: string): string {
    // Remove common AI response formatting
    let cleaned = content
        .replace(/```json\s*/, '') // Remove ```json
        .replace(/```\s*$/, '')    // Remove trailing ```
        .replace(/^[^{]*({)/, '$1') // Remove text before first {
        .replace(/(})[^}]*$/, '$1') // Remove text after last }
        .trim();
    
    // Fix common JSON issues
    cleaned = cleaned
        .replace(/,\s*}/g, '}')     // Remove trailing commas
        .replace(/,\s*]/g, ']')     // Remove trailing commas in arrays
        .replace(/'/g, '"')        // Replace single quotes with double quotes
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":'); // Quote unquoted keys
    
    return cleaned;
}

function validateAndRepairDrumPattern(data: any, input: any): any {
    const repairs = [];
    
    // Ensure basic structure
    if (!data.steps || typeof data.steps !== 'number') {
        data.steps = input.bars * 16;
        repairs.push('fixed steps');
    }
    
    if (!Array.isArray(data.pads)) {
        data.pads = [];
        repairs.push('fixed pads array');
    }
    
    // Validate pads
    const validPads = ['KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN', 'CLAP', 'CRASH'];
    data.pads = data.pads.map((pad: any) => {
        if (!validPads.includes(pad.pad)) {
            pad.pad = 'KICK';
            repairs.push('fixed invalid pad name');
        }
        
        if (!Array.isArray(pad.hits)) {
            pad.hits = [];
            repairs.push('fixed hits array');
        }
        
        // Validate hits
        pad.hits = pad.hits.map((hit: any) => {
            if (typeof hit.step !== 'number' || hit.step < 0 || hit.step >= data.steps) {
                hit.step = Math.max(0, Math.min(data.steps - 1, Math.round(hit.step || 0)));
                repairs.push('fixed hit step');
            }
            
            if (typeof hit.vel !== 'number' || hit.vel < 1 || hit.vel > 127) {
                hit.vel = Math.max(1, Math.min(127, Math.round(hit.vel || 100)));
                repairs.push('fixed hit velocity');
            }
            
            return hit;
        });
        
        return pad;
    });
    
    if (repairs.length > 0) {
        console.warn('AI drum pattern auto-repaired:', repairs.join(', '));
    }
    
    return data;
}

function validateAndRepairMelody(data: any, input: any): any {
    const repairs = [];
    
    // Ensure basic structure
    if (!data.steps || typeof data.steps !== 'number') {
        data.steps = input.bars * 16;
        repairs.push('fixed steps');
    }
    
    if (!Array.isArray(data.notes)) {
        data.notes = [];
        repairs.push('fixed notes array');
    }
    
    // Validate notes
    data.notes = data.notes.map((note: any) => {
        if (typeof note.step !== 'number' || note.step < 0 || note.step >= data.steps) {
            note.step = Math.max(0, Math.min(data.steps - 1, Math.round(note.step || 0)));
            repairs.push('fixed note step');
        }
        
        if (!note.pitch || typeof note.pitch !== 'string' ||
            !/^[A-G][b#]?[0-9]$/.test(note.pitch)) {
            note.pitch = 'C4'; // Default fallback
            repairs.push('fixed note pitch');
        }
        
        if (typeof note.durSteps !== 'number' || note.durSteps < 1) {
            note.durSteps = 4; // Default quarter note
            repairs.push('fixed note duration');
        }
        
        if (typeof note.vel !== 'number' || note.vel < 1 || note.vel > 127) {
            note.vel = Math.max(1, Math.min(127, Math.round(note.vel || 100)));
            repairs.push('fixed note velocity');
        }
        
        return note;
    });
    
    if (repairs.length > 0) {
        console.warn('AI melody auto-repaired:', repairs.join(', '));
    }
    
    return data;
}