import { useState, useEffect } from 'react';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = padTriggerService.onEvent((event) => {
      if (event.type === 'pad_triggered') {
        setState(prev => ({
          ...prev,
          activePads: new Set([...prev.activePads, event.padName])
        }));
        
        // Remove from active after short delay
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

  // Force refresh of sample state periodically during initialization
  useEffect(() => {
    const checkSampleState = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Check every 500ms for the first 10 seconds during app startup
    const interval = setInterval(checkSampleState, 500);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
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
    hasPadSample: (padName: PadName) => {
      // Force re-evaluation when refreshTrigger changes
      return padTriggerService.hasPadSample(padName);
    },
    activeVoices: padTriggerService.activeVoices,
    // Debug info
    refreshCount: refreshTrigger
  };
}