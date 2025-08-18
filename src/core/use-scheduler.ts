import { useState, useEffect } from 'react';
import { schedulerService } from './scheduler-service';

export interface SchedulerState {
  isPlaying: boolean;
  currentPosition: {
    bar: number;
    beat: number;
    step: number;
  };
  bpm: number;
  swing: number;
}

export function useScheduler() {
  const [state, setState] = useState<SchedulerState>({
    isPlaying: false,
    currentPosition: { bar: 0, beat: 0, step: 0 },
    bpm: 120,
    swing: 0
  });

  useEffect(() => {
    const unsubscribe = schedulerService.onEvent((event) => {
      // Handle different event types - placeholder implementation
      console.log('Scheduler event:', event);
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    play: () => schedulerService.play(),
    stop: () => schedulerService.stop(),
    setBPM: (bpm: number) => schedulerService.setBPM(bpm),
    setSwing: (swing: number) => schedulerService.setSwing(swing)
  };
}