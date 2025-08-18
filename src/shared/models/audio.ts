// Audio Engine Models
// Types related to audio processing, context, and scheduling

import { z } from 'zod';

// Audio Engine State
export interface AudioContextState {
  isInitialized: boolean;
  outputLatency: number;
  sampleRate: number;
  isRunning: boolean;
  latencyMode: 'low' | 'stable';
}

// Transport State
export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  currentBar: number;
  currentBeat: number;
  currentStep: number;
  timeSignature: [number, number];
  swingPercent: number;
  metronomeEnabled: boolean;
  countInBars: number;
}

// Mixer Channel State
export interface MixerChannelState {
  vol: number; // 0-1
  pan: number; // -1 to 1
  sendA: number; // 0-1 reverb send
  sendB: number; // 0-1 delay send
  mute: boolean;
  solo: boolean;
  inputGain: number; // For recording
}

// Sample Definition
export interface Sample {
  id: string;
  name: string;
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
  kit?: string;
  pad?: PadName;
}

// Event Types for Audio Engine
export interface AudioEvent {
  type: 'noteOn' | 'noteOff' | 'triggerPad' | 'stopAll';
  time: number; // Audio context time
  data: any;
}

// Scheduling Event
export interface ScheduledEvent {
  id: string;
  type: 'pad' | 'note' | 'metronome';
  time: number;
  data: {
    padName?: PadName;
    velocity?: number;
    pitch?: string;
    duration?: number;
  };
}

// Pad Types
export type PadName = 'KICK' | 'SNARE' | 'HIHAT_CLOSED' | 'HIHAT_OPEN' | 'CLAP' | 'CRASH' | 'RIDE' | 'TOM_HIGH' | 'TOM_MID' | 'TOM_FLOOR' | 'PERC_01' | 'PERC_02' | 'PAD_13' | 'PAD_14' | 'PAD_15' | 'PAD_16';

export const PAD_NAMES: PadName[] = [
  'KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN',
  'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH', 
  'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02',
  'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16'
];

// Audio Analysis
export interface AudioAnalysis {
  rms: number;
  peak: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  tempo?: number;
  key?: string;
}

// Error Types
export interface AudioError {
  code: 'CONTEXT_FAILED' | 'SAMPLE_LOAD_FAILED' | 'WORKLET_FAILED' | 'PERMISSION_DENIED';
  message: string;
  details?: any;
}