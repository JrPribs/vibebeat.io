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

// Scheduler & Timing (Legacy AudioWorklet)
export {
  schedulerService
} from './scheduler-service';

export {
  useScheduler
} from './use-scheduler';

// Tone.js Transport (Modern Replacement)
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
  mixerService
} from './mixer-service';

export {
  toneMixerService
} from './tone-mixer-service';

export {
  toneDrumService
} from './tone-drum-service';

export {
  musicRadarKitLoader
} from './musicradar-kit-loader';

export {
  useMixer
} from './use-mixer';

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