// Sample Cache Hook
// React hook for integrating SampleCache with store

import { useEffect, useCallback, useState } from 'react';
import { useStore } from './store-context';
import { sampleCache } from './sample-cache';
import { audioService } from './audio-service';
import type { FactoryKit, FactoryContent, Sample, PadName } from '../shared/models/index';

export const useSampleCache = () => {
  const { actions, state } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [factoryKits, setFactoryKits] = useState<FactoryKit[]>([]);
  const [loadedKits, setLoadedKits] = useState<Set<string>>(new Set());
  const [cacheStats, setCacheStats] = useState(sampleCache.getStats());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize factory kits only when audio context is available
  useEffect(() => {
    if (isInitialized || !state.audio.context) return;
    
    const loadFactoryKits = async () => {
      try {
        setIsLoading(true);
        const kits = sampleCache.getFactoryKits();
        setFactoryKits(kits);
        
        // Only preload if audio context is available
        if (state.audio.context) {
          await sampleCache.preloadEssentials();
        }
        
        // Update cache stats
        setCacheStats(sampleCache.getStats());
        setIsInitialized(true);
        
      } catch (error) {
        console.error('Failed to load factory kits:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('AudioContext not available')) {
          // Don't show error for AudioContext issues - this is expected
          console.log('Factory kits will load after audio is enabled');
        } else {
          actions.setError('Failed to load factory drum kits');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFactoryKits();
  }, [actions, state.audio.context, isInitialized]);

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(sampleCache.getStats());
    };

    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Load a specific factory kit
  const loadFactoryKit = useCallback(async (kitId: string): Promise<Map<PadName, Sample> | null> => {
    try {
      setIsLoading(true);
      const samples = await sampleCache.loadFactoryKit(kitId);
      
      setLoadedKits(prev => new Set([...prev, kitId]));
      setCacheStats(sampleCache.getStats());
      
      console.log(`Factory kit loaded: ${kitId}`);
      return samples;
      
    } catch (error) {
      console.error('Failed to load factory kit:', error);
      actions.setError(`Failed to load kit: ${kitId}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  // Load a single sample
  const loadSample = useCallback(async (sampleUrl: string, options?: {
    kitId?: string;
    padName?: PadName;
  }): Promise<Sample | null> => {
    try {
      const sample = await sampleCache.loadSample(sampleUrl, options);
      setCacheStats(sampleCache.getStats());
      return sample;
    } catch (error) {
      console.error('Failed to load sample:', error);
      actions.setError(`Failed to load sample: ${sampleUrl}`);
      return null;
    }
  }, [actions]);

  // Get a cached sample
  const getSample = useCallback((sampleUrl: string): Sample | null => {
    return sampleCache.getSample(sampleUrl);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    sampleCache.clearCache();
    setLoadedKits(new Set());
    setCacheStats(sampleCache.getStats());
  }, []);

  // Get factory content
  const getFactoryContent = useCallback((): FactoryContent => {
    return sampleCache.getFactoryContent();
  }, []);

  // Check if a kit is loaded
  const isKitLoaded = useCallback((kitId: string): boolean => {
    return loadedKits.has(kitId);
  }, [loadedKits]);

  return {
    // State
    isLoading,
    factoryKits,
    loadedKits: Array.from(loadedKits),
    cacheStats,
    
    // Actions
    loadFactoryKit,
    loadSample,
    getSample,
    clearCache,
    getFactoryContent,
    isKitLoaded,
    
    // Cache instance (for advanced usage)
    sampleCache
  };
};

export default useSampleCache;