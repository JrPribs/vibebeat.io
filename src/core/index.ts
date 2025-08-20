// Core Module Exports
// Central exports for all core functionality

// State Management
export {
  StoreProvider,
  useStore,
  useProject,
  useTransport,
  useSelection,
  useUI,
  useAudio
} from './store-context';

export {
  appStateReducer,
  createInitialState
} from './store-reducer';

export {
  useUndoRedo
} from './use-undo-redo';

// Audio Engine
export {
  audioService
} from './audio-service';

export {
  useAudioService
} from './use-audio-service';

// Sample Management
export {
  sampleCache
} from './sample-cache';

export {
  useSampleCache
} from './use-sample-cache';

// Tone.js Transport (Professional Timing)
export {
  toneTransportService
} from './tone-transport-service';

export {
  useToneTransport
} from './use-tone-transport';

// Pad Triggering & Playback
export {
  padTriggerService
} from './pad-trigger-service';

export {
  usePadTrigger
} from './use-pad-trigger';

// Piano Synthesis & Playback
export {
  tonePianoService
} from './tone-piano-service';

// Mixer & Audio Processing
export {
  toneMixerService
} from './tone-mixer-service';

export {
  toneDrumService
} from './tone-drum-service';

export {
  musicRadarKitLoader
} from './musicradar-kit-loader';

// Music Theory
export {
  musicTheoryService,
  SCALE_TYPES,
  CHORD_TYPES
} from './music-theory-service';

export type {
  ScaleTypeName,
  ChordTypeName,
  ScaleInfo,
  ChordInfo
} from './music-theory-service';


// Factory Content
export {
  factoryContentService,
  FactoryContentService
} from './content/FactoryContentService';

export type {
  DrumKit,
  Instrument,
  ContentLoadingStatus,
  FactoryContent
} from './content/types';

// Recording
export {
  recordingService
} from './recording-service';

// Sample Editor
export {
  sampleEditorService
} from './sample-editor-service';

// Export Services
export {
  exportService
} from './export/ExportService';

export {
  storageService
} from './storage/StorageService';

export {
  shareService
} from './share/ShareService';

// AI Services
export {
  aiService,
  AIService
} from './ai/AIService';

export {
  OpenAIProvider
} from './ai/OpenAIProvider';

export {
  MockAIProvider
} from './ai/MockAIProvider';

export type {
  AIProvider,
  DrumPatternInput,
  DrumPatternOutput,
  MelodyInput,
  MelodyOutput,
  DrumHit,
  MelodyNote,
  RepairService,
  ValidationResult,
  AILogEntry
} from './ai/types';