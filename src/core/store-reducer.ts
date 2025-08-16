// Store Reducer
// State management reducer with all app actions

import { v4 as uuidv4 } from 'uuid';
import type { AppState, AppAction, Project } from '../shared/models/index';

// Create initial state
export const createInitialState = (initialProject?: Project): AppState => {
  const defaultProject: Project = initialProject || {
    version: '1.1.0',
    projectId: uuidv4(),
    title: 'New Project',
    tempoBpm: 120,
    timeSig: '4/4',
    bars: 4,
    swingPercent: 0,
    tracks: [],
    arrangement: ['A'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ownerUid: null
  };

  return {
    project: defaultProject,
    transport: {
      isPlaying: false,
      isRecording: false,
      bpm: defaultProject.tempoBpm,
      currentBar: 0,
      currentBeat: 0,
      currentStep: 0,
      timeSignature: [4, 4],
      swingPercent: defaultProject.swingPercent,
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
      currentView: 'pads',
      latencyMode: 'stable',
      sidebarCollapsed: false,
      loading: false,
      error: null
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
};

// App State Reducer
export const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PROJECT': {
      return {
        ...state,
        project: {
          ...action.payload,
          updatedAt: Date.now()
        },
        // Update transport to match project settings
        transport: {
          ...state.transport,
          bpm: action.payload.tempoBpm,
          swingPercent: action.payload.swingPercent
        }
      };
    }

    case 'ADD_TRACK': {
      const updatedProject = {
        ...state.project,
        tracks: [...state.project.tracks, action.payload],
        updatedAt: Date.now()
      };
      return {
        ...state,
        project: updatedProject
      };
    }

    case 'REMOVE_TRACK': {
      const updatedProject = {
        ...state.project,
        tracks: state.project.tracks.filter(track => track.id !== action.payload),
        updatedAt: Date.now()
      };
      return {
        ...state,
        project: updatedProject,
        // Clear selection if removed track was selected
        selection: state.selection.selectedTrackId === action.payload 
          ? { ...state.selection, selectedTrackId: null }
          : state.selection
      };
    }

    case 'UPDATE_TRACK': {
      const { trackId, track: trackUpdates } = action.payload;
      const updatedProject = {
        ...state.project,
        tracks: state.project.tracks.map(track => 
          track.id === trackId 
            ? { ...track, ...trackUpdates }
            : track
        ),
        updatedAt: Date.now()
      };
      return {
        ...state,
        project: updatedProject
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
      const previousState = state.undoStack[state.undoStack.length - 1];
      if (!previousState) return state;

      return {
        ...state,
        project: previousState,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.project]
      };
    }

    case 'REDO': {
      const nextState = state.redoStack[state.redoStack.length - 1];
      if (!nextState) return state;

      return {
        ...state,
        project: nextState,
        undoStack: [...state.undoStack, state.project],
        redoStack: state.redoStack.slice(0, -1)
      };
    }

    case 'CLEAR_UNDO_HISTORY': {
      return {
        ...state,
        undoStack: [],
        redoStack: []
      };
    }

    default:
      return state;
  }
};