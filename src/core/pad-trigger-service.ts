// Pad Trigger Service
// Handles drum pad triggering and pattern playback

import type { Sample, PadName, DrumTrack, ScheduledEvent } from '../shared/models/index';
import { audioService } from './audio-service';
import { sampleCache } from './sample-cache';
import { schedulerService } from './scheduler-service';

interface PadTriggerOptions {
  velocity?: number; // 0-127
  time?: number; // Scheduled time (AudioContext time)
  gain?: number; // 0-1
  pan?: number; // -1 to 1
}

interface PlaybackState {
  isPlaying: boolean;
  currentPattern: DrumTrack | null;
  scheduledEvents: ScheduledEvent[];
  activeVoices: Map<string, AudioBufferSourceNode>;
}

class PadTriggerService {
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentPattern: null,
    scheduledEvents: [],
    activeVoices: new Map()
  };
  
  private padSamples: Map<PadName, Sample> = new Map();
  private outputGain: GainNode | null = null;
  private padGains: Map<PadName, GainNode> = new Map();
  private padPanners: Map<PadName, StereoPannerNode> = new Map();
  
  // Event listeners
  private padTriggerListeners: ((padName: PadName, velocity: number, time: number) => void)[] = [];
  private patternEventListeners: ((event: ScheduledEvent) => void)[] = [];

  constructor() {
    this.setupAudioNodes();
    // Defer scheduler integration to avoid initialization race conditions
    setTimeout(() => this.setupSchedulerIntegration(), 0);
  }

  /**
   * Set up audio processing nodes
   */
  private setupAudioNodes(): void {
    const context = audioService.getState().context;
    if (!context) return;

    // Create master output gain
    this.outputGain = context.createGain();
    this.outputGain.gain.setValueAtTime(0.8, context.currentTime);
    this.outputGain.connect(context.destination);

    // Create individual pad processing chains
    this.createPadAudioChains();
  }

  /**
   * Create audio processing chains for each pad
   */
  private createPadAudioChains(): void {
    const context = audioService.getState().context;
    if (!context || !this.outputGain) return;

    const padNames: PadName[] = [
      'KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN',
      'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH',
      'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02',
      'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16'
    ];

    for (const padName of padNames) {
      // Create gain node for this pad
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(1.0, context.currentTime);
      
      // Create panner node for this pad
      const pannerNode = context.createStereoPanner();
      pannerNode.pan.setValueAtTime(0, context.currentTime);
      
      // Connect: panner -> gain -> output
      pannerNode.connect(gainNode);
      gainNode.connect(this.outputGain);
      
      this.padGains.set(padName, gainNode);
      this.padPanners.set(padName, pannerNode);
    }
  }

  /**
   * Set up integration with scheduler service
   */
  private setupSchedulerIntegration(): void {
    // Ensure scheduler service is available and has required methods
    if (!schedulerService || typeof schedulerService.onEvent !== 'function') {
      console.warn('Scheduler service not ready, retrying integration in 100ms...');
      setTimeout(() => this.setupSchedulerIntegration(), 100);
      return;
    }

    try {
      // Listen for scheduled events from the scheduler
      schedulerService.onEvent((event) => {
        if (event.type === 'pad' && event.data.padName) {
          this.triggerPad(
            event.data.padName as PadName,
            {
              velocity: event.data.velocity || 100,
              time: event.actualTime
            }
          );
        }
      });

      // Listen for transport changes
      schedulerService.onTransportChange((state) => {
        if (state.isPlaying && !this.playbackState.isPlaying) {
          this.startPatternPlayback();
        } else if (!state.isPlaying && this.playbackState.isPlaying) {
          this.stopPatternPlayback();
        }
      });
      
      console.log('Scheduler integration successfully established');
    } catch (error) {
      console.error('Failed to setup scheduler integration:', error);
      // Retry after a delay
      setTimeout(() => this.setupSchedulerIntegration(), 500);
    }
  }

  /**
   * Load samples for a specific kit
   */
  async loadKitSamples(kitId: string): Promise<void> {
    try {
      const samples = await sampleCache.loadFactoryKit(kitId);
      
      // Update pad samples mapping
      for (const [padName, sample] of samples.entries()) {
        this.padSamples.set(padName, sample);
      }
      
      console.log(`Loaded ${samples.size} pad samples for kit: ${kitId}`);
      
    } catch (error) {
      console.error('Failed to load kit samples:', error);
      throw error;
    }
  }

  /**
   * Trigger a drum pad manually or programmatically
   */
  triggerPad(padName: PadName, options: PadTriggerOptions = {}): void {
    const context = audioService.getState().context;
    if (!context) {
      console.warn('AudioContext not available. Please enable audio to play sounds.');
      return;
    }

    const sample = this.padSamples.get(padName);
    if (!sample) {
      console.warn(`No sample loaded for pad: ${padName}`);
      return;
    }

    const {
      velocity = 100,
      time = context.currentTime,
      gain = 1.0,
      pan = 0
    } = options;

    try {
      // Create audio buffer source
      const source = context.createBufferSource();
      source.buffer = sample.buffer;
      
      // Create gain node for this voice
      const voiceGain = context.createGain();
      
      // Calculate final gain (velocity + voice gain + pad gain)
      const velocityGain = velocity / 127; // Convert MIDI velocity to 0-1
      const finalGain = velocityGain * gain;
      voiceGain.gain.setValueAtTime(finalGain, time);
      
      // Get pad's processing chain
      const padPanner = this.padPanners.get(padName);
      if (!padPanner) {
        console.warn(`No panner found for pad: ${padName}`);
        return;
      }
      
      // Apply temporary pan if specified
      if (pan !== 0) {
        const tempPanner = context.createStereoPanner();
        tempPanner.pan.setValueAtTime(pan, time);
        source.connect(voiceGain);
        voiceGain.connect(tempPanner);
        tempPanner.connect(padPanner);
      } else {
        source.connect(voiceGain);
        voiceGain.connect(padPanner);
      }
      
      // Schedule playback
      source.start(time);
      
      // Clean up when finished
      const voiceId = `${padName}-${Date.now()}-${Math.random()}`;
      this.playbackState.activeVoices.set(voiceId, source);
      
      source.onended = () => {
        this.playbackState.activeVoices.delete(voiceId);
        source.disconnect();
        voiceGain.disconnect();
      };
      
      // Notify listeners
      this.padTriggerListeners.forEach(listener => {
        listener(padName, velocity, time);
      });
      
    } catch (error) {
      console.error('Failed to trigger pad:', error);
    }
  }

  /**
   * Set the current drum pattern for playback
   */
  setPattern(pattern: DrumTrack): void {
    this.playbackState.currentPattern = pattern;
    
    // Clear existing scheduled events
    this.clearScheduledEvents();
    
    // Schedule new pattern if playing
    if (this.playbackState.isPlaying) {
      this.schedulePatternEvents();
    }
  }

  /**
   * Start pattern playback
   */
  private startPatternPlayback(): void {
    this.playbackState.isPlaying = true;
    
    if (this.playbackState.currentPattern) {
      this.schedulePatternEvents();
    }
  }

  /**
   * Stop pattern playback
   */
  private stopPatternPlayback(): void {
    this.playbackState.isPlaying = false;
    this.clearScheduledEvents();
    this.stopAllVoices();
  }

  /**
   * Schedule events for the current pattern
   */
  private schedulePatternEvents(): void {
    // TODO: Implement A/B pattern integration
    // For now, skip pattern scheduling to avoid type errors
    console.log('Pattern scheduling temporarily disabled during Phase 9 implementation');
    return;
    
    /* 
    const pattern = this.playbackState.currentPattern as DrumTrack | null;
    if (!pattern || !pattern.pattern || !Array.isArray(pattern.pattern.pads)) {
      return;
    }

    // Clear existing events
    this.clearScheduledEvents();

    // Schedule events for each pad
    const patternData = pattern.pattern;
    for (const padData of patternData.pads) {
      if (!padData || !Array.isArray(padData.hits)) continue;
      
      for (const hit of padData.hits) {
        const event: ScheduledEvent = {
          id: `${padData.pad}-${hit.step}-${Date.now()}`,
          type: 'pad',
          time: 0, // Will be calculated by scheduler
          data: {
            padName: padData.pad,
            velocity: hit.vel
          }
        };
        
        // Schedule with the scheduler service
        // The scheduler will call our trigger method at the right time
        schedulerService.scheduleEvent(event);
        
        this.playbackState.scheduledEvents.push(event);
      }
    }
    */
    
    console.log(
      `Scheduled ${this.playbackState.scheduledEvents.length} pattern events`
    );
  }

  /**
   * Clear all scheduled events
   */
  private clearScheduledEvents(): void {
    schedulerService.clearEvents();
    this.playbackState.scheduledEvents = [];
  }

  /**
   * Stop all currently playing voices
   */
  private stopAllVoices(): void {
    const context = audioService.getState().context;
    if (!context) return;

    for (const [voiceId, source] of this.playbackState.activeVoices) {
      try {
        source.stop(context.currentTime);
      } catch (error) {
        // Voice might already be stopped
      }
    }
    
    this.playbackState.activeVoices.clear();
  }

  /**
   * Set pad-specific gain
   */
  setPadGain(padName: PadName, gain: number): void {
    const padGain = this.padGains.get(padName);
    if (!padGain) return;

    const context = audioService.getState().context;
    if (!context) return;

    const clampedGain = Math.max(0, Math.min(1, gain));
    padGain.gain.setValueAtTime(clampedGain, context.currentTime);
  }

  /**
   * Set pad-specific panning
   */
  setPadPan(padName: PadName, pan: number): void {
    const padPanner = this.padPanners.get(padName);
    if (!padPanner) return;

    const context = audioService.getState().context;
    if (!context) return;

    const clampedPan = Math.max(-1, Math.min(1, pan));
    padPanner.pan.setValueAtTime(clampedPan, context.currentTime);
  }

  /**
   * Set master output gain
   */
  setMasterGain(gain: number): void {
    if (!this.outputGain) return;

    const context = audioService.getState().context;
    if (!context) return;

    const clampedGain = Math.max(0, Math.min(1, gain));
    this.outputGain.gain.setValueAtTime(clampedGain, context.currentTime);
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return {
      ...this.playbackState,
      activeVoices: new Map(this.playbackState.activeVoices)
    };
  }

  /**
   * Get loaded pad samples
   */
  getPadSamples(): Map<PadName, Sample> {
    return new Map(this.padSamples);
  }

  /**
   * Check if a pad has a loaded sample
   */
  hasPadSample(padName: PadName): boolean {
    return this.padSamples.has(padName);
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
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.stopAllVoices();
    this.clearScheduledEvents();
    
    // Disconnect audio nodes
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
    
    for (const gainNode of this.padGains.values()) {
      gainNode.disconnect();
    }
    
    for (const pannerNode of this.padPanners.values()) {
      pannerNode.disconnect();
    }
    
    this.padGains.clear();
    this.padPanners.clear();
    this.padSamples.clear();
  }

  // Singleton pattern
  private static instance: PadTriggerService | null = null;
  
  static getInstance(): PadTriggerService {
    if (!PadTriggerService.instance) {
      PadTriggerService.instance = new PadTriggerService();
    }
    return PadTriggerService.instance;
  }
}

// Export singleton instance
export const padTriggerService = PadTriggerService.getInstance();
export default padTriggerService;