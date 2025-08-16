// Audio Hook
// React hook for integrating AudioService with store

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from './store-context';
import { audioService } from './audio-service';
import type { AudioContextState, AudioError, PerformanceMetrics } from '../shared/models/index';

export const useAudioService = () => {
  const { state, actions, dispatch } = useStore();
  const initRef = useRef(false);

  // Initialize audio service on first render
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAudio = async () => {
      try {
        actions.setLoading(true);
        await audioService.initialize(state.audio.latencyMode);
        actions.setLoading(false);
      } catch (error) {
        console.error('Failed to initialize audio service:', error);
        actions.setError('Failed to initialize audio system');
        actions.setLoading(false);
      }
    };

    // Set up event listeners
    const unsubscribeStateChange = audioService.onStateChange((audioState: AudioContextState) => {
      dispatch({ type: 'SET_AUDIO', payload: audioState });
    });

    const unsubscribeError = audioService.onError((error: AudioError) => {
      actions.setError(`Audio Error: ${error.message}`);
    });

    const unsubscribeLatency = audioService.onLatencyUpdate((latency: number) => {
      dispatch({ 
        type: 'SET_AUDIO', 
        payload: { outputLatency: latency }
      });
    });

    // Initialize audio on user interaction
    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      unsubscribeStateChange();
      unsubscribeError();
      unsubscribeLatency();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [actions, state.audio.latencyMode]);

  // Handle latency mode changes
  useEffect(() => {
    const updateLatencyMode = async () => {
      try {
        await audioService.setLatencyMode(state.audio.latencyMode);
      } catch (error) {
        console.error('Failed to change latency mode:', error);
        actions.setError('Failed to change audio latency mode');
      }
    };

    if (audioService.getState().context) {
      updateLatencyMode();
    }
  }, [state.audio.latencyMode, actions]);

  // Audio control functions
  const resumeAudio = useCallback(async () => {
    try {
      await audioService.resume();
    } catch (error) {
      console.error('Failed to resume audio:', error);
      actions.setError('Failed to resume audio');
    }
  }, [actions]);

  const suspendAudio = useCallback(async () => {
    try {
      await audioService.suspend();
    } catch (error) {
      console.error('Failed to suspend audio:', error);
      actions.setError('Failed to suspend audio');
    }
  }, [actions]);

  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    return audioService.getPerformanceMetrics();
  }, []);

  const getAudioContext = useCallback(() => {
    return audioService.getState().context;
  }, []);

  const getDestination = useCallback(() => {
    return audioService.getDestination();
  }, []);

  const getAnalyser = useCallback(() => {
    return audioService.getAnalyser();
  }, []);

  return {
    audioService,
    audioState: state.audio,
    resumeAudio,
    suspendAudio,
    getPerformanceMetrics,
    getAudioContext,
    getDestination,
    getAnalyser,
    isInitialized: state.audio.context !== null,
    latencyMs: Math.round(state.audio.outputLatency * 1000)
  };
};

export default useAudioService;