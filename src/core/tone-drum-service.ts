// Tone Drum Service
// Professional drum pad playback using Tone.js Sampler with individual channel processing

import Tone from 'tone';
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
        volume: -12, // -12dB to prevent clipping with multiple simultaneous pads
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
   * Initialize individual pad samplers and their processing chains
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

      // Create sampler for this pad
      const sampler = new Tone.Sampler({
        attack: 0.001, // Very fast attack for percussive sounds
        release: 0.1, // Quick release for tight drum sounds
        curve: 'exponential'
      });

      // Connect: Sampler -> Channel -> Master Channel
      sampler.connect(channel);
      channel.connect(this.masterChannel!);

      // Store references
      this.padSamplers.set(padName, sampler);
      this.padChannels.set(padName, channel);
    }

    console.log(`✅ Initialized ${padNames.length} pad samplers with individual channels`);
  }

  /**
   * Get default volume for specific pad types
   */
  private getDefaultPadVolume(padName: PadName): number {
    const volumeMap: { [key: string]: number } = {
      'KICK': -6,        // Prominent but not overpowering
      'SNARE': -8,       // Cutting through mix
      'HIHAT_CLOSED': -12, // Quieter hi-hats
      'HIHAT_OPEN': -10,
      'CLAP': -10,
      'CRASH': -8,       // Impactful but controlled
      'RIDE': -10,
      'TOM_HIGH': -8,
      'TOM_MID': -8,
      'TOM_FLOOR': -6,   // Deeper toms can be louder
      'PERC_01': -12,    // Percussion elements quieter
      'PERC_02': -12,
      'PAD_13': -10,     // Generic pads
      'PAD_14': -10,
      'PAD_15': -10,
      'PAD_16': -10
    };

    return volumeMap[padName] || -10;
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

      // Create new samplers for each pad with the correct sample
      for (const [padName, sampleUrl] of sampleMapping.entries()) {
        const channel = this.padChannels.get(padName);
        if (!channel) continue;

        try {
          // Create a new sampler with the specific sample loaded
          const sampler = new Tone.Sampler({
            urls: {
              'C4': sampleUrl
            },
            attack: 0.001, // Very fast attack for percussive sounds
            release: 0.1, // Quick release for tight drum sounds
            curve: 'exponential'
          });

          // Connect: Sampler -> Channel -> Master Channel
          sampler.connect(channel);

          // Store the new sampler
          if (this.padSamplers.has(padName)) {
            // Dispose old sampler
            this.padSamplers.get(padName)?.dispose();
          }
          this.padSamplers.set(padName, sampler);
          this.padSamples.set(padName, sampleUrl);

          console.log(`✅ Loaded sample for ${padName}: ${sampleUrl}`);

        } catch (error) {
          console.error(`❌ Failed to load sample for ${padName}:`, error);
          // Continue loading other samples even if one fails
        }
      }

      this.playbackState.currentKit = kitId;
      console.log(`✅ Loaded ${sampleMapping.size} samples for kit: ${kitId}`);

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
      sampler.dispose();
    }
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
      console.warn(`No sampler found for pad: ${padName}`);
      return;
    }

    if (!this.padSamples.has(padName)) {
      console.warn(`No sample loaded for pad: ${padName}`);
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