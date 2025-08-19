import { useState, useEffect } from 'react';
import { toneTransportService } from './tone-transport-service';
import type { TransportState } from './tone-transport-service';

export interface ToneTransportHookState extends TransportState {
  // Additional computed properties for UI
  positionDisplay: string;
  isReady: boolean;
}

export function useToneTransport() {
  const [state, setState] = useState<ToneTransportHookState>({
    isPlaying: false,
    isRecording: false,
    bpm: 120,
    timeSignature: [4, 4],
    position: '0:0:0',
    swing: 0,
    currentBar: 0,
    currentBeat: 0,
    currentSixteenth: 0,
    positionDisplay: '1.1.01',
    isReady: true
  });

  useEffect(() => {
    // Listen for transport state changes
    const unsubscribeTransport = toneTransportService.onTransportChange((transportState) => {
      setState(prevState => ({
        ...prevState,
        ...transportState,
        positionDisplay: formatPosition(transportState.currentBar, transportState.currentBeat, transportState.currentSixteenth),
        isReady: true
      }));
    });

    // Listen for position updates (more frequent)
    const unsubscribePosition = toneTransportService.onPosition((position) => {
      const [bars, beats, sixteenths] = position.split(':').map(Number);
      setState(prevState => ({
        ...prevState,
        position,
        currentBar: bars,
        currentBeat: beats,
        currentSixteenth: Math.floor(sixteenths),
        positionDisplay: formatPosition(bars, beats, Math.floor(sixteenths))
      }));
    });

    // Get initial state
    const initialState = toneTransportService.getState();
    setState(prevState => ({
      ...prevState,
      ...initialState,
      positionDisplay: formatPosition(initialState.currentBar, initialState.currentBeat, initialState.currentSixteenth),
      isReady: true
    }));

    return () => {
      unsubscribeTransport();
      unsubscribePosition();
    };
  }, []);

  // Format position for display (1-indexed for users)
  const formatPosition = (bar: number, beat: number, sixteenth: number): string => {
    return `${bar + 1}.${beat + 1}.${String(sixteenth + 1).padStart(2, '0')}`;
  };

  // Transport control methods
  const play = async (delay?: number) => {
    try {
      await toneTransportService.start(delay);
    } catch (error) {
      console.error('Failed to start transport:', error);
    }
  };

  const stop = () => {
    try {
      toneTransportService.stop();
    } catch (error) {
      console.error('Failed to stop transport:', error);
    }
  };

  const pause = () => {
    try {
      toneTransportService.pause();
    } catch (error) {
      console.error('Failed to pause transport:', error);
    }
  };

  const setBPM = (bpm: number) => {
    try {
      toneTransportService.setBpm(bpm);
    } catch (error) {
      console.error('Failed to set BPM:', error);
    }
  };

  const setSwing = (swing: number) => {
    try {
      toneTransportService.setSwing(swing);
    } catch (error) {
      console.error('Failed to set swing:', error);
    }
  };

  const setTimeSignature = (numerator: number, denominator: number) => {
    try {
      toneTransportService.setTimeSignature(numerator, denominator);
    } catch (error) {
      console.error('Failed to set time signature:', error);
    }
  };

  const setPosition = (position: string) => {
    try {
      toneTransportService.setPosition(position);
    } catch (error) {
      console.error('Failed to set position:', error);
    }
  };

  const setLoop = (enabled: boolean, start?: string, end?: string) => {
    try {
      toneTransportService.setLoop(enabled, start, end);
    } catch (error) {
      console.error('Failed to set loop:', error);
    }
  };

  // Utility methods
  const getCurrentTime = (): number => {
    return toneTransportService.getCurrentTime();
  };

  const getCurrentPosition = (): string => {
    return toneTransportService.getCurrentPosition();
  };

  const getLoopState = () => {
    return toneTransportService.getLoopState();
  };

  const quantizeTime = (time: string, subdivision: string = '16n'): string => {
    return toneTransportService.quantizeTime(time, subdivision);
  };

  const secondsToTransportTime = (seconds: number): string => {
    return toneTransportService.secondsToTransportTime(seconds);
  };

  const transportTimeToSeconds = (time: string): number => {
    return toneTransportService.transportTimeToSeconds(time);
  };

  return {
    // State
    ...state,
    
    // Transport controls
    play,
    stop,
    pause,
    setBPM,
    setSwing,
    setTimeSignature,
    setPosition,
    setLoop,
    
    // Utility methods
    getCurrentTime,
    getCurrentPosition,
    getLoopState,
    quantizeTime,
    secondsToTransportTime,
    transportTimeToSeconds,
    
    // Legacy compatibility for existing components
    currentPosition: {
      bar: state.currentBar,
      beat: state.currentBeat,
      step: state.currentSixteenth
    }
  };
}