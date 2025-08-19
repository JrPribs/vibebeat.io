// Tone Transport Service
// Professional timing and sequencing using Tone.js Transport (replaces AudioWorklet scheduler)

import * as Tone from 'tone';
import type { ScheduledEvent, DrumTrack } from '../shared/models/index';

// Expose Tone.js globally for debugging
if (typeof window !== 'undefined') {
  (window as any).Tone = Tone;
}

interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  timeSignature: [number, number];
  position: string; // Tone.js time format (bars:beats:sixteenths)
  swing: number; // 0-1
  currentBar: number;
  currentBeat: number;
  currentSixteenth: number;
}

interface LoopState {
  enabled: boolean;
  start: string; // Tone.js time format
  end: string; // Tone.js time format
}

interface ToneTransportOptions {
  bpm?: number;
  timeSignature?: [number, number];
  swing?: number;
  lookAhead?: number; // seconds
}

class ToneTransportService {
  private transportState: TransportState = {
    isPlaying: false,
    isRecording: false,
    bpm: 120,
    timeSignature: [4, 4],
    position: '0:0:0',
    swing: 0,
    currentBar: 0,
    currentBeat: 0,
    currentSixteenth: 0
  };

  private loopState: LoopState = {
    enabled: false,
    start: '0:0:0',
    end: '4:0:0' // Default 4 bars
  };

  // Event listeners
  private transportEventListeners: ((state: TransportState) => void)[] = [];
  private scheduledEventListeners: ((event: ScheduledEvent) => void)[] = [];
  private positionEventListeners: ((position: string) => void)[] = [];

  // Scheduled events management
  private scheduledEvents: Map<string, Tone.ToneEvent> = new Map();
  private scheduledParts: Map<string, Tone.Part> = new Map();

  // Animation frame for position updates
  private positionUpdateId: number | null = null;

  constructor(options: ToneTransportOptions = {}) {
    console.log('ToneTransportService: Initializing...');
    this.initializeTransport(options);
  }

  /**
   * Initialize Tone.js Transport with settings
   */
  private initializeTransport(options: ToneTransportOptions): void {
    try {
      // Set initial transport settings
      if (options.bpm) {
        Tone.getTransport().bpm.value = options.bpm;
        this.transportState.bpm = options.bpm;
      } else {
        Tone.getTransport().bpm.value = this.transportState.bpm;
      }

      if (options.timeSignature) {
        Tone.getTransport().timeSignature = options.timeSignature;
        this.transportState.timeSignature = options.timeSignature;
      }

      if (options.swing) {
        Tone.getTransport().swing = options.swing;
        this.transportState.swing = options.swing;
      }

      if (options.lookAhead) {
        Tone.getTransport().lookAhead = options.lookAhead;
      }

      // Set up transport position tracking
      this.setupPositionTracking();

      // Set up transport state listeners
      this.setupTransportListeners();

      console.log('✅ ToneTransportService initialized successfully');

    } catch (error) {
      console.error('❌ ToneTransportService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up position tracking with animation frames
   */
  private setupPositionTracking(): void {
    const updatePosition = () => {
      if (this.transportState.isPlaying) {
        const position = Tone.getTransport().position;
        
        // Parse Tone.js position format (bars:beats:sixteenths)
        const [bars, beats, sixteenths] = position.split(':').map(Number);
        
        this.transportState.position = position;
        this.transportState.currentBar = bars;
        this.transportState.currentBeat = beats;
        this.transportState.currentSixteenth = Math.floor(sixteenths);

        // Notify position listeners
        this.positionEventListeners.forEach(listener => {
          listener(position);
        });
      }

      this.positionUpdateId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
  }

  /**
   * Set up Tone.js Transport event listeners
   */
  private setupTransportListeners(): void {
    // Transport start event
    Tone.getTransport().on('start', () => {
      this.transportState.isPlaying = true;
      this.notifyTransportStateChange();
      console.log('🎵 Transport started');
    });

    // Transport stop event
    Tone.getTransport().on('stop', () => {
      this.transportState.isPlaying = false;
      this.notifyTransportStateChange();
      console.log('⏹️ Transport stopped');
    });

    // Transport pause event
    Tone.getTransport().on('pause', () => {
      this.transportState.isPlaying = false;
      this.notifyTransportStateChange();
      console.log('⏸️ Transport paused');
    });
  }

  /**
   * Start the transport
   */
  async start(delay: number = 0): Promise<void> {
    try {
      // Ensure Tone.js context is running
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      const when = delay > 0 ? `+${delay}` : undefined;
      Tone.getTransport().start(when);
      
      console.log(`🎵 Transport starting${delay > 0 ? ` in ${delay}s` : ''}`);
      
    } catch (error) {
      console.error('❌ Failed to start transport:', error);
      throw error;
    }
  }

  /**
   * Stop the transport
   */
  stop(): void {
    try {
      Tone.getTransport().stop();
      console.log('⏹️ Transport stopped');
    } catch (error) {
      console.error('❌ Failed to stop transport:', error);
    }
  }

  /**
   * Pause the transport
   */
  pause(): void {
    try {
      Tone.getTransport().pause();
      console.log('⏸️ Transport paused');
    } catch (error) {
      console.error('❌ Failed to pause transport:', error);
    }
  }

  /**
   * Set transport BPM
   */
  setBpm(bpm: number): void {
    const clampedBpm = Math.max(60, Math.min(200, bpm));
    Tone.getTransport().bpm.rampTo(clampedBpm, 0.1);
    this.transportState.bpm = clampedBpm;
    this.notifyTransportStateChange();
    console.log(`🎵 BPM set to ${clampedBpm}`);
  }

  /**
   * Set swing amount (0-1)
   */
  setSwing(swing: number): void {
    const clampedSwing = Math.max(0, Math.min(1, swing));
    Tone.getTransport().swing = clampedSwing;
    this.transportState.swing = clampedSwing;
    this.notifyTransportStateChange();
    console.log(`🎵 Swing set to ${clampedSwing}`);
  }

  /**
   * Set time signature
   */
  setTimeSignature(numerator: number, denominator: number): void {
    const timeSignature: [number, number] = [numerator, denominator];
    Tone.getTransport().timeSignature = timeSignature;
    this.transportState.timeSignature = timeSignature;
    this.notifyTransportStateChange();
    console.log(`🎵 Time signature set to ${numerator}/${denominator}`);
  }

  /**
   * Set transport position
   */
  setPosition(position: string): void {
    try {
      Tone.getTransport().position = position;
      console.log(`🎵 Position set to ${position}`);
    } catch (error) {
      console.error('❌ Failed to set position:', error);
    }
  }

  /**
   * Enable/disable loop
   */
  setLoop(enabled: boolean, start?: string, end?: string): void {
    this.loopState.enabled = enabled;
    
    if (start) this.loopState.start = start;
    if (end) this.loopState.end = end;
    
    Tone.getTransport().loop = enabled;
    if (enabled) {
      Tone.getTransport().loopStart = this.loopState.start;
      Tone.getTransport().loopEnd = this.loopState.end;
    }
    
    console.log(`🔄 Loop ${enabled ? 'enabled' : 'disabled'} (${this.loopState.start} - ${this.loopState.end})`);
  }

  /**
   * Schedule a single event
   */
  scheduleEvent(event: ScheduledEvent): void {
    try {
      const toneEvent = new Tone.ToneEvent((time) => {
        // Notify listeners
        this.scheduledEventListeners.forEach(listener => {
          listener(event);
        });
      }, event.data);

      // Schedule the event
      toneEvent.start(event.time || '0:0:0');
      
      // Store reference for cleanup
      this.scheduledEvents.set(event.id, toneEvent);
      
      console.log(`📅 Scheduled event ${event.id} at ${event.time}`);

    } catch (error) {
      console.error(`❌ Failed to schedule event ${event.id}:`, error);
    }
  }

  /**
   * Schedule a repeating pattern/part
   */
  schedulePart(id: string, events: ScheduledEvent[], loop: boolean = true): void {
    try {
      // Create Tone.Part for the sequence
      const part = new Tone.Part((time, event) => {
        // Notify listeners
        this.scheduledEventListeners.forEach(listener => {
          listener(event as ScheduledEvent);
        });
      }, events.map(event => [event.time || '0:0:0', event]));

      // Set loop behavior
      part.loop = loop;
      if (loop) {
        part.loopEnd = this.loopState.end;
      }

      // Start the part
      part.start('0:0:0');
      
      // Store reference
      this.scheduledParts.set(id, part);
      
      console.log(`📅 Scheduled part ${id} with ${events.length} events`);

    } catch (error) {
      console.error(`❌ Failed to schedule part ${id}:`, error);
    }
  }

  /**
   * Clear a specific scheduled event
   */
  clearEvent(eventId: string): void {
    const toneEvent = this.scheduledEvents.get(eventId);
    if (toneEvent) {
      toneEvent.dispose();
      this.scheduledEvents.delete(eventId);
      console.log(`🗑️ Cleared event ${eventId}`);
    }
  }

  /**
   * Clear a specific scheduled part
   */
  clearPart(partId: string): void {
    const part = this.scheduledParts.get(partId);
    if (part) {
      part.dispose();
      this.scheduledParts.delete(partId);
      console.log(`🗑️ Cleared part ${partId}`);
    }
  }

  /**
   * Clear all scheduled events and parts
   */
  clearAll(): void {
    // Clear all individual events
    for (const [id, event] of this.scheduledEvents.entries()) {
      event.dispose();
    }
    this.scheduledEvents.clear();

    // Clear all parts
    for (const [id, part] of this.scheduledParts.entries()) {
      part.dispose();
    }
    this.scheduledParts.clear();

    console.log('🗑️ Cleared all scheduled events and parts');
  }

  /**
   * Get current transport state
   */
  getState(): TransportState {
    return { ...this.transportState };
  }

  /**
   * Get current loop state
   */
  getLoopState(): LoopState {
    return { ...this.loopState };
  }

  /**
   * Get current position in seconds
   */
  getCurrentTime(): number {
    return Tone.getTransport().seconds;
  }

  /**
   * Get current position in Tone.js format
   */
  getCurrentPosition(): string {
    return Tone.getTransport().position;
  }

  // Event listener management
  onTransportChange(listener: (state: TransportState) => void): () => void {
    this.transportEventListeners.push(listener);
    return () => {
      const index = this.transportEventListeners.indexOf(listener);
      if (index > -1) this.transportEventListeners.splice(index, 1);
    };
  }

  onScheduledEvent(listener: (event: ScheduledEvent) => void): () => void {
    this.scheduledEventListeners.push(listener);
    return () => {
      const index = this.scheduledEventListeners.indexOf(listener);
      if (index > -1) this.scheduledEventListeners.splice(index, 1);
    };
  }

  onPosition(listener: (position: string) => void): () => void {
    this.positionEventListeners.push(listener);
    return () => {
      const index = this.positionEventListeners.indexOf(listener);
      if (index > -1) this.positionEventListeners.splice(index, 1);
    };
  }

  /**
   * Notify transport state change to listeners
   */
  private notifyTransportStateChange(): void {
    this.transportEventListeners.forEach(listener => {
      listener(this.getState());
    });
  }

  /**
   * Convert seconds to Tone.js time format
   */
  secondsToTransportTime(seconds: number): string {
    return Tone.Time(seconds).toBarsBeatsSixteenths();
  }

  /**
   * Convert Tone.js time format to seconds
   */
  transportTimeToSeconds(time: string): number {
    return Tone.Time(time).toSeconds();
  }

  /**
   * Quantize time to nearest subdivision
   */
  quantizeTime(time: string, subdivision: string = '16n'): string {
    return Tone.Time(time).quantize(subdivision).toBarsBeatsSixteenths();
  }

  /**
   * Dispose of the service and clean up
   */
  dispose(): void {
    try {
      // Cancel position updates
      if (this.positionUpdateId !== null) {
        cancelAnimationFrame(this.positionUpdateId);
        this.positionUpdateId = null;
      }

      // Clear all scheduled events
      this.clearAll();

      // Stop transport
      if (this.transportState.isPlaying) {
        this.stop();
      }

      // Clear listeners
      this.transportEventListeners = [];
      this.scheduledEventListeners = [];
      this.positionEventListeners = [];

      console.log('🗑️ ToneTransportService disposed successfully');

    } catch (error) {
      console.error('❌ Failed to dispose ToneTransportService:', error);
    }
  }

  // Singleton pattern
  private static instance: ToneTransportService | null = null;

  static getInstance(options?: ToneTransportOptions): ToneTransportService {
    if (!ToneTransportService.instance) {
      ToneTransportService.instance = new ToneTransportService(options);
    }
    return ToneTransportService.instance;
  }
}

// Export singleton instance
export const toneTransportService = ToneTransportService.getInstance();
export default toneTransportService;