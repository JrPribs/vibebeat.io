// Audio Hook
// React hook for integrating AudioService with store

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from './store-context';
import { audioService } from './audio-service';
import { tonePianoService } from './tone-piano-service';
import { toneMixerService } from './tone-mixer-service';
import * as Tone from 'tone';
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
        dispatch({ type: 'SET_AUDIO', payload: { isLoading: true } });
        
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
        
        console.log('Complete audio system initialized successfully');
        
        dispatch({ type: 'SET_AUDIO', payload: { isLoading: false } });
        userInteractionRef.current = true;
      } catch (error) {
        console.error('Failed to initialize audio service:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown audio error';
        dispatch({ 
          type: 'SET_AUDIO', 
          payload: { 
            error: `Failed to initialize audio system: ${errorMessage}. Please click "Enable Audio" to try again.`,
            isLoading: false
          }
        });
      }
    };

    // Set up event listeners
    const unsubscribeStateChange = audioService.onStateChange((audioState: AudioContextState) => {
      dispatch({ type: 'SET_AUDIO', payload: audioState });
    });

    const unsubscribeError = audioService.onError((error: AudioError) => {
      dispatch({ 
        type: 'SET_AUDIO', 
        payload: { error: `Audio Error: ${error.message}` }
      });
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
  }, [dispatch, state.audio.latencyMode]);

  // Handle latency mode changes
  useEffect(() => {
    const updateLatencyMode = async () => {
      try {
        await audioService.setLatencyMode(state.audio.latencyMode);
      } catch (error) {
        console.error('Failed to change latency mode:', error);
        dispatch({ 
          type: 'SET_AUDIO', 
          payload: { error: 'Failed to change audio latency mode' }
        });
      }
    };

    if (audioService.getState().context) {
      updateLatencyMode();
    }
  }, [state.audio.latencyMode, dispatch]);

  // Audio control functions
  const resumeAudio = useCallback(async () => {
    try {
      await audioService.resume();
    } catch (error) {
      console.error('Failed to resume audio:', error);
      dispatch({ 
        type: 'SET_AUDIO', 
        payload: { error: 'Failed to resume audio' }
      });
    }
  }, [dispatch]);

  const suspendAudio = useCallback(async () => {
    try {
      await audioService.suspend();
    } catch (error) {
      console.error('Failed to suspend audio:', error);
      dispatch({ 
        type: 'SET_AUDIO', 
        payload: { error: 'Failed to suspend audio' }
      });
    }
  }, [dispatch]);

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
      dispatch({ type: 'SET_AUDIO', payload: { isLoading: true } });
      
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
      
      console.log('Complete audio system initialized successfully');
      
      dispatch({ type: 'SET_AUDIO', payload: { isLoading: false } });
      userInteractionRef.current = true;
    } catch (error) {
      console.error('Failed to initialize audio service manually:', error);
      dispatch({ 
        type: 'SET_AUDIO', 
        payload: { 
          error: 'Failed to initialize audio system. Check if your browser supports Web Audio API.',
          isLoading: false
        }
      });
    }
  }, [dispatch, state.audio.latencyMode]);

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