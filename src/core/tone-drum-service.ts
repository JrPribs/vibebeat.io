// Tone Drum Service
// Professional drum pad playback using Tone.js Sampler with individual channel processing

import * as Tone from 'tone';
import type { PadName, Sample, ScheduledEvent } from '../shared/models/index';
import { toneMixerService } from './tone-mixer-service';

// Expose Tone.js globally for debugging and ensure it's loaded
if (typeof window !== 'undefined') {
  (window as any).Tone = Tone;
}

interface PadSamplerConfig {
  padName: PadName;
  samples: string | { [velocity: string]: string };
  baseUrl?: string;
  variations?: string[];
}

interface ToneDrumOptions {
  velocity?: number; // 0-127
  time?: number; // Tone.js time (Tone.now() + offset)
  gain?: number; // 0-1
  pan?: number; // -1 to 1
}

interface DrumPlaybackState {
  isInitialized: boolean;
  currentKit: string | null;
  activePads: Set<PadName>;
  isPlaying: boolean;
}

class ToneDrumService {
  private playbackState: DrumPlaybackState = {
    isInitialized: false,
    currentKit: null,
    activePads: new Set(),
    isPlaying: false
  };

  // Core Tone.js components
  private padSamplers: Map<PadName, Tone.Sampler> = new Map();
  private padChannels: Map<PadName, Tone.Channel> = new Map();
  private masterChannel: Tone.Channel | null = null;

  // Sample management
  private padSamples: Map<PadName, string | { [velocity: string]: string }> = new Map();
  private sampleVariations: Map<PadName, string[]> = new Map();

  // Event listeners
  private padTriggerListeners: ((padName: PadName, velocity: number, time: number) => void)[] = [];
  private patternEventListeners: ((event: ScheduledEvent) => void)[] = [];

  constructor() {
    console.log('ToneDrumService: Initializing...');
  }

  /**
   * Initialize the Tone.js drum system
   */
  async initialize(): Promise<void> {
    try {
      // Ensure Tone.js context is running
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Create master channel for all drum pads
      this.masterChannel = new Tone.Channel({
        volume: 0, // 0dB - let users control volume via UI controls
        pan: 0,
        mute: false,
        solo: false
      });

      // Connect to master bus through ToneMixerService
      await toneMixerService.initialize();
      this.masterChannel.connect(toneMixerService.getMasterBus());

      // Initialize individual pad samplers and channels
      await this.initializePadSamplers();

      this.playbackState.isInitialized = true;
      console.log('✅ ToneDrumService initialized successfully');

    } catch (error) {
      console.error('❌ ToneDrumService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize individual pad channels (samplers will be created when samples are loaded)
   */
  private async initializePadSamplers(): Promise<void> {
    const padNames: PadName[] = [
      'KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN',
      'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH',
      'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02',
      'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16'
    ];

    for (const padName of padNames) {
      // Create individual channel for this pad with appropriate settings
      const channel = new Tone.Channel({
        volume: this.getDefaultPadVolume(padName),
        pan: this.getDefaultPadPan(padName),
        mute: false,
        solo: false
      });

      // Connect channel to master channel
      channel.connect(this.masterChannel!);

      // Store channel reference (samplers will be created when samples are loaded)
      this.padChannels.set(padName, channel);
    }

    console.log(`✅ Initialized ${padNames.length} pad channels (samplers will be created when samples are loaded)`);
  }

  /**
   * Get default volume for specific pad types
   * All pads now default to 0dB - users can adjust via UI controls
   */
  private getDefaultPadVolume(padName: PadName): number {
    // Return 0dB for all pads - let users control volume themselves
    // No more assumptions about relative volumes
    return 0;
  }

  /**
   * Get default pan position for specific pad types (stereo placement)
   */
  private getDefaultPadPan(padName: PadName): number {
    const panMap: { [key: string]: number } = {
      'KICK': 0,         // Center - foundation
      'SNARE': 0,        // Center - main backbeat
      'HIHAT_CLOSED': 0.3,  // Slightly right
      'HIHAT_OPEN': 0.3,    // Slightly right  
      'CLAP': -0.2,      // Slightly left
      'CRASH': 0.5,      // Right side
      'RIDE': 0.4,       // Right side
      'TOM_HIGH': -0.3,  // Left side (traditional kit layout)
      'TOM_MID': -0.1,   // Slightly left
      'TOM_FLOOR': 0.2,  // Slightly right
      'PERC_01': -0.4,   // Left side
      'PERC_02': 0.4,    // Right side
      'PAD_13': -0.2,    // Spread generics across stereo field
      'PAD_14': 0.2,
      'PAD_15': -0.1,
      'PAD_16': 0.1
    };

    return panMap[padName] || 0;
  }

  /**
   * Load samples for a specific kit
   */
  async loadKitSamples(kitId: string, sampleMapping: Map<PadName, string>): Promise<void> {
    try {
      console.log(`🔄 Loading Tone.js kit: ${kitId}`);

      // Clear current samples
      this.clearCurrentSamples();

      // Load samples in parallel with proper async handling
      const loadPromises = Array.from(sampleMapping.entries()).map(async ([padName, sampleUrl]) => {
        const channel = this.padChannels.get(padName);
        if (!channel) return { padName, success: false, error: 'No channel found' };

        try {
          // Properly dispose old sampler if it exists
          if (this.padSamplers.has(padName)) {
            const oldSampler = this.padSamplers.get(padName);
            if (oldSampler) {
              oldSampler.disconnect();
              oldSampler.dispose();
            }
          }

          // Create a new sampler with the specific sample loaded
          const sampler = new Tone.Sampler({
            urls: {
              'C4': sampleUrl
            },
            attack: 0.001, // Very fast attack for percussive sounds
            release: 0.1, // Quick release for tight drum sounds
            curve: 'exponential',
            onload: () => {
              console.log(`✅ Sample loaded for ${padName}`);
            },
            onerror: (error) => {
              console.warn(`⚠️ Sample failed to load for ${padName}:`, error);
            }
          });

          // Connect: Sampler -> Channel (channel already connected to master)
          sampler.connect(channel);

          // Store the new sampler and sample URL
          this.padSamplers.set(padName, sampler);
          this.padSamples.set(padName, sampleUrl);

          return { padName, success: true };

        } catch (error) {
          console.warn(`⚠️ Failed to create sampler for ${padName}:`, error);
          return { padName, success: false, error: error.message };
        }
      });

      // Wait for all samples to load
      const results = await Promise.all(loadPromises);
      const successfulPads = results.filter(result => result?.success).map(r => r?.padName);
      const failedPads = results.filter(result => !result?.success).map(r => r?.padName);
      
      console.log(`🥁 Kit ${kitId} loaded: ${successfulPads.length}/16 pads`);
      if (successfulPads.length > 0) {
        console.log(`✅ Active pads: ${successfulPads.join(', ')}`);
      }
      if (failedPads.length > 0) {
        console.log(`⭕ Empty pads: ${failedPads.join(', ')}`);
      }

      this.playbackState.currentKit = kitId;

    } catch (error) {
      console.error('❌ Failed to load kit samples:', error);
      throw error;
    }
  }

  /**
   * Clear currently loaded samples
   */
  private clearCurrentSamples(): void {
    for (const sampler of this.padSamplers.values()) {
      sampler.disconnect();
      sampler.dispose();
    }
    this.padSamplers.clear();
    this.padSamples.clear();
    this.sampleVariations.clear();
  }

  /**
   * Trigger a drum pad with Tone.js
   */
  async triggerPad(padName: PadName, velocity: number = 127, options: ToneDrumOptions = {}): Promise<void> {
    if (!this.playbackState.isInitialized) {
      console.warn('ToneDrumService not initialized');
      return;
    }

    // Ensure Tone.js context is running
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    const sampler = this.padSamplers.get(padName);
    if (!sampler) {
      // Silently return for missing samples - incomplete kits are normal
      return;
    }

    if (!this.padSamples.has(padName)) {
      // Silently return for missing samples - incomplete kits are normal
      return;
    }

    // Check if the sampler actually has a loaded buffer
    if (!sampler.loaded) {
      console.warn(`Sampler for ${padName} is not loaded yet`);
      return;
    }

    try {
      // Calculate timing
      const when = options.time ? Tone.Time(options.time) : Tone.now();
      
      // Convert MIDI velocity to linear amplitude (0-1)
      const velocityGain = velocity / 127;
      
      // Apply additional gain if specified
      const finalGain = velocityGain * (options.gain || 1.0);
      
      // Trigger the sample with velocity
      // Note: 'C4' is our standard mapping for drum samples
      sampler.triggerAttack('C4', when, finalGain);
      
      // Apply temporary pan if specified
      if (options.pan !== undefined) {
        const channel = this.padChannels.get(padName);
        if (channel) {
          const currentPan = channel.pan.value;
          channel.pan.rampTo(options.pan, 0.001, when);
          // Reset pan after a short time
          const resetTime = Tone.Time(when).toSeconds() + 0.1;
          channel.pan.rampTo(currentPan, 0.1, resetTime);
        }
      }

      // Track active pad
      this.playbackState.activePads.add(padName);
      
      // Schedule cleanup
      const cleanupTime = Tone.Time(when).toSeconds() + 2;
      Tone.getTransport().scheduleOnce(() => {
        this.playbackState.activePads.delete(padName);
      }, cleanupTime); // Remove from active after 2 seconds max

      // Notify listeners
      this.padTriggerListeners.forEach(listener => {
        listener(padName, velocity, Tone.Time(when).toSeconds());
      });

      console.log(`🥁 Triggered ${padName} with velocity ${velocity} at time ${when}`);

    } catch (error) {
      console.error(`❌ Failed to trigger pad ${padName}:`, error);
    }
  }

  /**
   * Set pad-specific gain
   */
  setPadGain(padName: PadName, gain: number): void {
    const channel = this.padChannels.get(padName);
    if (!channel) return;

    const clampedGain = Math.max(0, Math.min(1, gain));
    const dbGain = 20 * Math.log10(clampedGain || 0.001); // Convert to dB, avoid log(0)
    channel.volume.rampTo(dbGain, 0.1);
  }

  /**
   * Set pad-specific panning
   */
  setPadPan(padName: PadName, pan: number): void {
    const channel = this.padChannels.get(padName);
    if (!channel) return;

    const clampedPan = Math.max(-1, Math.min(1, pan));
    channel.pan.rampTo(clampedPan, 0.1);
  }

  /**
   * Set master drum output gain
   */
  setMasterGain(gain: number): void {
    if (!this.masterChannel) return;

    const clampedGain = Math.max(0, Math.min(1, gain));
    const dbGain = 20 * Math.log10(clampedGain || 0.001);
    this.masterChannel.volume.rampTo(dbGain, 0.1);
  }

  /**
   * Check if a pad has a loaded sample
   */
  hasPadSample(padName: PadName): boolean {
    return this.padSamples.has(padName);
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): DrumPlaybackState {
    return {
      ...this.playbackState,
      activePads: new Set(this.playbackState.activePads)
    };
  }

  /**
   * Get loaded pad samples
   */
  getPadSamples(): Map<PadName, string | { [velocity: string]: string }> {
    return new Map(this.padSamples);
  }

  /**
   * Get Tone.js sampler for a specific pad (for advanced manipulation)
   */
  getPadSampler(padName: PadName): Tone.Sampler | undefined {
    return this.padSamplers.get(padName);
  }

  /**
   * Get Tone.js channel for a specific pad (for effects, EQ, etc.)
   */
  getPadChannel(padName: PadName): Tone.Channel | undefined {
    return this.padChannels.get(padName);
  }

  /**
   * Get master drum channel (for global drum effects)
   */
  getMasterChannel(): Tone.Channel | null {
    return this.masterChannel;
  }

  // Event listener management
  onPadTrigger(listener: (padName: PadName, velocity: number, time: number) => void): () => void {
    this.padTriggerListeners.push(listener);
    return () => {
      const index = this.padTriggerListeners.indexOf(listener);
      if (index > -1) this.padTriggerListeners.splice(index, 1);
    };
  }

  onPatternEvent(listener: (event: ScheduledEvent) => void): () => void {
    this.patternEventListeners.push(listener);
    return () => {
      const index = this.patternEventListeners.indexOf(listener);
      if (index > -1) this.patternEventListeners.splice(index, 1);
    };
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void {
    try {
      for (const sampler of this.padSamplers.values()) {
        sampler.releaseAll();
      }
      this.playbackState.activePads.clear();
      console.log('🛑 Stopped all drum sounds');
    } catch (error) {
      console.error('❌ Failed to stop all sounds:', error);
    }
  }

  /**
   * Dispose of the service and clean up Tone.js resources
   */
  dispose(): void {
    try {
      // Dispose of all samplers
      for (const sampler of this.padSamplers.values()) {
        sampler.dispose();
      }

      // Dispose of all channels
      for (const channel of this.padChannels.values()) {
        channel.dispose();
      }

      // Dispose of master channel
      if (this.masterChannel) {
        this.masterChannel.dispose();
        this.masterChannel = null;
      }

      // Clear all maps and state
      this.padSamplers.clear();
      this.padChannels.clear();
      this.padSamples.clear();
      this.sampleVariations.clear();
      this.playbackState.activePads.clear();

      // Clear listeners
      this.padTriggerListeners = [];
      this.patternEventListeners = [];

      this.playbackState.isInitialized = false;
      console.log('🗑️ ToneDrumService disposed successfully');

    } catch (error) {
      console.error('❌ Failed to dispose ToneDrumService:', error);
    }
  }

  // Singleton pattern
  private static instance: ToneDrumService | null = null;

  static getInstance(): ToneDrumService {
    if (!ToneDrumService.instance) {
      ToneDrumService.instance = new ToneDrumService();
    }
    return ToneDrumService.instance;
  }
}

// Export singleton instance
export const toneDrumService = ToneDrumService.getInstance();
export default toneDrumService;