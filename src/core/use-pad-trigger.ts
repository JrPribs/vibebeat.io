import { useState, useEffect, useCallback } from 'react';
import { padTriggerService } from './pad-trigger-service';
import type { PadName } from '../shared/models/audio';

export interface PadTriggerState {
  isLoading: boolean;
  activePads: Set<PadName>;
  currentKit: string;
}

export function usePadTrigger() {
  const [state, setState] = useState<PadTriggerState>({
    isLoading: false,
    activePads: new Set(),
    currentKit: 'musicradar-acoustic-01-close'
  });
  useEffect(() => {
    const unsubscribe = padTriggerService.onEvent((event) => {
      if (event.type === 'pad_triggered') {
        setState(prev => ({
          ...prev,
          activePads: new Set([...prev.activePads, event.padName])
        }));
        
        // Remove from active after short delay for visual feedback
        setTimeout(() => {
          setState(prev => {
            const newActivePads = new Set(prev.activePads);
            newActivePads.delete(event.padName);
            return { ...prev, activePads: newActivePads };
          });
        }, 100);
      }
    });

    return unsubscribe;
  }, []);

  const hasPadSample = useCallback((padName: PadName) => {
    return padTriggerService.hasPadSample(padName);
  }, []);

  return {
    ...state,
    triggerPad: (padName: PadName, velocity: number = 127) => 
      padTriggerService.triggerPad(padName, velocity),
    setKit: async (kitId: string) => {
      setState(prev => ({ ...prev, isLoading: true, currentKit: kitId }));
      try {
        await padTriggerService.loadMusicRadarKit(kitId);
        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Failed to load kit:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    hasPadSample,
    activeVoices: new Map() // Tone.js manages voices internally
  };
}