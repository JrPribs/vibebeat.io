// Store Context
// React Context for global state management

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { AppState, AppAction, Project } from '../shared/models/index';
import { appStateReducer, createInitialState } from './store-reducer';
import { useUndoRedo } from './use-undo-redo';

// Store Context Type
interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience actions
  actions: {
    // Project actions
    setProject: (project: Project) => void;
    updateProject: (updates: Partial<Project>) => void;
    
    // Transport actions
    play: () => void;
    pause: () => void;
    stop: () => void;
    setBpm: (bpm: number) => void;
    setSwing: (swing: number) => void;
    toggleMetronome: () => void;
    
    // Track actions
    addTrack: (track: any) => void;
    removeTrack: (trackId: string) => void;
    updateTrack: (trackId: string, updates: any) => void;
    
    // Selection actions
    selectTrack: (trackId: string | null) => void;
    selectPad: (padName: string | null) => void;
    setEditMode: (mode: 'select' | 'draw' | 'erase') => void;
    
    // UI actions
    setView: (view: 'pads' | 'keys' | 'sample' | 'record' | 'mixer' | 'arrange') => void;
    setLatencyMode: (mode: 'low' | 'stable') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Undo/Redo
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
}

// Create Context
const StoreContext = createContext<StoreContextType | null>(null);

// Store Provider Component
interface StoreProviderProps {
  children: React.ReactNode;
  initialProject?: Project;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ 
  children, 
  initialProject 
}) => {
  const [state, dispatch] = useReducer(
    appStateReducer, 
    createInitialState(initialProject)
  );
  
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    enhancedDispatch
  } = useUndoRedo(state, dispatch);

  // Project actions
  const setProject = useCallback((project: Project) => {
    enhancedDispatch({ type: 'SET_PROJECT', payload: project });
  }, [enhancedDispatch]);

  const updateProject = useCallback((updates: Partial<Project>) => {
    enhancedDispatch({ 
      type: 'SET_PROJECT', 
      payload: { ...state.project, ...updates, updatedAt: Date.now() }
    });
  }, [enhancedDispatch, state.project]);

  // Transport actions
  const play = useCallback(() => {
    enhancedDispatch({ 
      type: 'SET_TRANSPORT', 
      payload: { isPlaying: true, isRecording: false }
    });
  }, [enhancedDispatch]);

  const pause = useCallback(() => {
    enhancedDispatch({ 
      type: 'SET_TRANSPORT', 
      payload: { isPlaying: false }
    });
  }, [enhancedDispatch]);

  const stop = useCallback(() => {
    enhancedDispatch({ 
      type: 'SET_TRANSPORT', 
      payload: { 
        isPlaying: false, 
        isRecording: false,
        currentBar: 0,
        currentBeat: 0,
        currentStep: 0
      }
    });
  }, [enhancedDispatch]);

  const setBpm = useCallback((bpm: number) => {
    // Update both transport and project
    enhancedDispatch({ type: 'SET_TRANSPORT', payload: { bpm } });
    updateProject({ tempoBpm: bpm });
  }, [enhancedDispatch, updateProject]);

  const setSwing = useCallback((swingPercent: number) => {
    enhancedDispatch({ type: 'SET_TRANSPORT', payload: { swingPercent } });
    updateProject({ swingPercent });
  }, [enhancedDispatch, updateProject]);

  const toggleMetronome = useCallback(() => {
    enhancedDispatch({ 
      type: 'SET_TRANSPORT', 
      payload: { metronomeEnabled: !state.transport.metronomeEnabled }
    });
  }, [enhancedDispatch, state.transport.metronomeEnabled]);

  // Track actions
  const addTrack = useCallback((track: any) => {
    enhancedDispatch({ type: 'ADD_TRACK', payload: track });
  }, [enhancedDispatch]);

  const removeTrack = useCallback((trackId: string) => {
    enhancedDispatch({ type: 'REMOVE_TRACK', payload: trackId });
  }, [enhancedDispatch]);

  const updateTrack = useCallback((trackId: string, updates: any) => {
    enhancedDispatch({ 
      type: 'UPDATE_TRACK', 
      payload: { trackId, track: updates }
    });
  }, [enhancedDispatch]);

  // Selection actions
  const selectTrack = useCallback((trackId: string | null) => {
    enhancedDispatch({ 
      type: 'SET_SELECTION', 
      payload: { selectedTrackId: trackId }
    });
  }, [enhancedDispatch]);

  const selectPad = useCallback((padName: string | null) => {
    enhancedDispatch({ 
      type: 'SET_SELECTION', 
      payload: { selectedPad: padName }
    });
  }, [enhancedDispatch]);

  const setEditMode = useCallback((editMode: 'select' | 'draw' | 'erase') => {
    enhancedDispatch({ 
      type: 'SET_SELECTION', 
      payload: { editMode }
    });
  }, [enhancedDispatch]);

  // UI actions
  const setView = useCallback((currentView: 'pads' | 'keys' | 'sample' | 'record' | 'mixer' | 'arrange') => {
    enhancedDispatch({ 
      type: 'SET_UI', 
      payload: { currentView }
    });
  }, [enhancedDispatch]);

  const setLatencyMode = useCallback((latencyMode: 'low' | 'stable') => {
    enhancedDispatch({ 
      type: 'SET_UI', 
      payload: { latencyMode }
    });
    enhancedDispatch({ 
      type: 'SET_AUDIO', 
      payload: { latencyMode }
    });
  }, [enhancedDispatch]);

  const setLoading = useCallback((loading: boolean) => {
    enhancedDispatch({ 
      type: 'SET_UI', 
      payload: { loading }
    });
  }, [enhancedDispatch]);

  const setError = useCallback((error: string | null) => {
    enhancedDispatch({ 
      type: 'SET_UI', 
      payload: { error }
    });
  }, [enhancedDispatch]);

  const actions = {
    // Project
    setProject,
    updateProject,
    // Transport
    play,
    pause,
    stop,
    setBpm,
    setSwing,
    toggleMetronome,
    // Tracks
    addTrack,
    removeTrack,
    updateTrack,
    // Selection
    selectTrack,
    selectPad,
    setEditMode,
    // UI
    setView,
    setLatencyMode,
    setLoading,
    setError,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo
  };

  const contextValue: StoreContextType = {
    state,
    dispatch: enhancedDispatch,
    actions
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

// Hook to use store
export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// Convenience hooks for specific parts of state
export const useProject = () => {
  const { state } = useStore();
  return state.project;
};

export const useTransport = () => {
  const { state } = useStore();
  return state.transport;
};

export const useSelection = () => {
  const { state } = useStore();
  return state.selection;
};

export const useUI = () => {
  const { state } = useStore();
  return state.ui;
};

export const useAudio = () => {
  const { state } = useStore();
  return state.audio;
};