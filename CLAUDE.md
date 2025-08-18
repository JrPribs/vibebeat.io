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
2. **SchedulerService** (`src/core/scheduler-service.ts`) - Sample-accurate timing via AudioWorklet
3. **PadTriggerService** (`src/core/pad-trigger-service.ts`) - Drum pad triggering and audio routing  
4. **SampleCache** (`src/core/sample-cache.ts`) - AudioBuffer management and factory kit loading
5. **MixerService** (`src/core/mixer-service.ts`) - Channel mixing and effects
6. **RecordingService** (`src/core/recording-service.ts`) - Microphone recording with bar-sync

### AudioWorklet Architecture
- **Critical**: Uses `public/audio-worklet-scheduler.js` for sample-accurate timing
- AudioWorklet runs in separate audio thread for sub-millisecond precision
- Communication via message passing between main thread and worklet
- Must handle user gesture requirement for AudioContext initialization

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
import { useStore, useAudioService, useScheduler } from '../../core/index.js';

const { actions } = useStore();
const { audioState } = useAudioService();  
const { isPlaying, currentPosition } = useScheduler();
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
2. AudioContext creation with optimal settings (low/stable latency modes)
3. AudioWorklet processor loading from `public/audio-worklet-scheduler.js`
4. Service interconnection and factory kit preloading

### Timing and Synchronization
- **Resolution**: 16th note steps (4 steps per beat)
- **Precision**: Sub-millisecond accuracy via AudioWorklet
- **Latency Modes**: 
  - Low: 5ms target for real-time performance
  - Stable: 20ms target for CPU-constrained environments

### Audio Processing Chain
```
User Input → Store Actions → Service Updates → AudioWorklet → Audio Output
                        ↓
Sample Cache ← Factory Kits ← PadTriggerService ← Scheduler Events
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

### Modifying Audio Timing
- Always work through SchedulerService
- Use AudioWorklet for sample-accurate operations
- Test with both low and stable latency modes

### Adding New Sample Sources
- Extend SampleCache for loading
- Update PadTriggerService for playback
- Follow factory kit organization pattern