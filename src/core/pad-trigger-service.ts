// Pad Trigger Service
// Handles drum pad triggering and pattern playback

import type { Sample, PadName, DrumTrack, ScheduledEvent } from '../shared/models/index';
import { audioService } from './audio-service';
import { sampleCache } from './sample-cache';
import { toneDrumService } from './tone-drum-service';

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
  currentKit: string | null;
}

class PadTriggerService {
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentPattern: null,
    scheduledEvents: [],
    currentKit: null
  };
  
  // Legacy properties removed - now using pure Tone.js architecture
  
  // Event listeners
  private padTriggerListeners: ((padName: PadName, velocity: number, time: number) => void)[] = [];
  private patternEventListeners: ((event: ScheduledEvent) => void)[] = [];

  constructor() {
    console.log('PadTriggerService: Initializing with Tone.js integration');
    
    // Initialize Tone.js drum service
    this.initializeToneJsService();
    
    // Legacy Web Audio API nodes removed - using pure Tone.js architecture
    
    // Scheduler integration removed - using pure Tone.js architecture
    
    // Audio service integration no longer needed - using pure Tone.js architecture
  }

  /**
   * Initialize Tone.js drum service
   */
  private async initializeToneJsService(): Promise<void> {
    try {
      await toneDrumService.initialize();
      console.log('✅ PadTriggerService: Tone.js integration ready');
      
      // Load a default MusicRadar kit
      await this.loadMusicRadarKit('musicradar-acoustic-01-close');
      
      // Notify that samples are loaded and UI should update
      this.notifyStateChange();
      
    } catch (error) {
      console.error('❌ PadTriggerService: Tone.js initialization failed:', error);
      throw error;
    }
  }

  /**
   * All audio processing is now handled by Tone.js services
   * Legacy AudioContext setup methods removed
   */

  /**
   * Scheduler integration removed - pattern playback now handled by ToneTransportService
   */

  /**
   * Load samples for a specific kit using Tone.js
   * Legacy factory kit loading replaced with MusicRadar kits
   */
  async loadKit(kitId: string): Promise<void> {
    return this.loadMusicRadarKit(kitId);
  }

  /**
   * Load MusicRadar kit with Tone.js integration
   */
  async loadMusicRadarKit(kitId: string): Promise<void> {
    try {
      // Get sample mapping from cache/loader
      const sampleMapping = await sampleCache.getMusicRadarKitSamples(kitId);
      if (!sampleMapping) {
        throw new Error(`Failed to get sample mapping for kit: ${kitId}`);
      }

      // Load samples into Tone.js drum service
      await toneDrumService.loadKitSamples(kitId, sampleMapping);
      
      this.playbackState.currentKit = kitId;
      console.log(`✅ Loaded MusicRadar kit: ${kitId} (${sampleMapping.size} samples)`);
      
    } catch (error) {
      console.error(`❌ Failed to load MusicRadar kit ${kitId}:`, error);
      throw error;
    }
  }

  /**
   * Add event listener for pad triggers
   */
  onEvent(listener: (event: { type: string; padName: PadName; velocity: number }) => void): () => void {
    const wrappedListener = (padName: PadName, velocity: number) => {
      listener({ type: 'pad_triggered', padName, velocity });
    };
    this.padTriggerListeners.push(wrappedListener);
    
    return () => {
      const index = this.padTriggerListeners.indexOf(wrappedListener);
      if (index >= 0) {
        this.padTriggerListeners.splice(index, 1);
      }
    };
  }

  /**
   * Trigger a drum pad manually or programmatically using Tone.js
   */
  async triggerPad(padName: PadName, velocity: number = 127): Promise<void> {
    try {
      await toneDrumService.triggerPad(padName, velocity);
      
      // Notify listeners with current time
      const currentTime = Date.now() / 1000; // Convert to seconds
      this.padTriggerListeners.forEach(listener => {
        listener(padName, velocity, currentTime);
      });
      
    } catch (error) {
      console.error(`Failed to trigger pad ${padName}:`, error);
    }
  }

  // Legacy trigger methods removed - using pure Tone.js architecture

  /**
   * Check if a pad has a loaded sample
   */
  hasPadSample(padName: PadName): boolean {
    return toneDrumService.hasPadSample(padName);
  }

  /**
   * Get active voice count (Tone.js managed)
   */
  get activeVoiceCount(): number {
    return toneDrumService.getActiveVoiceCount();
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
    // Voice stopping now handled by Tone.js services
  }

  /**
   * Schedule events for the current pattern
   */
  private schedulePatternEvents(): void {
    // TODO: Implement A/B pattern integration
    // For now, skip pattern scheduling to avoid type errors
    console.log('Pattern scheduling temporarily disabled during Phase 9 implementation');
    return;
    
    // Pattern scheduling functionality removed - now handled by ToneTransportService
    
    console.log(
      `Scheduled ${this.playbackState.scheduledEvents.length} pattern events`
    );
  }

  /**
   * Clear all scheduled events - now handled by ToneTransportService
   */
  private clearScheduledEvents(): void {
    this.playbackState.scheduledEvents = [];
  }

  /**
   * All voice management now handled by Tone.js services
   */

  /**
   * Set pad-specific gain using Tone.js
   */
  setPadGain(padName: PadName, gain: number): void {
    toneDrumService.setPadGain(padName, gain);
  }

  /**
   * Set pad-specific panning using Tone.js
   */
  setPadPan(padName: PadName, pan: number): void {
    toneDrumService.setPadPan(padName, pan);
  }

  /**
   * Set master output gain using Tone.js
   */
  setMasterGain(gain: number): void {
    toneDrumService.setMasterGain(gain);
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return {
      ...this.playbackState
    };
  }

  /**
   * Get loaded pad samples (delegated to Tone.js service)
   */
  getPadSamples(): Map<PadName, Sample> {
    return new Map(); // Tone.js manages samples internally
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
   * Notify listeners of state changes (for UI updates)
   */
  private notifyStateChange(): void {
    // Force UI re-render by emitting a state change event
    // This ensures that hasPadSample() checks get re-evaluated
    console.log('🔄 Notifying UI of kit loaded state change');
    
    // We'll add state change listeners later
    // For now, rely on React's state updates in the hook
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.clearScheduledEvents();
    
    // Clear listeners
    this.padTriggerListeners = [];
    this.patternEventListeners = [];
    
    // Tone.js cleanup is handled by ToneDrumService
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