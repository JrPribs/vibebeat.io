// Piano Service
// Handles piano key triggering and synthesis using oscillators

import { audioService } from './audio-service';
import { audioUtils } from '../shared/utils/index';

interface PianoTriggerOptions {
  velocity?: number; // 0-127
  time?: number; // Scheduled time (AudioContext time)
  duration?: number; // Note duration in seconds
  gain?: number; // 0-1
}

interface ActiveNote {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  note: string;
  startTime: number;
}

class PianoService {
  private outputGain: GainNode | null = null;
  private activeNotes: Map<string, ActiveNote> = new Map();
  private masterGain: number = 0.3; // Adjusted for piano volume
  
  // Event listeners
  private noteTriggeredListeners: ((note: string, velocity: number, time: number) => void)[] = [];
  private noteReleasedListeners: ((note: string, time: number) => void)[] = [];

  constructor() {
    // Set up audio nodes when service becomes available
    this.setupAudioNodes();
    
    // Listen for audio service initialization
    audioService.onStateChange((state) => {
      if (state.isInitialized && !this.outputGain) {
        this.setupAudioNodes();
      }
    });
  }

  /**
   * Set up audio processing chain
   */
  private setupAudioNodes(): void {
    const context = audioService.getAudioContext();
    const destination = audioService.getDestination();
    
    if (!context || !destination) {
      return; // Audio not ready yet
    }

    try {
      // Create master output gain
      this.outputGain = context.createGain();
      this.outputGain.gain.setValueAtTime(this.masterGain, context.currentTime);
      
      // Connect to audio destination
      this.outputGain.connect(destination);
      
      console.log('PianoService audio nodes initialized');
      
    } catch (error) {
      console.error('Failed to setup piano audio nodes:', error);
    }
  }

  /**
   * Trigger a piano note with oscillator synthesis
   */
  triggerNote(note: string, velocity: number = 127, options: PianoTriggerOptions = {}): void {
    const context = audioService.getAudioContext();
    if (!context || !this.outputGain) {
      console.warn('AudioContext not available. Please enable audio to play sounds.');
      return;
    }

    // Stop existing note if playing
    this.releaseNote(note);

    const time = options.time || context.currentTime;
    const duration = options.duration || 2.0; // Default 2 second sustain
    
    try {
      // Convert note to frequency
      const midiNote = audioUtils.noteToMidi(note);
      const frequency = audioUtils.midiToFreq(midiNote);
      
      // Create oscillator
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle'; // Piano-like timbre
      oscillator.frequency.setValueAtTime(frequency, time);
      
      // Create ADSR envelope
      const gainNode = context.createGain();
      
      // Calculate velocity-based gain
      const velocityGain = (velocity / 127) * this.masterGain;
      
      // ADSR Envelope for piano-like sound
      const attackTime = 0.01;  // Quick attack
      const decayTime = 0.3;    // Moderate decay
      const sustainLevel = 0.3; // Low sustain
      const releaseTime = 1.0;  // Long release
      
      // Attack
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(velocityGain, time + attackTime);
      
      // Decay to sustain
      gainNode.gain.exponentialRampToValueAtTime(
        velocityGain * sustainLevel,
        time + attackTime + decayTime
      );
      
      // Connect audio chain
      oscillator.connect(gainNode);
      gainNode.connect(this.outputGain);
      
      // Start the oscillator
      oscillator.start(time);
      
      // Schedule note release
      const releaseStartTime = time + duration;
      gainNode.gain.exponentialRampToValueAtTime(0.001, releaseStartTime + releaseTime);
      oscillator.stop(releaseStartTime + releaseTime);
      
      // Store active note
      const activeNote: ActiveNote = {
        oscillator,
        gainNode,
        note,
        startTime: time
      };
      
      this.activeNotes.set(note, activeNote);
      
      // Clean up when note ends
      oscillator.onended = () => {
        this.activeNotes.delete(note);
        gainNode.disconnect();
        oscillator.disconnect();
      };
      
      // Notify listeners
      this.noteTriggeredListeners.forEach(listener => 
        listener(note, velocity, time)
      );
      
    } catch (error) {
      console.error('Failed to trigger piano note:', error);
    }
  }

  /**
   * Release a piano note (stop oscillator with release envelope)
   */
  releaseNote(note: string, releaseTime: number = 1.0): void {
    const context = audioService.getAudioContext();
    if (!context) return;

    const activeNote = this.activeNotes.get(note);
    if (!activeNote) return;

    const currentTime = context.currentTime;
    
    try {
      // Start release envelope from current gain value
      const currentGain = activeNote.gainNode.gain.value;
      activeNote.gainNode.gain.cancelScheduledValues(currentTime);
      activeNote.gainNode.gain.setValueAtTime(currentGain, currentTime);
      activeNote.gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + releaseTime);
      
      // Stop oscillator after release
      activeNote.oscillator.stop(currentTime + releaseTime);
      
      // Notify listeners
      this.noteReleasedListeners.forEach(listener => 
        listener(note, currentTime)
      );
      
    } catch (error) {
      console.error('Failed to release piano note:', error);
    }
  }

  /**
   * Stop all active notes immediately
   */
  stopAllNotes(): void {
    const context = audioService.getAudioContext();
    if (!context) return;

    const currentTime = context.currentTime;
    
    for (const [note, activeNote] of this.activeNotes.entries()) {
      try {
        activeNote.gainNode.gain.cancelScheduledValues(currentTime);
        activeNote.gainNode.gain.setValueAtTime(0, currentTime);
        activeNote.oscillator.stop(currentTime + 0.01);
      } catch (error) {
        console.error(`Failed to stop note ${note}:`, error);
      }
    }
    
    this.activeNotes.clear();
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    const context = audioService.getAudioContext();
    if (!context || !this.outputGain) return;

    this.masterGain = Math.max(0, Math.min(1, volume));
    this.outputGain.gain.setValueAtTime(this.masterGain, context.currentTime);
  }

  /**
   * Get currently playing notes
   */
  getActiveNotes(): string[] {
    return Array.from(this.activeNotes.keys());
  }

  /**
   * Check if a note is currently playing
   */
  isNotePlaying(note: string): boolean {
    return this.activeNotes.has(note);
  }

  // Event listener management
  onNoteTriggered(listener: (note: string, velocity: number, time: number) => void): () => void {
    this.noteTriggeredListeners.push(listener);
    return () => {
      const index = this.noteTriggeredListeners.indexOf(listener);
      if (index > -1) this.noteTriggeredListeners.splice(index, 1);
    };
  }

  onNoteReleased(listener: (note: string, time: number) => void): () => void {
    this.noteReleasedListeners.push(listener);
    return () => {
      const index = this.noteReleasedListeners.indexOf(listener);
      if (index > -1) this.noteReleasedListeners.splice(index, 1);
    };
  }

  /**
   * Destroy the service and clean up resources
   */
  destroy(): void {
    this.stopAllNotes();
    
    if (this.outputGain) {
      this.outputGain.disconnect();
      this.outputGain = null;
    }
    
    this.activeNotes.clear();
    this.noteTriggeredListeners.length = 0;
    this.noteReleasedListeners.length = 0;
  }

  // Singleton pattern
  private static instance: PianoService | null = null;
  
  static getInstance(): PianoService {
    if (!PianoService.instance) {
      PianoService.instance = new PianoService();
    }
    return PianoService.instance;
  }
}

// Export singleton instance
export const pianoService = PianoService.getInstance();
export default pianoService;