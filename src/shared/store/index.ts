// Reactive State Store
// Lightweight state management for vibebeat.io

import { v4 as uuidv4 } from 'uuid';
import type {
  AppState,
  AppAction,
  Project,
  Track,
  TransportState,
  SelectionState,
  UIState,
  AudioContextState,
  ViewMode,
  LatencyMode
} from '../models';

// Event Emitter for State Changes
type StateListener<T = AppState> = (state: T) => void;
type StateSelector<T = any> = (state: AppState) => T;

class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();
  
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }
  
  off(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }
  
  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }
  
  clear(): void {
    this.listeners.clear();
  }
}

// Default State Factory
function createDefaultProject(): Project {
  const projectId = uuidv4();
  const now = Date.now();
  
  const defaultPattern = {
    grid: '1/16' as const,
    steps: 64, // 4 bars * 16 steps
    pads: []
  };
  
  return {
    version: '1.1.0' as const,
    projectId,
    title: 'New Project',
    tempoBpm: 120,
    timeSig: '4/4' as const,
    bars: 4,
    swingPercent: 0,
    tracks: [
      {
        id: uuidv4(),
        type: 'DRUM' as const,
        name: 'Drums',
        kitId: 'factory-kit-01',
        pattern: defaultPattern,
        mixer: {
          vol: 0.8,
          pan: 0.0,
          sendA: 0.1,
          sendB: 0.0,
          mute: false,
          solo: false
        }
      }
    ],
    arrangement: {
      patterns: {
        A: {
          name: 'Pattern A',
          data: { tracks: {} } // Will store pattern data for each track
        },
        B: {
          name: 'Pattern B',
          data: { tracks: {} } // Will store pattern data for each track
        }
      },
      chain: ['A', 'A', 'B', 'B'],
      currentPattern: 'A' as const,
      loopMode: true
    },
    createdAt: now,
    updatedAt: now,
    ownerUid: null
  };
}

function createDefaultState(): AppState {
  return {
    project: createDefaultProject(),
    transport: {
      isPlaying: false,
      isRecording: false,
      bpm: 120,
      currentBar: 1,
      currentBeat: 1,
      currentStep: 0,
      timeSignature: [4, 4],
      swingPercent: 0,
      metronomeEnabled: false,
      countInBars: 1
    },
    selection: {
      selectedTrackId: null,
      selectedPad: null,
      selectedSteps: [],
      editMode: 'select'
    },
    ui: {
      currentView: 'pads' as ViewMode,
      latencyMode: 'stable' as LatencyMode,
      sidebarCollapsed: false,
      loading: false,
      error: null,
      // Phase 9: Onboarding & Help
      onboardingStep: 0, // Start with onboarding
      showHelp: false,
      helpSection: null,
      // Phase 9: Achievements & Progress
      achievements: [],
      timeToFirstLoop: null,
      showPatternSelector: false
    },
    audio: {
      context: null,
      outputLatency: 0,
      sampleRate: 44100,
      isRunning: false,
      latencyMode: 'stable'
    },
    undoStack: [],
    redoStack: []
  };
}

// State Store Class
export class StateStore {
  private state: AppState;
  private emitter = new EventEmitter();
  private maxUndoSize = 50;
  private saveStateKeys = new Set(['project', 'ui.currentView']); // Keys that trigger undo save
  
  constructor(initialState?: Partial<AppState>) {
    this.state = {
      ...createDefaultState(),
      ...initialState
    };
  }
  
  // Get current state
  getState(): AppState {
    return this.state;
  }
  
  // Subscribe to state changes
  subscribe(listener: StateListener): () => void {
    this.emitter.on('stateChange', listener);
    return () => this.emitter.off('stateChange', listener);
  }
  
  // Subscribe to specific part of state
  subscribeSelector<T>(selector: StateSelector<T>, listener: (value: T) => void): () => void {
    let currentValue = selector(this.state);
    
    const wrappedListener = (state: AppState) => {
      const newValue = selector(state);
      if (newValue !== currentValue) {
        currentValue = newValue;
        listener(newValue);
      }
    };
    
    this.emitter.on('stateChange', wrappedListener);
    return () => this.emitter.off('stateChange', wrappedListener);
  }
  
  // Dispatch action
  dispatch(action: AppAction): void {
    const prevState = this.state;
    const nextState = this.reduce(prevState, action);
    
    if (nextState !== prevState) {
      this.state = nextState;
      this.emitter.emit('stateChange', nextState);
      this.emitter.emit(`action:${action.type}`, action, nextState);
    }
  }
  
  // Subscribe to specific action types
  subscribeAction(actionType: AppAction['type'], listener: (action: AppAction, state: AppState) => void): () => void {
    this.emitter.on(`action:${actionType}`, listener);
    return () => this.emitter.off(`action:${actionType}`, listener);
  }
  
  // State reducer
  private reduce(state: AppState, action: AppAction): AppState {
    switch (action.type) {
      case 'SET_PROJECT': {
        this.saveForUndo(state);
        return {
          ...state,
          project: {
            ...action.payload,
            updatedAt: Date.now()
          },
          redoStack: [] // Clear redo stack on new action
        };
      }
      
      case 'UPDATE_TRACK': {
        this.saveForUndo(state);
        const { trackId, track } = action.payload;
        return {
          ...state,
          project: {
            ...state.project,
            tracks: state.project.tracks.map(t => 
              t.id === trackId ? { ...t, ...track } : t
            ),
            updatedAt: Date.now()
          },
          redoStack: []
        };
      }
      
      case 'ADD_TRACK': {
        this.saveForUndo(state);
        return {
          ...state,
          project: {
            ...state.project,
            tracks: [...state.project.tracks, action.payload],
            updatedAt: Date.now()
          },
          redoStack: []
        };
      }
      
      case 'REMOVE_TRACK': {
        this.saveForUndo(state);
        return {
          ...state,
          project: {
            ...state.project,
            tracks: state.project.tracks.filter(t => t.id !== action.payload),
            updatedAt: Date.now()
          },
          selection: {
            ...state.selection,
            selectedTrackId: state.selection.selectedTrackId === action.payload 
              ? null 
              : state.selection.selectedTrackId
          },
          redoStack: []
        };
      }
      
      case 'SET_TRANSPORT': {
        return {
          ...state,
          transport: {
            ...state.transport,
            ...action.payload
          }
        };
      }
      
      case 'SET_SELECTION': {
        return {
          ...state,
          selection: {
            ...state.selection,
            ...action.payload
          }
        };
      }
      
      case 'SET_UI': {
        return {
          ...state,
          ui: {
            ...state.ui,
            ...action.payload
          }
        };
      }
      
      case 'SET_AUDIO': {
        return {
          ...state,
          audio: {
            ...state.audio,
            ...action.payload
          }
        };
      }
      
      case 'UNDO': {
        if (state.undoStack.length === 0) return state;
        
        const previousProject = state.undoStack[state.undoStack.length - 1];
        return {
          ...state,
          project: previousProject,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [state.project, ...state.redoStack].slice(0, this.maxUndoSize)
        };
      }
      
      case 'REDO': {
        if (state.redoStack.length === 0) return state;
        
        const nextProject = state.redoStack[0];
        return {
          ...state,
          project: nextProject,
          undoStack: [...state.undoStack, state.project].slice(-this.maxUndoSize),
          redoStack: state.redoStack.slice(1)
        };
      }
      
      case 'CLEAR_UNDO_HISTORY': {
        return {
          ...state,
          undoStack: [],
          redoStack: []
        };
      }
      
      // Phase 9: Pattern Management
      case 'SWITCH_PATTERN': {
        return {
          ...state,
          project: {
            ...state.project,
            arrangement: {
              ...state.project.arrangement,
              currentPattern: action.payload
            },
            updatedAt: Date.now()
          }
        };
      }
      
      case 'DUPLICATE_PATTERN': {
        const { from, to } = action.payload;
        const sourcePattern = state.project.arrangement.patterns[from];
        return {
          ...state,
          project: {
            ...state.project,
            arrangement: {
              ...state.project.arrangement,
              patterns: {
                ...state.project.arrangement.patterns,
                [to]: {
                  ...sourcePattern,
                  name: `Pattern ${to}`
                }
              }
            },
            updatedAt: Date.now()
          }
        };
      }
      
      case 'UPDATE_ARRANGEMENT_CHAIN': {
        return {
          ...state,
          project: {
            ...state.project,
            arrangement: {
              ...state.project.arrangement,
              chain: action.payload
            },
            updatedAt: Date.now()
          }
        };
      }
      
      case 'SET_LOOP_MODE': {
        return {
          ...state,
          project: {
            ...state.project,
            arrangement: {
              ...state.project.arrangement,
              loopMode: action.payload
            },
            updatedAt: Date.now()
          }
        };
      }
      
      // Phase 9: Onboarding & Help
      case 'SET_ONBOARDING_STEP': {
        return {
          ...state,
          ui: {
            ...state.ui,
            onboardingStep: action.payload
          }
        };
      }
      
      case 'TOGGLE_HELP': {
        return {
          ...state,
          ui: {
            ...state.ui,
            showHelp: !state.ui.showHelp,
            helpSection: action.payload?.section || null
          }
        };
      }
      
      case 'ADD_ACHIEVEMENT': {
        const achievement = {
          id: uuidv4(),
          type: action.payload.type as any,
          timestamp: action.payload.timestamp,
          celebrated: false
        };
        
        return {
          ...state,
          ui: {
            ...state.ui,
            achievements: [...state.ui.achievements, achievement]
          }
        };
      }
      
      case 'CELEBRATE_ACHIEVEMENT': {
        return {
          ...state,
          ui: {
            ...state.ui,
            achievements: state.ui.achievements.map(a => 
              a.id === action.payload ? { ...a, celebrated: true } : a
            )
          }
        };
      }
      
      default:
        return state;
    }
  }
  
  // Save current project for undo
  private saveForUndo(state: AppState): void {
    const newUndoStack = [...state.undoStack, state.project].slice(-this.maxUndoSize);
    // We'll update this in the reducer, this is just for immediate access
  }
  
  // Batch multiple actions
  batchDispatch(actions: AppAction[]): void {
    let currentState = this.state;
    
    for (const action of actions) {
      currentState = this.reduce(currentState, action);
    }
    
    if (currentState !== this.state) {
      this.state = currentState;
      this.emitter.emit('stateChange', currentState);
    }
  }
  
  // Helper methods for common operations
  setTempo(bpm: number): void {
    this.dispatch({
      type: 'SET_TRANSPORT',
      payload: { bpm }
    });
    
    this.dispatch({
      type: 'SET_PROJECT',
      payload: {
        ...this.state.project,
        tempoBpm: bpm
      }
    });
  }
  
  togglePlayback(): void {
    this.dispatch({
      type: 'SET_TRANSPORT',
      payload: {
        isPlaying: !this.state.transport.isPlaying
      }
    });
  }
  
  setCurrentView(view: ViewMode): void {
    this.dispatch({
      type: 'SET_UI',
      payload: { currentView: view }
    });
  }
  
  setLatencyMode(mode: LatencyMode): void {
    this.dispatch({
      type: 'SET_UI',
      payload: { latencyMode: mode }
    });
    
    this.dispatch({
      type: 'SET_AUDIO',
      payload: { latencyMode: mode }
    });
  }
  
  selectTrack(trackId: string | null): void {
    this.dispatch({
      type: 'SET_SELECTION',
      payload: { 
        selectedTrackId: trackId,
        selectedPad: null, // Clear pad selection when switching tracks
        selectedSteps: []
      }
    });
  }
  
  updateTrackMixer(trackId: string, mixer: Partial<Track['mixer']>): void {
    const track = this.state.project.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    this.dispatch({
      type: 'UPDATE_TRACK',
      payload: {
        trackId,
        track: {
          mixer: {
            ...track.mixer,
            ...mixer
          }
        }
      }
    });
  }
  
  // Phase 9: Pattern Management Methods
  switchPattern(pattern: 'A' | 'B'): void {
    this.dispatch({
      type: 'SWITCH_PATTERN',
      payload: pattern
    });
    
    // Add achievement for first pattern switch
    if (!this.state.ui.achievements.some(a => a.type === 'first_pattern_switch')) {
      this.addAchievement('first_pattern_switch');
    }
  }
  
  duplicatePattern(from: 'A' | 'B', to: 'A' | 'B'): void {
    this.dispatch({
      type: 'DUPLICATE_PATTERN',
      payload: { from, to }
    });
  }
  
  updateArrangementChain(chain: ('A' | 'B')[]): void {
    this.dispatch({
      type: 'UPDATE_ARRANGEMENT_CHAIN',
      payload: chain
    });
  }
  
  setLoopMode(enabled: boolean): void {
    this.dispatch({
      type: 'SET_LOOP_MODE',
      payload: enabled
    });
  }
  
  // Phase 9: Onboarding & Help Methods
  setOnboardingStep(step: number | null): void {
    this.dispatch({
      type: 'SET_ONBOARDING_STEP',
      payload: step
    });
  }
  
  toggleHelp(section?: string): void {
    this.dispatch({
      type: 'TOGGLE_HELP',
      payload: section ? { section } : undefined
    });
  }
  
  addAchievement(type: string): void {
    this.dispatch({
      type: 'ADD_ACHIEVEMENT',
      payload: {
        type,
        timestamp: Date.now()
      }
    });
  }
  
  celebrateAchievement(id: string): void {
    this.dispatch({
      type: 'CELEBRATE_ACHIEVEMENT',
      payload: id
    });
  }
  
  // Track time to first loop for analytics
  startTimeToFirstLoop(): void {
    if (this.state.ui.timeToFirstLoop === null) {
      this.dispatch({
        type: 'SET_UI',
        payload: { timeToFirstLoop: Date.now() }
      });
    }
  }
  
  completeFirstLoop(): void {
    if (this.state.ui.timeToFirstLoop !== null) {
      const timeElapsed = Date.now() - this.state.ui.timeToFirstLoop;
      this.addAchievement('first_loop');
      console.log(`Time to first loop: ${timeElapsed}ms`);
    }
  }
  
  // Destroy store and clean up
  destroy(): void {
    this.emitter.clear();
  }
}

// Global store instance
export const store = new StateStore();

// Convenience hooks for common selectors
export const selectors = {
  project: (state: AppState) => state.project,
  transport: (state: AppState) => state.transport,
  selection: (state: AppState) => state.selection,
  ui: (state: AppState) => state.ui,
  audio: (state: AppState) => state.audio,
  currentTrack: (state: AppState) => 
    state.selection.selectedTrackId 
      ? state.project.tracks.find(t => t.id === state.selection.selectedTrackId) 
      : null,
  isPlaying: (state: AppState) => state.transport.isPlaying,
  canUndo: (state: AppState) => state.undoStack.length > 0,
  canRedo: (state: AppState) => state.redoStack.length > 0,
  outputLatency: (state: AppState) => state.audio.outputLatency,
  // Phase 9: New Selectors
  currentPattern: (state: AppState) => state.project.arrangement.currentPattern,
  arrangementChain: (state: AppState) => state.project.arrangement.chain,
  patternA: (state: AppState) => state.project.arrangement.patterns.A,
  patternB: (state: AppState) => state.project.arrangement.patterns.B,
  loopMode: (state: AppState) => state.project.arrangement.loopMode,
  onboardingStep: (state: AppState) => state.ui.onboardingStep,
  showHelp: (state: AppState) => state.ui.showHelp,
  achievements: (state: AppState) => state.ui.achievements,
  uncelebratedAchievements: (state: AppState) => 
    state.ui.achievements.filter(a => !a.celebrated),
  timeToFirstLoop: (state: AppState) => state.ui.timeToFirstLoop
};

// Export types
export type { StateListener, StateSelector };