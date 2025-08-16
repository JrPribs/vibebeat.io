// Shared Data Models
// Type definitions for the entire application
// Re-exports from individual model files for better organization

// Audio Engine Models
export type {
  AudioContextState,
  TransportState,
  MixerChannelState,
  Sample,
  AudioEvent,
  ScheduledEvent,
  AudioAnalysis,
  AudioError,
  PAD_NAMES
} from './audio.js';
export type { PadName } from './audio.js';

// Project Models
export type {
  ProjectSchema
} from './project.js';
export type {
  Project,
  Track,
  DrumTrack,
  KeysTrack,
  AudioTrack
} from './project.js';

// UI Models
export type {
  SelectionState,
  UIState,
  ViewMode,
  LatencyMode,
  EditMode,
  PerformanceMetrics
} from './ui.js';

// State Management Models
export type {
  AppState,
  AppAction
} from './state.js';

// Export Models
export type {
  ExportOptions
} from './export.js';

// Factory Content Models
export type {
  FactoryKit,
  FactoryContent
} from './factory.js';

// AI Tool Models
export type {
  DrumPatternInputSchema,
  DrumPatternOutputSchema,
  MelodyInputSchema,
  MelodyOutputSchema,
  AIGenerationRequestSchema,
  AIGenerationResponseSchema,
  validateDrumPatternInput,
  validateDrumPatternOutput,
  validateMelodyInput,
  validateMelodyOutput,
  validateAIGenerationRequest,
  validateAIGenerationResponse
} from './ai.js';
export type {
  DrumPatternInput,
  DrumPatternOutput,
  MelodyInput,
  MelodyOutput,
  AIGenerationRequest,
  AIGenerationResponse
} from './ai.js';