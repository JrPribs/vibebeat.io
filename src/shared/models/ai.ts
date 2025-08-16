// AI Tool Schemas
// Zod validation schemas for AI-generated content

import { z } from 'zod';
import type { PadName } from './audio.js';

// Drum Pattern AI Input Schema
export const DrumPatternInputSchema = z.object({
  style: z.enum([
    'trap', 'house', 'techno', 'hip-hop', 'funk', 'rock', 'latin', 'afrobeat',
    'breakbeat', 'dnb', 'dubstep', 'garage', 'ambient', 'industrial'
  ]),
  energy: z.enum(['low', 'medium', 'high', 'intense']),
  complexity: z.enum(['simple', 'moderate', 'complex', 'polyrhythmic']),
  bpm: z.number().min(60).max(200),
  timeSignature: z.literal('4/4'), // MVP limitation
  bars: z.number().min(1).max(8),
  emphasis: z.object({
    kick: z.enum(['four-on-floor', 'offbeat', 'syncopated', 'minimal']),
    snare: z.enum(['backbeat', 'offbeat', 'ghost-notes', 'minimal']),
    hihat: z.enum(['steady-8th', 'steady-16th', 'syncopated', 'minimal']),
  }).optional(),
  swing: z.number().min(0).max(60).optional(),
  fills: z.boolean().default(false),
  humanize: z.object({
    timing: z.number().min(0).max(100).default(20), // % timing variation
    velocity: z.number().min(0).max(100).default(15), // % velocity variation
  }).optional(),
});

// Drum Pattern AI Output Schema
export const DrumPatternOutputSchema = z.object({
  metadata: z.object({
    style: z.string(),
    energy: z.string(),
    complexity: z.string(),
    confidence: z.number().min(0).max(1),
    generatedAt: z.number().int().positive(),
  }),
  pattern: z.object({
    grid: z.literal('1/16'),
    steps: z.number().int().min(16).max(128),
    pads: z.array(z.object({
      pad: z.enum(['KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN', 'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH', 'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02', 'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16']),
      hits: z.array(z.object({
        step: z.number().int().min(0),
        vel: z.number().int().min(1).max(127),
        probability: z.number().min(0).max(1).optional(), // For generative variations
      }))
    }))
  }),
  variations: z.array(z.object({
    name: z.string(),
    description: z.string(),
    pattern: z.object({
      grid: z.literal('1/16'),
      steps: z.number().int().min(16).max(128),
      pads: z.array(z.object({
        pad: z.enum(['KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN', 'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH', 'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02', 'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16']),
        hits: z.array(z.object({
          step: z.number().int().min(0),
          vel: z.number().int().min(1).max(127),
          probability: z.number().min(0).max(1).optional(),
        }))
      }))
    })
  })).max(4).optional(), // Up to 4 variations
});

// Melody AI Input Schema
export const MelodyInputSchema = z.object({
  key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']),
  scale: z.enum(['major', 'natural_minor', 'dorian', 'mixolydian', 'pentatonic']),
  style: z.enum([
    'classical', 'jazz', 'blues', 'pop', 'rock', 'funk', 'latin', 'ambient',
    'minimal', 'cinematic', 'electronic', 'world', 'experimental'
  ]),
  mood: z.enum(['happy', 'sad', 'energetic', 'calm', 'mysterious', 'romantic', 'aggressive', 'peaceful']),
  complexity: z.enum(['simple', 'moderate', 'complex', 'virtuosic']),
  length: z.object({
    bars: z.number().min(1).max(8),
    noteResolution: z.enum(['1/4', '1/8', '1/16']).default('1/8'),
  }),
  range: z.object({
    lowest: z.string().regex(/^[A-G][#b]?[0-8]$/),
    highest: z.string().regex(/^[A-G][#b]?[0-8]$/),
  }),
  rhythm: z.object({
    syncopation: z.enum(['none', 'light', 'moderate', 'heavy']),
    rests: z.enum(['minimal', 'moderate', 'frequent']),
  }).optional(),
  motifs: z.object({
    repetition: z.boolean().default(true),
    variation: z.boolean().default(true),
    sequence: z.boolean().default(false),
  }).optional(),
});

// Melody AI Output Schema
export const MelodyOutputSchema = z.object({
  metadata: z.object({
    key: z.string(),
    scale: z.string(),
    style: z.string(),
    mood: z.string(),
    confidence: z.number().min(0).max(1),
    generatedAt: z.number().int().positive(),
    analysis: z.object({
      intervalPattern: z.array(z.number()),
      rhythmicDensity: z.number().min(0).max(1),
      melodicRange: z.number().min(0),
      avgNoteLength: z.number().min(0),
    }),
  }),
  melody: z.object({
    notes: z.array(z.object({
      step: z.number().int().min(0),
      pitch: z.string().regex(/^[A-G][#b]?[0-8]$/),
      durSteps: z.number().int().min(1),
      vel: z.number().int().min(1).max(127),
      tie: z.boolean().optional(),
      articulation: z.enum(['legato', 'staccato', 'accent', 'normal']).default('normal'),
    })),
    chordSuggestions: z.array(z.object({
      step: z.number().int().min(0),
      chord: z.string(), // Chord symbol like "Cmaj7", "Am", etc.
      notes: z.array(z.string().regex(/^[A-G][#b]?[0-8]$/)),
    })).optional(),
  }),
  variations: z.array(z.object({
    name: z.string(),
    description: z.string(),
    melody: z.object({
      notes: z.array(z.object({
        step: z.number().int().min(0),
        pitch: z.string().regex(/^[A-G][#b]?[0-8]$/),
        durSteps: z.number().int().min(1),
        vel: z.number().int().min(1).max(127),
        tie: z.boolean().optional(),
        articulation: z.enum(['legato', 'staccato', 'accent', 'normal']).default('normal'),
      })),
    })
  })).max(3).optional(), // Up to 3 melodic variations
});

// Combined AI Generation Request Schema
export const AIGenerationRequestSchema = z.object({
  type: z.enum(['drum-pattern', 'melody', 'bassline', 'chord-progression']),
  projectContext: z.object({
    bpm: z.number().min(60).max(200),
    key: z.string().optional(),
    timeSignature: z.literal('4/4'),
    existingTracks: z.array(z.string()).optional(), // Track IDs for context
  }),
  constraints: z.object({
    maxBars: z.number().min(1).max(8),
    mustHaveDownbeat: z.boolean().default(true),
    avoidClashing: z.boolean().default(true),
  }).optional(),
  seed: z.string().optional(), // For reproducible generation
});

// AI Generation Response Schema
export const AIGenerationResponseSchema = z.object({
  success: z.boolean(),
  requestId: z.string().uuid(),
  generatedAt: z.number().int().positive(),
  processingTimeMs: z.number().min(0),
  data: z.union([
    DrumPatternOutputSchema,
    MelodyOutputSchema,
    // Future: BasslineOutputSchema, ChordProgressionOutputSchema
  ]).optional(),
  error: z.object({
    code: z.enum(['INVALID_INPUT', 'GENERATION_FAILED', 'TIMEOUT', 'RATE_LIMITED']),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  usage: z.object({
    tokensUsed: z.number().int().min(0),
    creditsConsumed: z.number().min(0),
  }).optional(),
}).refine(data => data.success ? !!data.data : !!data.error, {
  message: "Success responses must have data, error responses must have error"
});

// Inferred Types
export type DrumPatternInput = z.infer<typeof DrumPatternInputSchema>;
export type DrumPatternOutput = z.infer<typeof DrumPatternOutputSchema>;
export type MelodyInput = z.infer<typeof MelodyInputSchema>;
export type MelodyOutput = z.infer<typeof MelodyOutputSchema>;
export type AIGenerationRequest = z.infer<typeof AIGenerationRequestSchema>;
export type AIGenerationResponse = z.infer<typeof AIGenerationResponseSchema>;

// Validation Helper Functions
export const validateDrumPatternInput = (input: unknown): DrumPatternInput => {
  return DrumPatternInputSchema.parse(input);
};

export const validateDrumPatternOutput = (output: unknown): DrumPatternOutput => {
  return DrumPatternOutputSchema.parse(output);
};

export const validateMelodyInput = (input: unknown): MelodyInput => {
  return MelodyInputSchema.parse(input);
};

export const validateMelodyOutput = (output: unknown): MelodyOutput => {
  return MelodyOutputSchema.parse(output);
};

export const validateAIGenerationRequest = (request: unknown): AIGenerationRequest => {
  return AIGenerationRequestSchema.parse(request);
};

export const validateAIGenerationResponse = (response: unknown): AIGenerationResponse => {
  return AIGenerationResponseSchema.parse(response);
};