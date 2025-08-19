# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

vibebeat.io is a browser-based groovebox (MPC-inspired DAW) built with React + TypeScript + Vite. It combines Web Audio API with AudioWorklet for sample-accurate timing, allowing users to create beats, melodies, and complete tracks directly in the browser with optional AI assistance.

## Development Commands

### Essential Commands
```bash
# Development server
pnpm run dev

# Build for production
pnpm run build

# Type checking only (strict mode disabled in app code)
pnpm run type-check

# Linting (relaxed rules - no unused vars/explicit any warnings)
pnpm run lint

# Production build with optimizations
pnpm run build:prod

# Skip TypeScript compilation (faster builds)
pnpm run build:skip-ts
```

### Notes on Build Process
- All scripts auto-install dependencies with `yes | pnpm install`
- Production builds use `BUILD_MODE=prod` environment variable
- TypeScript strict mode is **disabled** in application code (enabled only for build tools)
- Vite temp files are cleaned before each build

## Core Architecture

### Singleton Service Pattern
The audio engine follows a singleton pattern with these core services:

1. **AudioService** (`src/core/audio-service.ts`) - Web Audio API management, latency modes
2. **ToneTransportService** (`src/core/tone-transport-service.ts`) - **NEW** Professional timing via Tone.js Transport
3. **SchedulerService** (`src/core/scheduler-service.ts`) - **DEPRECATED** Sample-accurate timing via AudioWorklet
4. **PadTriggerService** (`src/core/pad-trigger-service.ts`) - **MIGRATED TO TONE.JS** - Pure Tone.js drum pad system  
5. **ToneDrumService** (`src/core/tone-drum-service.ts`) - **NEW** Professional drum pad synthesis via Tone.js Sampler
5. **SampleCache** (`src/core/sample-cache.ts`) - AudioBuffer management and factory kit loading
6. **MixerService** (`src/core/mixer-service.ts`) - Channel mixing and effects
7. **RecordingService** (`src/core/recording-service.ts`) - Microphone recording with bar-sync
8. **TonePianoService** (`src/core/tone-piano-service.ts`) - **ACTIVE** Professional piano synthesis via Tone.js PolySynth
9. **ToneMixerService** (`src/core/tone-mixer-service.ts`) - **ACTIVE** Professional mixing with Tone.js Channel and effects

### ⚠️ DEPRECATED: AudioWorklet Architecture (Legacy)
- **DEPRECATED**: Previously used `public/audio-worklet-scheduler.js` for sample-accurate timing
- **REPLACED BY**: ToneTransportService provides superior timing via Tone.js Transport
- AudioWorklet runs in separate audio thread for sub-millisecond precision
- Communication via message passing between main thread and worklet
- **NOTE**: Legacy AudioWorklet files remain for compatibility but are deprecated

### State Management
- React Context + useReducer pattern (`src/core/store-context.tsx`)
- Centralized store with undo/redo functionality
- Typed selectors for state slices: project, transport, selection, ui, audio
- Integration hooks: `useAudioService`, `useSampleCache`, `useUndoRedo`

## Features Organization

Features are organized by function in `src/features/` with single-file components:

- **pads/** - 4×4 drum pads with step sequencer and AI beat generation
- **keys/** - Piano keyboard with scale lock and recording  
- **sample/** - Audio file upload, waveform editing, and sample processing
- **record/** - Microphone recording with bar-sync and count-in
- **mixer/** - Track mixing, effects, and output controls
- **arrange/** - A/B patterns and song arrangement
- **export/** - MP3/WAV/Project export with multiple formats

### Feature Integration Pattern
All features follow consistent integration:
```typescript
import { useStore, useAudioService, useToneTransport, tonePianoService, toneDrumService } from '../../core/index.js';
import * as Tone from 'tone'; // Named import pattern for Tone.js (ES modules)

const { actions } = useStore();
const { audioState } = useAudioService();  
const { isPlaying, currentPosition } = useToneTransport();

// For piano features, initialize Tone.js
if (Tone.context.state !== 'running') {
  await Tone.start();
}
await tonePianoService.triggerNote('C4', 100);

// For drum features, use ToneDrumService
await toneDrumService.triggerPad('KICK', 127);
```

## Data Models and Validation

### Project Schema (`src/shared/models/project.ts`)
- Zod-based strict validation for all audio data
- Track types: DRUM, KEYS, AUDIO
- Pattern format: 16th-note grid with velocity data
- Constraints: 2-8 bars, 60-200 BPM, max 16 tracks

### Critical Audio Models (`src/shared/models/audio.ts`)
- **PadName**: 16 predefined drum pad types (KICK, SNARE, HIHAT_CLOSED, etc.)
- **Sample**: AudioBuffer wrapper with metadata
- **ScheduledEvent**: Timing-critical event interface

## Web Audio Implementation Details

### Initialization Sequence
1. User interaction triggers audio system (Web Audio policy requirement)
2. **Tone.js context startup** (`await Tone.start()`) - Must happen first
3. **TonePianoService, ToneMixerService, ToneDrumService, and ToneTransportService initialization** - Professional audio services
4. AudioContext creation with optimal settings (low/stable latency modes) - **DEPRECATED**
5. ~~AudioWorklet processor loading~~ - **DEPRECATED** (replaced by Tone.js Transport)
6. Service interconnection and factory kit preloading

### **CRITICAL: Tone.js Integration (August 2025)**
- **Status**: ✅ FULLY FUNCTIONAL - Piano keyboard and drum pads producing professional audio
- **Version**: Tone.js v15.1.22 with ES module import pattern
- **Import Pattern**: `import * as Tone from 'tone'` (ES modules - named exports)
- **Global Access**: Tone.js exposed as `window.Tone` for debugging
- **Architecture**: **MIGRATED** - Pure Tone.js architecture for all synthesis (piano + drums)

### Timing and Synchronization
- **Resolution**: 16th note steps (4 steps per beat)
- **Precision**: Sample-accurate timing via Tone.js Transport
- **Transport**: Professional BPM, swing, time signature, and loop controls
- **Legacy**: ~~AudioWorklet precision~~ - **DEPRECATED** (replaced by Tone.js Transport)

### Audio Processing Chain
```
TRANSPORT & TIMING (Tone.js):
User Input → ToneTransportService → Tone.Transport → Global Timing

PIANO SYNTHESIS (Tone.js):
User Input → TonePianoService → Tone.PolySynth → ToneMixerService → Audio Output

DRUM SYNTHESIS (Tone.js):
User Input → PadTriggerService → ToneDrumService → Tone.Sampler → ToneMixerService → Audio Output
           ↓
      MusicRadar Kit Loading → Sample Path Mapping → Tone.js Buffer Loading

LEGACY (DEPRECATED):
User Input → Store Actions → Service Updates → AudioWorklet → Audio Output
```

## Supabase Integration

### Backend Services
- **Auth**: Social sign-in for cloud features
- **Database**: Tables for projects, assets, shares, ai_logs
- **Storage**: User-uploaded audio files and project exports  
- **Edge Functions**: AI rate limiting, share link creation, signed URLs

### Data Flow
- Anonymous users: Local saves via IndexedDB
- Authenticated users: Cloud sync + AI features + sharing

## AI Integration

### Tool Schemas (Strict JSON)
- **Beat Generation**: `write_drum_pattern` - Creates drum patterns with style/density controls
- **Melody Generation**: `write_melody` - Creates melodies in specified key/scale
- **Validation**: Auto-repair for invalid JSON, graceful failure after retry

## Development Configuration Notes

### TypeScript Settings
- **App Code**: Strict mode **disabled** for rapid development
- **Build Tools**: Strict mode enabled for reliability
- Uses composite project structure with path aliases (`@/*` → `./src/*`)

### Audio File Handling
- Development: Audio files ignored by git (except factory content)
- Factory content: CC0 samples in `public/assets/kits/` and `public/assets/instruments/`
- Runtime: Special handling for Web Audio API compatibility

### Styling and UI
- **Tailwind CSS**: Custom brand colors and dark mode support
- **Shadcn/ui**: "new-york" variant with Radix UI components
- **Icons**: Lucide React library

## Testing and Quality

### Current Status
- Test framework: Placeholder configuration 
- Linting: Relaxed rules (unused vars and explicit any disabled)
- Type checking: Available but strict mode disabled

### Audio-Specific Considerations
- AudioContext requires user gesture (handle gracefully in tests)
- AudioWorklet loading is async (test initialization sequence)
- Timing-critical code needs precision testing

## Performance Considerations

### Critical Patterns
- Singleton services prevent duplicate instances
- Event listener cleanup with unsubscribe functions
- Sample caching prevents duplicate loading
- AudioWorklet offloads timing to audio thread

### Memory Management
- AudioBuffer cleanup in sample cache
- Voice management in pad trigger service
- Automatic cleanup on component unmount

## Common Development Tasks

### Adding New Audio Features
1. Create feature component in `src/features/[name]/index.tsx`
2. Integrate with core services via hooks
3. Update store actions and state if needed
4. Follow singleton service pattern for audio processing
5. **For synthesis features**: Use Tone.js services (TonePianoService, ToneMixerService)
6. **For drum pad features**: Use ToneDrumService (Tone.js-based sample playback)
7. **For legacy features**: Use custom services (SampleCache - being phased out)

### Modifying Audio Timing
- Always work through SchedulerService
- Use AudioWorklet for sample-accurate operations
- Test with both low and stable latency modes

### Adding New Sample Sources
- Extend SampleCache for loading
- Update PadTriggerService for playback
- Follow factory kit organization pattern

### **Tone.js Development Guidelines**
- **Import Pattern**: Always use `import Tone from 'tone'` (default import)
- **Context Management**: Always check `Tone.context.state` before use
- **Initialization**: Call `await Tone.start()` after user interaction
- **Service Pattern**: Create singleton services extending Tone.js functionality
- **Error Handling**: Wrap Tone.js calls in try/catch blocks
- **Performance**: Use Tone.js built-in disposal methods for cleanup

### **Piano Keyboard Development**
- **Working Implementation**: `/src/features/keys/index.tsx` (REFERENCE)
- **Note Format**: Use standard note names like "C4", "D#4" (not concatenation)
- **Velocity Range**: MIDI velocity 0-127, converted to linear 0-1 for Tone.js
- **Polyphony**: Handled automatically by Tone.PolySynth
- **UI Layout**: Black keys use absolute positioning with proper z-index

### **Audio Status and User Interaction**
- **Modal Pattern**: AudioProvider manages "Enable Audio" overlay
- **Status Display**: Check `audioState.isInitialized` for UI feedback
- **Auto-close**: Modal should hide after successful initialization
- **Error Handling**: Show user-friendly error messages for audio failures