// State Management Models
// Application state and action types for state management

import type { Project, Track } from './project.js';
import type { TransportState, AudioContextState } from './audio.js';
import type { SelectionState, UIState } from './ui.js';

// Application State
export interface AppState {
  project: Project;
  transport: TransportState;
  selection: SelectionState;
  ui: UIState;
  audio: AudioContextState;
  undoStack: Project[];
  redoStack: Project[];
}

// Action Types for State Management
export type AppAction = 
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'UPDATE_TRACK'; payload: { trackId: string; track: Partial<Track> } }
  | { type: 'ADD_TRACK'; payload: Track }
  | { type: 'REMOVE_TRACK'; payload: string }
  | { type: 'SET_TRANSPORT'; payload: Partial<TransportState> }
  | { type: 'SET_SELECTION'; payload: Partial<SelectionState> }
  | { type: 'SET_UI'; payload: Partial<UIState> }
  | { type: 'SET_AUDIO'; payload: Partial<AudioContextState> }
  | { type: 'TOGGLE_HELP' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_UNDO_HISTORY' };