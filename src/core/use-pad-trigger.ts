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
    currentKit: 'factory-kit-01'
  });

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

  return {
    ...state,
    triggerPad: (padName: PadName, velocity: number = 127) => 
      padTriggerService.triggerPad(padName, velocity),
    setKit: (kitId: string) => 
      setState(prev => ({ ...prev, currentKit: kitId })),
    hasPadSample: (padName: PadName) => 
      padTriggerService.hasPadSample(padName),
    activeVoices: padTriggerService.activeVoices
  };
}