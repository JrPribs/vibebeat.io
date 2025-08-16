// Project Models
// Core project schema and validation using Zod

import { z } from 'zod';
import type { PadName } from './audio.js';

// Core Project Schema from PRD - Enhanced
export const ProjectSchema = z.object({
  version: z.literal('1.1.0'),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(100),
  tempoBpm: z.number().min(60).max(200),
  timeSig: z.literal('4/4'), // For MVP, only 4/4 supported
  bars: z.number().min(2).max(8),
  swingPercent: z.number().min(0).max(60),
  tracks: z.array(z.union([
    // DRUM Track Schema
    z.object({
      id: z.string().uuid(),
      type: z.literal('DRUM'),
      name: z.string().min(1).max(50),
      kitId: z.string(),
      pattern: z.object({
        grid: z.literal('1/16'),
        steps: z.number().int().min(32).max(128), // 2-8 bars * 16 steps
        pads: z.array(z.object({
          pad: z.enum(['KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN', 'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH', 'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02', 'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16']),
          hits: z.array(z.object({
            step: z.number().int().min(0),
            vel: z.number().int().min(1).max(127),
          }))
        }))
      }),
      mixer: z.object({
        vol: z.number().min(0).max(1),
        pan: z.number().min(-1).max(1),
        sendA: z.number().min(0).max(1),
        sendB: z.number().min(0).max(1),
        mute: z.boolean().default(false),
        solo: z.boolean().default(false),
      })
    }),
    // KEYS Track Schema  
    z.object({
      id: z.string().uuid(),
      type: z.literal('KEYS'),
      name: z.string().min(1).max(50),
      key: z.enum(['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']),
      scale: z.enum(['major', 'natural_minor', 'dorian', 'mixolydian', 'pentatonic']),
      notes: z.array(z.object({
        step: z.number().int().min(0),
        pitch: z.string().regex(/^[A-G][#b]?[0-8]$/), // Note name with octave
        durSteps: z.number().int().min(1),
        vel: z.number().int().min(1).max(127),
        tie: z.boolean().optional(),
      })),
      mixer: z.object({
        vol: z.number().min(0).max(1),
        pan: z.number().min(-1).max(1),
        sendA: z.number().min(0).max(1),
        sendB: z.number().min(0).max(1),
        mute: z.boolean().default(false),
        solo: z.boolean().default(false),
      })
    }),
    // AUDIO Track Schema
    z.object({
      id: z.string().uuid(),
      type: z.literal('AUDIO'),
      name: z.string().min(1).max(50),
      clip: z.object({
        src: z.string().url().or(z.string().startsWith('blob:')),
        origin: z.enum(['mic', 'upload', 'factory']),
        originalSampleRate: z.number().int().min(8000).max(192000),
        startSec: z.number().min(0),
        endSec: z.number().min(0),
        barSync: z.boolean(),
        detectedBpm: z.number().min(60).max(200).optional(),
        detectedKey: z.string().optional(),
        slices: z.array(z.object({ ms: z.number().min(0) })).optional(),
      }).refine(data => data.endSec > data.startSec, {
        message: "endSec must be greater than startSec"
      }),
      mixer: z.object({
        vol: z.number().min(0).max(1),
        pan: z.number().min(-1).max(1),
        sendA: z.number().min(0).max(1),
        sendB: z.number().min(0).max(1),
        mute: z.boolean().default(false),
        solo: z.boolean().default(false),
      })
    })
  ])).min(1).max(16), // Support up to 16 tracks
  arrangement: z.array(z.enum(['A', 'B'])).min(1).max(32), // Pattern sequence
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  ownerUid: z.string().nullable(),
}).refine(data => data.updatedAt >= data.createdAt, {
  message: "updatedAt must be >= createdAt"
}).refine(data => {
  // Validate steps match bars for all drum tracks
  const drumTracks = data.tracks.filter(t => t.type === 'DRUM');
  return drumTracks.every(track => track.pattern.steps === data.bars * 16);
}, {
  message: "Drum track steps must match project bars * 16"
});

// Inferred Types
export type Project = z.infer<typeof ProjectSchema>;
export type Track = Project['tracks'][0];
export type DrumTrack = Extract<Track, { type: 'DRUM' }>;
export type KeysTrack = Extract<Track, { type: 'KEYS' }>;
export type AudioTrack = Extract<Track, { type: 'AUDIO' }>;