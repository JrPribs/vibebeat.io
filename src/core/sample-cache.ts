// Sample Cache
// Efficient loading and caching of audio samples with factory kit support

import type { Sample, FactoryKit, FactoryContent, PadName, AudioError } from '../shared/models/index';
import { audioService } from './audio-service';

interface LoadedSample extends Sample {
  loadedAt: number;
  lastAccessed: number;
  refCount: number;
}

interface CacheStats {
  totalSamples: number;
  totalMemoryMB: number;
  cacheHits: number;
  cacheMisses: number;
  loadTimeMs: number;
}

class SampleCache {
  private samples: Map<string, LoadedSample> = new Map();
  private loadingPromises: Map<string, Promise<LoadedSample>> = new Map();
  private factoryKits: Map<string, FactoryKit> = new Map();
  private maxCacheSize: number = 200; // Maximum number of cached samples
  private maxMemoryMB: number = 500; // Maximum memory usage in MB
  private stats: CacheStats = {
    totalSamples: 0,
    totalMemoryMB: 0,
    cacheHits: 0,
    cacheMisses: 0,
    loadTimeMs: 0
  };

  constructor() {
    this.initializeFactoryKits();
  }

  /**
   * Initialize factory kits with embedded sample data
   */
  private async initializeFactoryKits(): Promise<void> {
    // Factory Kit 1: Classic Hip-Hop (Real CC0 samples)
    const classicHipHop: FactoryKit = {
      id: 'classic-hip-hop',
      name: 'Classic Hip-Hop',
      description: 'Authentic vintage drum sounds from classic machines',
      license: 'CC0',
      credits: 'Archive.org - Patrick Callan Collection',
      samples: {
        KICK: '/assets/kits/factory/classic-hip-hop/kick.wav',
        SNARE: '/assets/kits/factory/classic-hip-hop/snare.wav',
        HIHAT_CLOSED: '/assets/kits/factory/classic-hip-hop/hihat-closed.wav',
        HIHAT_OPEN: '/assets/kits/factory/classic-hip-hop/hihat-open.wav',
        CLAP: '/assets/kits/factory/classic-hip-hop/snare.wav', // Use snare as clap fallback
        CRASH: '/assets/kits/factory/classic-hip-hop/hihat-open.wav', // Use open hi-hat as crash fallback
        RIDE: '/assets/kits/factory/classic-hip-hop/hihat-closed.wav', // Use closed hi-hat as ride fallback
        TOM_HIGH: '/assets/kits/factory/classic-hip-hop/snare.wav', // Use snare as tom fallback
        TOM_MID: '/assets/kits/factory/classic-hip-hop/snare.wav',
        TOM_FLOOR: '/assets/kits/factory/classic-hip-hop/kick.wav', // Use kick as floor tom fallback
        PERC_01: '/assets/kits/factory/classic-hip-hop/hihat-closed.wav',
        PERC_02: '/assets/kits/factory/classic-hip-hop/hihat-open.wav',
        PAD_13: '/assets/kits/factory/classic-hip-hop/snare.wav',
        PAD_14: '/assets/kits/factory/classic-hip-hop/hihat-closed.wav',
        PAD_15: '/assets/kits/factory/classic-hip-hop/hihat-open.wav',
        PAD_16: '/assets/kits/factory/classic-hip-hop/kick.wav'
      }
    };

    // Factory Kit 2: Electronic (Real CC0 samples)
    const electronic: FactoryKit = {
      id: 'electronic',
      name: 'Electronic',
      description: 'Synthetic electronic drum sounds with crisp digital character',
      license: 'CC0',
      credits: 'Archive.org - Patrick Callan Collection',
      samples: {
        KICK: '/assets/kits/factory/electronic/kick.wav',
        SNARE: '/assets/kits/factory/electronic/snare.wav',
        HIHAT_CLOSED: '/assets/kits/factory/electronic/hihat-closed.wav',
        HIHAT_OPEN: '/assets/kits/factory/electronic/hihat-open.wav',
        CLAP: '/assets/kits/factory/electronic/snare.wav', // Use snare as clap fallback
        CRASH: '/assets/kits/factory/electronic/hihat-open.wav', // Use open hi-hat as crash fallback
        RIDE: '/assets/kits/factory/electronic/hihat-closed.wav', // Use closed hi-hat as ride fallback
        TOM_HIGH: '/assets/kits/factory/electronic/snare.wav', // Use snare as tom fallback
        TOM_MID: '/assets/kits/factory/electronic/snare.wav',
        TOM_FLOOR: '/assets/kits/factory/electronic/kick.wav', // Use kick as floor tom fallback
        PERC_01: '/assets/kits/factory/electronic/hihat-closed.wav',
        PERC_02: '/assets/kits/factory/electronic/hihat-open.wav',
        PAD_13: '/assets/kits/factory/electronic/snare.wav',
        PAD_14: '/assets/kits/factory/electronic/hihat-closed.wav',
        PAD_15: '/assets/kits/factory/electronic/hihat-open.wav',
        PAD_16: '/assets/kits/factory/electronic/kick.wav'
      }
    };

    // Factory Kit 3: Acoustic (Real CC0 samples)
    const acoustic: FactoryKit = {
      id: 'acoustic',
      name: 'Acoustic',
      description: 'Natural acoustic drum sounds with organic warmth',
      license: 'CC0',
      credits: 'Archive.org - Patrick Callan Collection',
      samples: {
        KICK: '/assets/kits/factory/acoustic/kick.wav',
        SNARE: '/assets/kits/factory/acoustic/snare.wav',
        HIHAT_CLOSED: '/assets/kits/factory/acoustic/hihat-closed.wav',
        HIHAT_OPEN: '/assets/kits/factory/acoustic/hihat-open.wav',
        CLAP: '/assets/kits/factory/acoustic/snare.wav', // Use snare as clap fallback
        CRASH: '/assets/kits/factory/acoustic/hihat-open.wav', // Use open hi-hat as crash fallback
        RIDE: '/assets/kits/factory/acoustic/hihat-closed.wav', // Use closed hi-hat as ride fallback
        TOM_HIGH: '/assets/kits/factory/acoustic/snare.wav', // Use snare as tom fallback
        TOM_MID: '/assets/kits/factory/acoustic/snare.wav',
        TOM_FLOOR: '/assets/kits/factory/acoustic/kick.wav', // Use kick as floor tom fallback
        PERC_01: '/assets/kits/factory/acoustic/hihat-closed.wav',
        PERC_02: '/assets/kits/factory/acoustic/hihat-open.wav',
        PAD_13: '/assets/kits/factory/acoustic/snare.wav',
        PAD_14: '/assets/kits/factory/acoustic/hihat-closed.wav',
        PAD_15: '/assets/kits/factory/acoustic/hihat-open.wav',
        PAD_16: '/assets/kits/factory/acoustic/kick.wav'
      }
    };

    this.factoryKits.set(classicHipHop.id, classicHipHop);
    this.factoryKits.set(electronic.id, electronic);
    this.factoryKits.set(acoustic.id, acoustic);

    console.log('Factory kits initialized:', Array.from(this.factoryKits.keys()));
  }

  /**
   * Load a sample by URL or factory kit reference
   */
  async loadSample(sampleUrl: string, options?: {
    kitId?: string;
    padName?: PadName;
    preload?: boolean;
  }): Promise<LoadedSample> {
    const startTime = performance.now();
    
    // Check if already cached
    const cached = this.samples.get(sampleUrl);
    if (cached) {
      cached.lastAccessed = Date.now();
      cached.refCount++;
      this.stats.cacheHits++;
      return cached;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(sampleUrl);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading
    this.stats.cacheMisses++;
    const loadPromise = this.doLoadSample(sampleUrl, options);
    this.loadingPromises.set(sampleUrl, loadPromise);

    try {
      const sample = await loadPromise;
      this.stats.loadTimeMs += performance.now() - startTime;
      
      // Add to cache
      this.samples.set(sampleUrl, sample);
      this.updateStats();
      
      // Clean up loading promise
      this.loadingPromises.delete(sampleUrl);
      
      // Manage cache size
      await this.manageCacheSize();
      
      return sample;
      
    } catch (error) {
      this.loadingPromises.delete(sampleUrl);
      throw error;
    }
  }

  /**
   * Actual sample loading implementation
   */
  private async doLoadSample(sampleUrl: string, options?: {
    kitId?: string;
    padName?: PadName;
    preload?: boolean;
  }): Promise<LoadedSample> {
    const context = audioService.getState().context;
    if (!context) {
      throw new Error('AudioContext not available');
    }

    try {
      // Handle different URL types
      let fetchUrl = sampleUrl;
      
      // Handle local asset URLs
      if (sampleUrl.startsWith('/assets/')) {
        fetchUrl = sampleUrl; // Use relative path for Vite dev server and production
      }

      // Fetch audio data
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sample: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      const sample: LoadedSample = {
        id: this.generateSampleId(sampleUrl, options),
        name: this.extractSampleName(sampleUrl),
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        kit: options?.kitId,
        pad: options?.padName,
        loadedAt: Date.now(),
        lastAccessed: Date.now(),
        refCount: 1
      };

      console.log('Sample loaded:', {
        name: sample.name,
        duration: sample.duration.toFixed(3) + 's',
        sampleRate: sample.sampleRate,
        channels: sample.channels,
        memoryMB: (arrayBuffer.byteLength / 1024 / 1024).toFixed(2)
      });

      return sample;
      
    } catch (error) {
      const audioError: AudioError = {
        code: 'SAMPLE_LOAD_FAILED',
        message: `Failed to load sample: ${sampleUrl}`,
        details: error
      };
      console.error('Sample loading failed:', audioError);
      throw audioError;
    }
  }

  /**
   * Load an entire factory kit
   */
  async loadFactoryKit(kitId: string, preload: boolean = false): Promise<Map<PadName, LoadedSample>> {
    const kit = this.factoryKits.get(kitId);
    if (!kit) {
      throw new Error(`Factory kit not found: ${kitId}`);
    }

    const samples = new Map<PadName, LoadedSample>();
    const loadPromises: Promise<void>[] = [];

    for (const [padName, samplePath] of Object.entries(kit.samples)) {
      const promise = this.loadSample(samplePath, {
        kitId,
        padName: padName as PadName,
        preload
      }).then(sample => {
        samples.set(padName as PadName, sample);
      });
      
      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    
    console.log(`Factory kit loaded: ${kit.name} (${samples.size} samples)`);
    return samples;
  }

  /**
   * Get a cached sample
   */
  getSample(sampleUrl: string): LoadedSample | null {
    const sample = this.samples.get(sampleUrl);
    if (sample) {
      sample.lastAccessed = Date.now();
      return sample;
    }
    return null;
  }

  /**
   * Get all available factory kits
   */
  getFactoryKits(): FactoryKit[] {
    return Array.from(this.factoryKits.values());
  }

  /**
   * Get factory content structure
   */
  getFactoryContent(): FactoryContent {
    return {
      kits: this.getFactoryKits(),
      instruments: [] // TODO: Add instruments in future phase
    };
  }

  /**
   * Manage cache size and memory usage
   */
  private async manageCacheSize(): Promise<void> {
    const samples = Array.from(this.samples.values());
    
    // Remove excess samples if cache is too large
    if (samples.length > this.maxCacheSize) {
      // Sort by last accessed time (LRU)
      samples.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      const samplesToRemove = samples.slice(0, samples.length - this.maxCacheSize);
      for (const sample of samplesToRemove) {
        this.removeSample(sample.id);
      }
    }
    
    // Check memory usage
    if (this.stats.totalMemoryMB > this.maxMemoryMB) {
      // Remove oldest samples until under memory limit
      samples.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      for (const sample of samples) {
        this.removeSample(sample.id);
        if (this.stats.totalMemoryMB <= this.maxMemoryMB * 0.8) {
          break;
        }
      }
    }
  }

  /**
   * Remove a sample from cache
   */
  private removeSample(sampleId: string): void {
    for (const [url, sample] of this.samples.entries()) {
      if (sample.id === sampleId) {
        this.samples.delete(url);
        this.updateStats();
        break;
      }
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    const samples = Array.from(this.samples.values());
    this.stats.totalSamples = samples.length;
    
    let totalBytes = 0;
    for (const sample of samples) {
      // Estimate memory usage: channels * length * 4 bytes (Float32)
      totalBytes += sample.buffer.numberOfChannels * sample.buffer.length * 4;
    }
    
    this.stats.totalMemoryMB = totalBytes / 1024 / 1024;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.samples.clear();
    this.loadingPromises.clear();
    this.updateStats();
    console.log('Sample cache cleared');
  }

  /**
   * Preload commonly used samples
   */
  async preloadEssentials(): Promise<void> {
    // Preload the first factory kit
    const firstKit = Array.from(this.factoryKits.keys())[0];
    if (firstKit) {
      await this.loadFactoryKit(firstKit, true);
    }
  }

  // Utility methods
  private generateSampleId(url: string, options?: { kitId?: string; padName?: PadName }): string {
    const base = url.split('/').pop()?.split('.')[0] || 'sample';
    const suffix = options?.kitId && options?.padName ? `${options.kitId}-${options.padName}` : '';
    return `${base}-${suffix}-${Date.now()}`;
  }

  private extractSampleName(url: string): string {
    return url.split('/').pop()?.split('.')[0] || 'Unknown Sample';
  }

  // Singleton pattern
  private static instance: SampleCache | null = null;
  
  static getInstance(): SampleCache {
    if (!SampleCache.instance) {
      SampleCache.instance = new SampleCache();
    }
    return SampleCache.instance;
  }
}

// Export singleton instance
export const sampleCache = SampleCache.getInstance();
export default sampleCache;