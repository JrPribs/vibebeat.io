// Undo/Redo Hook
// Enhanced dispatch with automatic undo/redo history management

import { useCallback, useRef } from 'react';
import type { AppState, AppAction, Project } from '../shared/models/index';

const UNDO_STACK_LIMIT = 50;

// Actions that should create undo history
const UNDOABLE_ACTIONS = new Set([
  'SET_PROJECT',
  'UPDATE_PROJECT',
  'ADD_TRACK',
  'REMOVE_TRACK',
  'UPDATE_TRACK'
]);

export const useUndoRedo = (
  state: AppState,
  dispatch: React.Dispatch<AppAction>
) => {
  const isUndoRedoAction = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const enhancedDispatch = useCallback((action: AppAction) => {
    // Handle undo/redo actions directly
    if (action.type === 'UNDO' || action.type === 'REDO') {
      isUndoRedoAction.current = true;
      dispatch(action);
      return;
    }

    // For undoable actions, save current state to undo stack
    if (UNDOABLE_ACTIONS.has(action.type) && !isUndoRedoAction.current) {
      // Save current project state to undo stack
      const newUndoStack = [...state.undoStack, state.project];
      
      // Limit undo stack size
      if (newUndoStack.length > UNDO_STACK_LIMIT) {
        newUndoStack.shift();
      }

      // Update undo/redo stacks before dispatching the main action
      dispatch({
        type: 'UPDATE_UNDO_STACKS',
        payload: {
          undoStack: newUndoStack,
          redoStack: [] // Clear redo stack when new action is performed
        }
      });
    }

    // Reset the flag
    isUndoRedoAction.current = false;
    
    // Dispatch the original action
    dispatch(action);
  }, [state.undoStack, state.project, dispatch]);

  const undo = useCallback(() => {
    isUndoRedoAction.current = true;
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    isUndoRedoAction.current = true;
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  return {
    enhancedDispatch,
    undo,
    redo,
    canUndo,
    canRedo
  };
};