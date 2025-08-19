// Audio Hook
// React hook for integrating AudioService with store

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from './store-context';
import { audioService } from './audio-service';
import { schedulerService } from './scheduler-service';
import { tonePianoService } from './tone-piano-service';
import { toneMixerService } from './tone-mixer-service';
import Tone from 'tone';
import type { AudioContextState, AudioError, PerformanceMetrics } from '../shared/models/index';

export const useAudioService = () => {
  const { state, actions, dispatch } = useStore();
  const initRef = useRef(false);
  const userInteractionRef = useRef(false);

  // Initialize audio service only after user interaction
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAudio = async () => {
      try {
        actions.setLoading(true);
        
        // Initialize Tone.js first (requires user interaction)
        if (Tone.context.state !== 'running') {
          console.log('Starting Tone.js context...');
          await Tone.start();
          console.log('Tone.js context started successfully');
        }
        
        // Initialize Tone services
        await tonePianoService.initialize();
        await toneMixerService.initialize();
        
        // Initialize AudioService
        await audioService.initialize(state.audio.latencyMode);
        
        // Initialize SchedulerService after AudioService is ready
        try {
          await schedulerService.initialize();
          console.log('Complete audio system initialized successfully');
        } catch (schedulerError) {
          console.error('Failed to initialize scheduler:', schedulerError);
          // Audio still works without scheduler, but timing won't be sample-accurate
        }
        
        actions.setLoading(false);
        userInteractionRef.current = true;
      } catch (error) {
        console.error('Failed to initialize audio service:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown audio error';
        actions.setError(`Failed to initialize audio system: ${errorMessage}. Please click "Enable Audio" to try again.`);
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

    // Initialize audio ONLY on user interaction
    const handleUserInteraction = () => {
      if (!userInteractionRef.current) {
        initializeAudio();
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      unsubscribeStateChange();
      unsubscribeError();
      unsubscribeLatency();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
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
    return audioService.getAudioContext();
  }, []);

  const getDestination = useCallback(() => {
    return audioService.getDestination();
  }, []);

  const getAnalyser = useCallback(() => {
    return audioService.getAnalyser();
  }, []);

  // Manual audio initialization function
  const initializeAudioManually = useCallback(async () => {
    if (userInteractionRef.current) return; // Already initialized
    
    try {
      actions.setLoading(true);
      
      // Initialize Tone.js first (requires user interaction)
      if (Tone.context.state !== 'running') {
        console.log('Starting Tone.js context manually...');
        await Tone.start();
        console.log('Tone.js context started successfully');
      }
      
      // Initialize Tone services
      await tonePianoService.initialize();
      await toneMixerService.initialize();
      
      // Initialize AudioService
      await audioService.initialize(state.audio.latencyMode);
      
      // Initialize SchedulerService after AudioService is ready
      try {
        await schedulerService.initialize();
        console.log('Complete audio system initialized successfully');
      } catch (schedulerError) {
        console.error('Failed to initialize scheduler:', schedulerError);
        // Audio still works without scheduler, but timing won't be sample-accurate
      }
      
      actions.setLoading(false);
      userInteractionRef.current = true;
    } catch (error) {
      console.error('Failed to initialize audio service manually:', error);
      actions.setError('Failed to initialize audio system. Check if your browser supports Web Audio API.');
      actions.setLoading(false);
    }
  }, [actions, state.audio.latencyMode]);

  return {
    audioService,
    audioState: state.audio,
    resumeAudio,
    suspendAudio,
    initializeAudioManually,
    getPerformanceMetrics,
    getAudioContext,
    getDestination,
    getAnalyser,
    isInitialized: state.audio.isInitialized,
    hasUserInteracted: userInteractionRef.current,
    latencyMs: Math.round(state.audio.outputLatency * 1000)
  };
};