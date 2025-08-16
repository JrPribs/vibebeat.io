import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction } from '../shared/models';
import { storeReducer, initialState } from './store-reducer';

export interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export interface StoreProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export function StoreProvider({ children, initialState: customInitialState }: StoreProviderProps) {
  const [state, dispatch] = useReducer(
    storeReducer, 
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  const value = {
    state,
    dispatch
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export function useAppState(): AppState {
  const { state } = useStore();
  return state;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const { dispatch } = useStore();
  return dispatch;
}

// Convenience hooks for specific parts of the state
export function useAudioState() {
  const { state } = useStore();
  return state.audio;
}

export function useUIState() {
  const { state } = useStore();
  return state.ui;
}

export function useProjectState() {
  const { state } = useStore();
  return state.project;
}

export function useFactoryState() {
  const { state } = useStore();
  return state.factory;
}

export function useExportState() {
  const { state } = useStore();
  return state.export;
}

export function useAIState() {
  const { state } = useStore();
  return state.ai;
}