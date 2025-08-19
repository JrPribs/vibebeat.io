// Scheduler Service - DEPRECATED
// Manages AudioWorklet scheduler for sample-accurate timing and metronome
//
// ⚠️  DEPRECATED: This service is being replaced by ToneTransportService
// ⚠️  which provides better integration with Tone.js and more reliable timing.
// ⚠️  Use toneTransportService instead for new implementations.

import type { ScheduledEvent, TransportState } from '../shared/models/index';
import { audioService } from './audio-service';

interface SchedulerPosition {
  bar: number;
  beat: number;
  step: number;
  time: number;
}

interface SchedulerEvent extends ScheduledEvent {
  scheduledTime?: number;
  absoluteStep?: number;
  actualTime?: number;
  latency?: number;
}

class SchedulerService {
  private workletNode: AudioWorkletNode | null = null;
  private isInitialized: boolean = false;
  private currentPosition: SchedulerPosition = { bar: 0, beat: 0, step: 0, time: 0 };
  private isPlaying: boolean = false;
  private metronomeNode: GainNode | null = null;
  private metronomeOscillator: OscillatorNode | null = null;
  
  // Event listeners
  private positionListeners: ((position: SchedulerPosition) => void)[] = [];
  private eventListeners: ((event: SchedulerEvent) => void)[] = [];
  private stepListeners: ((step: number, beat: number, bar: number, time: number) => void)[] = [];
  private transportListeners: ((state: { isPlaying: boolean; isCountingIn?: boolean }) => void)[] = [];

  constructor() {
    this.handleWorkletMessage = this.handleWorkletMessage.bind(this);
  }

  /**
   * Initialize the scheduler with AudioWorklet
   */
  async initialize(): Promise<void> {
    const context = audioService.getAudioContext();
    if (!context) {
      throw new Error('AudioContext not available. Please enable audio first.');
    }

    try {
      // Load the AudioWorklet module
      await context.audioWorklet.addModule('/audio-worklet-scheduler.js');
      
      // Create the worklet node
      this.workletNode = new AudioWorkletNode(context, 'scheduler-processor');
      
      // Set up message handling
      this.workletNode.port.onmessage = this.handleWorkletMessage;
      
      // Connect to destination (though it doesn't output audio directly)
      this.workletNode.connect(context.destination);
      
      // Set up metronome audio chain
      this.setupMetronome();
      
      this.isInitialized = true;
      
      console.log('SchedulerService initialized with AudioWorklet');
      
    } catch (error) {
      console.error('Failed to initialize SchedulerService:', error);
      throw error;
    }
  }

  /**
   * Set up metronome audio nodes
   */
  private setupMetronome(): void {
    const context = audioService.getAudioContext();
    if (!context) return;

    // Create metronome gain node
    this.metronomeNode = context.createGain();
    this.metronomeNode.gain.setValueAtTime(0.5, context.currentTime);
    this.metronomeNode.connect(context.destination);
  }

  /**
   * Handle messages from the AudioWorklet
   */
  private handleWorkletMessage(event: MessageEvent): void {
    const { type, ...data } = event.data;

    switch (type) {
      case 'ready':
        console.log('AudioWorklet scheduler ready');
        break;

      case 'positionUpdate':
        this.currentPosition = data.position;
        this.positionListeners.forEach(listener => listener(data.position));
        break;

      case 'triggerEvent':
        this.eventListeners.forEach(listener => listener(data.event));
        break;

      case 'stepTrigger':
        this.stepListeners.forEach(listener => 
          listener(data.step, data.beat, data.bar, data.time)
        );
        break;

      case 'started':
        this.isPlaying = true;
        this.transportListeners.forEach(listener => 
          listener({ isPlaying: true, isCountingIn: data.countingIn })
        );
        break;

      case 'stopped':
      case 'paused':
        this.isPlaying = false;
        this.transportListeners.forEach(listener => 
          listener({ isPlaying: false })
        );
        break;

      case 'countInComplete':
        this.transportListeners.forEach(listener => 
          listener({ isPlaying: true, isCountingIn: false })
        );
        break;

      default:
        console.warn('Unknown worklet message type:', type);
    }
  }

  /**
   * Start playback with optional count-in
   */
  async start(options?: { countIn?: boolean; countInBars?: number }): Promise<void> {
    if (!this.isInitialized || !this.workletNode) {
      throw new Error('Scheduler not initialized');
    }

    // Ensure audio context is running
    await audioService.resume();

    // Send start message to worklet
    this.workletNode.port.postMessage({
      type: 'start',
      data: {
        countIn: options?.countIn || false,
        countInBars: options?.countInBars || 1
      }
    });
  }

  /**
   * Stop playback
   */
  /**
   * Start/play playback
   */
  play(): void {
    if (!this.workletNode) return;
    this.workletNode.port.postMessage({ type: 'start' });
    this.isPlaying = true;
    this.transportListeners.forEach(listener => listener({ isPlaying: true }));
  }

  stop(): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({ type: 'stop' });
    this.stopMetronome();
    this.isPlaying = false;
    this.transportListeners.forEach(listener => listener({ isPlaying: false }));
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({ type: 'pause' });
    this.stopMetronome();
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'setBPM',
      bpm: Math.max(60, Math.min(200, bpm))
    });
  }

  /**
   * Set swing percentage
   */
  setSwing(swingPercent: number): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'setSwing',
      swingPercent: Math.max(0, Math.min(60, swingPercent))
    });
  }

  /**
   * Set time signature
   */
  setTimeSignature(timeSignature: [number, number]): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'setTimeSignature',
      timeSignature
    });
  }

  /**
   * Enable/disable metronome
   */
  setMetronome(enabled: boolean): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'setMetronome',
      enabled
    });

    if (enabled && this.isPlaying) {
      this.startMetronome();
    } else {
      this.stopMetronome();
    }
  }

  /**
   * Schedule an event (pad hit, note, etc.)
   */
  scheduleEvent(event: ScheduledEvent): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'scheduleEvent',
      event
    });
  }

  /**
   * Clear all scheduled events
   */
  clearEvents(): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({ type: 'clearEvents' });
  }

  /**
   * Set playback position
   */
  setPosition(position: Partial<SchedulerPosition>): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: 'setPosition',
      position: {
        bar: position.bar || 0,
        beat: position.beat || 0,
        step: position.step || 0
      }
    });
  }

  /**
   * Start metronome audio output
   */
  private startMetronome(): void {
    // The metronome audio is actually generated in the main thread
    // based on step triggers from the worklet
  }

  /**
   * Stop metronome audio output
   */
  private stopMetronome(): void {
    if (this.metronomeOscillator) {
      this.metronomeOscillator.stop();
      this.metronomeOscillator = null;
    }
  }

  /**
   * Trigger a metronome click
   */
  triggerMetronomeClick(isAccent: boolean = false): void {
    const context = audioService.getAudioContext();
    if (!context || !this.metronomeNode) return;

    try {
      // Create short click sound
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      
      oscillator.frequency.setValueAtTime(
        isAccent ? 1000 : 800, // Higher pitch for accent
        context.currentTime
      );
      
      // Quick attack and decay
      envelope.gain.setValueAtTime(0, context.currentTime);
      envelope.gain.linearRampToValueAtTime(
        isAccent ? 0.8 : 0.5,
        context.currentTime + 0.001
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.05
      );
      
      oscillator.connect(envelope);
      envelope.connect(this.metronomeNode);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.05);
      
    } catch (error) {
      console.error('Failed to trigger metronome click:', error);
    }
  }

  /**
   * Get current playback position
   */
  getPosition(): SchedulerPosition {
    return { ...this.currentPosition };
  }

  /**
   * Get current playback state
   */
  getState(): { isPlaying: boolean; isInitialized: boolean } {
    return {
      isPlaying: this.isPlaying,
      isInitialized: this.isInitialized
    };
  }

  // Event listener management
  onPositionUpdate(listener: (position: SchedulerPosition) => void): () => void {
    this.positionListeners.push(listener);
    return () => {
      const index = this.positionListeners.indexOf(listener);
      if (index > -1) this.positionListeners.splice(index, 1);
    };
  }

  onEvent(listener: (event: SchedulerEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) this.eventListeners.splice(index, 1);
    };
  }

  onStep(listener: (step: number, beat: number, bar: number, time: number) => void): () => void {
    this.stepListeners.push(listener);
    return () => {
      const index = this.stepListeners.indexOf(listener);
      if (index > -1) this.stepListeners.splice(index, 1);
    };
  }

  onTransportChange(listener: (state: { isPlaying: boolean; isCountingIn?: boolean }) => void): () => void {
    this.transportListeners.push(listener);
    return () => {
      const index = this.transportListeners.indexOf(listener);
      if (index > -1) this.transportListeners.splice(index, 1);
    };
  }


  /**
   * Destroy the scheduler and clean up resources
   */
  async destroy(): Promise<void> {
    this.stop();
    
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.metronomeNode) {
      this.metronomeNode.disconnect();
      this.metronomeNode = null;
    }
    
    this.isInitialized = false;
  }

  // Singleton pattern
  private static instance: SchedulerService | null = null;
  
  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }
}

// Export singleton instance
export const schedulerService = SchedulerService.getInstance();
export default schedulerService;