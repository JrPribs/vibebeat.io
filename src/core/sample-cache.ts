// Sample Cache
// Efficient loading and caching of audio samples with factory kit support

import type { Sample, FactoryKit, FactoryContent, PadName, AudioError } from '../shared/models/index';
import { audioService } from './audio-service';
import { getDrumSample, getAllDrumSamples } from '../lib/audio/DrumSamples';
import { musicRadarKitLoader, type MusicRadarKit } from './musicradar-kit-loader';

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
  private musicRadarKits: Map<string, MusicRadarKit> = new Map();
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
    const context = audioService.getAudioContext();
    if (!context) {
      throw new Error('AudioContext not available. Please enable audio first.');
    }

    try {
      // Handle different URL types
      let fetchUrl = sampleUrl;
      
      // Handle local asset URLs
      if (sampleUrl.startsWith('/assets/')) {
        fetchUrl = sampleUrl; // Use relative path for Vite dev server and production
      }

      // Try to fetch audio data first
      let audioBuffer: AudioBuffer | null = null;
      
      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          
          // More robust audio decoding with fallback
          try {
            audioBuffer = await context.decodeAudioData(arrayBuffer);
          } catch (decodeError) {
            // Try again with a copy of the array buffer (some browsers require this)
            try {
              audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
            } catch (retryError) {
              console.warn(`Failed to decode audio data for ${sampleUrl}:`, decodeError);
              audioBuffer = null;
            }
          }
        }
      } catch (fetchError) {
        console.warn(`Failed to fetch sample ${sampleUrl}:`, fetchError);
      }
      
      // If file loading failed, use programmatic synthesis
      if (!audioBuffer && options?.padName) {
        console.log(`Using programmatic synthesis for ${options.padName}`);
        audioBuffer = await this.generateProgrammaticSample(options.padName, context);
      }
      
      // Final fallback to generic synthesis
      if (!audioBuffer) {
        console.log(`Using generic synthesis for ${sampleUrl}`);
        audioBuffer = await this.generateSyntheticSampleFromUrl(sampleUrl, context);
      }

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
        source: audioBuffer ? 'programmatic' : 'file'
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
   * Generate programmatic drum sample using Web Audio API synthesis
   */
  private async generateProgrammaticSample(padName: PadName, context: AudioContext): Promise<AudioBuffer> {
    // Map PadName to drum sample names
    const drumSampleMap: Record<PadName, string> = {
      'KICK': 'kick',
      'SNARE': 'snare', 
      'HIHAT_CLOSED': 'hihat',
      'HIHAT_OPEN': 'openhat',
      'CLAP': 'snare', // Use snare synthesis for clap
      'CRASH': 'crash',
      'RIDE': 'hihat', // Use hihat synthesis for ride
      'TOM_HIGH': 'kick', // Use kick synthesis with higher frequency
      'TOM_MID': 'kick',
      'TOM_FLOOR': 'kick',
      'PERC_01': 'hihat',
      'PERC_02': 'openhat',
      'PAD_13': 'kick',
      'PAD_14': 'snare',
      'PAD_15': 'hihat',
      'PAD_16': 'openhat'
    };
    
    const sampleName = drumSampleMap[padName] || 'kick';
    const drumSample = getDrumSample(sampleName);
    
    if (!drumSample) {
      throw new Error(`No drum sample found for ${sampleName}`);
    }
    
    // Create a temporary destination to capture the synthesized audio
    const offlineContext = new OfflineAudioContext(
      1, // mono
      context.sampleRate * 2, // 2 seconds max duration
      context.sampleRate
    );
    
    // Trigger the drum sample in the offline context
    drumSample.trigger(offlineContext, offlineContext.destination, 1.0);
    
    // Render the audio
    const renderedBuffer = await offlineContext.startRendering();
    
    // Trim the buffer to remove silence at the end
    return this.trimSilence(renderedBuffer, context);
  }
  
  /**
   * Generate synthetic sample for development/demo purposes (legacy fallback)
   */
  private async generateSyntheticSampleFromUrl(sampleUrl: string, context: AudioContext): Promise<AudioBuffer> {
    // Determine sample type from URL
    const filename = sampleUrl.split('/').pop() || '';
    const padType = filename.split('.')[0];
    
    // Generate synthetic audio based on pad type
    const duration = this.getSyntheticDuration(padType);
    const sampleRate = context.sampleRate;
    const channels = 1; // Mono for drums
    const length = Math.floor(duration * sampleRate);
    
    const audioBuffer = context.createBuffer(channels, length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Generate waveform based on drum type
    this.generateWaveform(channelData, padType, sampleRate);
    
    return audioBuffer;
  }
  
  /**
   * Trim silence from the end of an audio buffer
   */
  private trimSilence(sourceBuffer: AudioBuffer, context: AudioContext): AudioBuffer {
    const channelData = sourceBuffer.getChannelData(0);
    let endIndex = channelData.length - 1;
    
    // Find the last non-silent sample (threshold: 0.001)
    while (endIndex > 0 && Math.abs(channelData[endIndex]) < 0.001) {
      endIndex--;
    }
    
    // Add a small fade-out to prevent clicks
    const fadeLength = Math.min(1000, endIndex * 0.1); // 10% of sound or 1000 samples
    endIndex = Math.min(endIndex + fadeLength, channelData.length - 1);
    
    // Create trimmed buffer
    const trimmedLength = endIndex + 1;
    const trimmedBuffer = context.createBuffer(
      sourceBuffer.numberOfChannels,
      trimmedLength,
      sourceBuffer.sampleRate
    );
    
    // Copy and apply fade-out
    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
      const sourceData = sourceBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < trimmedLength; i++) {
        let sample = sourceData[i];
        
        // Apply fade-out in the last 10%
        if (i > trimmedLength - fadeLength) {
          const fadeProgress = (trimmedLength - i) / fadeLength;
          sample *= fadeProgress;
        }
        
        trimmedData[i] = sample;
      }
    }
    
    return trimmedBuffer;
  }

  /**
   * Generate waveform for synthetic samples
   */
  private generateWaveform(channelData: Float32Array, padType: string, sampleRate: number): void {
    const length = channelData.length;
    
    if (padType.includes('kick')) {
      // Low frequency sine wave with exponential decay
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 8);
        channelData[i] = Math.sin(2 * Math.PI * 60 * t) * decay * 0.8;
      }
    } else if (padType.includes('snare')) {
      // White noise with envelope
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 15);
        const noise = (Math.random() * 2 - 1) * decay;
        const tone = Math.sin(2 * Math.PI * 200 * t) * decay * 0.3;
        channelData[i] = (noise + tone) * 0.6;
      }
    } else if (padType.includes('hihat')) {
      // High frequency noise
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 20);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.4;
      }
    } else if (padType.includes('clap')) {
      // Multiple short bursts
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const burst1 = t < 0.01 ? (Math.random() * 2 - 1) * Math.exp(-t * 100) : 0;
        const burst2 = (t > 0.02 && t < 0.03) ? (Math.random() * 2 - 1) * Math.exp(-(t - 0.02) * 100) : 0;
        const burst3 = (t > 0.04 && t < 0.05) ? (Math.random() * 2 - 1) * Math.exp(-(t - 0.04) * 100) : 0;
        channelData[i] = (burst1 + burst2 + burst3) * 0.5;
      }
    } else {
      // Generic drum sound (tom, crash, etc.)
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 5);
        const freq = padType.includes('tom') ? 120 : padType.includes('crash') ? 4000 : 300;
        channelData[i] = Math.sin(2 * Math.PI * freq * t) * decay * 0.5;
      }
    }
  }

  /**
   * Get synthetic sample duration based on type
   */
  private getSyntheticDuration(padType: string): number {
    if (padType.includes('kick')) return 0.8;
    if (padType.includes('snare')) return 0.3;
    if (padType.includes('hihat')) return 0.1;
    if (padType.includes('clap')) return 0.15;
    if (padType.includes('crash')) return 2.0;
    if (padType.includes('tom')) return 0.6;
    return 0.5; // Default
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
   * Load an entire MusicRadar kit
   */
  async loadMusicRadarKit(kitId: string, preload: boolean = false): Promise<Map<PadName, LoadedSample>> {
    try {
      // Load kit data from MusicRadar kit loader
      const kit = await musicRadarKitLoader.loadKit(kitId);
      if (!kit) {
        throw new Error(`MusicRadar kit not found: ${kitId}`);
      }

      // Cache the kit data
      this.musicRadarKits.set(kitId, kit);

      const samples = new Map<PadName, LoadedSample>();
      const loadPromises: Promise<void>[] = [];

      // Load each sample
      for (const [padName, sampleData] of Object.entries(kit.samples)) {
        if (!sampleData || !sampleData.primary) continue;

        const promise = this.loadSample(sampleData.primary, {
          kitId,
          padName: padName as PadName,
          preload
        }).then(sample => {
          samples.set(padName as PadName, sample);
        }).catch(error => {
          console.warn(`Failed to load ${padName} from MusicRadar kit ${kitId}:`, error);
          // Don't fail the entire kit load if one sample fails
        });
        
        loadPromises.push(promise);
      }

      await Promise.all(loadPromises);
      
      console.log(`✅ MusicRadar kit loaded: ${kit.name} (${samples.size} samples)`);
      return samples;

    } catch (error) {
      console.error(`❌ Failed to load MusicRadar kit ${kitId}:`, error);
      throw error;
    }
  }

  /**
   * Get MusicRadar kit sample mapping for Tone.js
   */
  async getMusicRadarKitSamples(kitId: string): Promise<Map<PadName, string> | null> {
    try {
      return await musicRadarKitLoader.generateKitSampleMapping(kitId);
    } catch (error) {
      console.error(`Failed to get MusicRadar kit samples for ${kitId}:`, error);
      return null;
    }
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
   * Get all available MusicRadar kits
   */
  getMusicRadarKits(): MusicRadarKit[] {
    return musicRadarKitLoader.getAvailableKits();
  }

  /**
   * Get MusicRadar kits by category
   */
  getMusicRadarKitsByCategory(category: 'acoustic' | 'electronic' | 'vinyl' | 'electro'): MusicRadarKit[] {
    return musicRadarKitLoader.getKitsByCategory(category);
  }

  /**
   * Search MusicRadar kits
   */
  searchMusicRadarKits(query: string): MusicRadarKit[] {
    return musicRadarKitLoader.searchKits(query);
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
        this.removeSampleById(sample.id);
      }
    }
    
    // Check memory usage
    if (this.stats.totalMemoryMB > this.maxMemoryMB) {
      // Remove oldest samples until under memory limit
      samples.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      for (const sample of samples) {
        this.removeSampleById(sample.id);
        if (this.stats.totalMemoryMB <= this.maxMemoryMB * 0.8) {
          break;
        }
      }
    }
  }

  /**
   * Remove a sample from cache by ID
   */
  private removeSampleById(sampleId: string): void {
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

  // Legacy compatibility method
  async loadSampleBuffer(url: string): Promise<AudioBuffer> {
    const sample = await this.loadSample(url);
    return sample.buffer;
  }

  hasSample(url: string): boolean {
    return this.samples.has(url);
  }

  isLoading(url: string): boolean {
    return this.loadingPromises.has(url);
  }

  getCacheSize(): number {
    return this.samples.size;
  }

  getLoadingCount(): number {
    return this.loadingPromises.size;
  }

  removeSample(url: string): boolean {
    return this.samples.delete(url);
  }

  getCacheInfo(): { url: string; duration: number; channels: number }[] {
    return Array.from(this.samples.entries()).map(([url, sample]) => ({
      url,
      duration: sample.duration,
      channels: sample.channels
    }));
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