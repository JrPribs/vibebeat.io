// Tone Piano Service
// Piano synthesis using Tone.js PolySynth for professional quality sound

import * as Tone from 'tone';

interface TonePianoTriggerOptions {
  velocity?: number; // 0-127
  duration?: number; // Note duration in seconds
  gain?: number; // 0-1
}

interface ActiveToneNote {
  note: string;
  startTime: number;
  synth: Tone.PolySynth;
}

class TonePianoService {
  private polySynth: Tone.PolySynth | null = null;
  private isInitialized: boolean = false;
  private masterVolume: Tone.Volume | null = null;
  private activeNotes: Map<string, ActiveToneNote> = new Map();
  
  // Event listeners
  private noteTriggeredListeners: ((note: string, velocity: number, time: number) => void)[] = [];
  private noteReleasedListeners: ((note: string, time: number) => void)[] = [];

  constructor() {
    // Initialize will be called after Tone.start()
  }

  /**
   * Initialize the Tone.js piano service
   * Must be called after user interaction and Tone.start()
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure Tone.js is started
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Create master volume control
      this.masterVolume = new Tone.Volume(-12); // Start at reasonable level

      // Create polyphonic synthesizer with better sound
      this.polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          partials: [0, 2, 3, 4],
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 1.2,
        },
      });

      // Connect audio chain: PolySynth -> Volume -> Destination
      this.polySynth.connect(this.masterVolume);
      this.masterVolume.toDestination();

      this.isInitialized = true;
      
      console.log('TonePianoService initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize TonePianoService:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Trigger a piano note with Tone.js synthesis
   */
  async triggerNote(note: string, velocity: number = 127, options: TonePianoTriggerOptions = {}): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.polySynth) {
      console.warn('PolySynth not available');
      return;
    }

    // Stop existing note if playing
    this.releaseNote(note);

    const time = options.duration ? undefined : Tone.now();
    const duration = options.duration || undefined; // Let note sustain
    
    try {
      // Convert MIDI velocity to linear gain (0-1)
      const velocityGain = velocity / 127;
      
      if (duration) {
        // Trigger with specific duration
        this.polySynth.triggerAttackRelease(note, duration, time, velocityGain);
      } else {
        // Trigger and hold until release
        this.polySynth.triggerAttack(note, time, velocityGain);
      }
      
      // Store active note
      const activeNote: ActiveToneNote = {
        note,
        startTime: Tone.now(),
        synth: this.polySynth
      };
      
      this.activeNotes.set(note, activeNote);
      
      // Notify listeners
      this.noteTriggeredListeners.forEach(listener => 
        listener(note, velocity, Tone.now())
      );
      
    } catch (error) {
      console.error('Failed to trigger Tone.js piano note:', error);
    }
  }

  /**
   * Release a piano note
   */
  releaseNote(note: string, releaseTime?: number): void {
    if (!this.polySynth) return;

    const activeNote = this.activeNotes.get(note);
    if (!activeNote) return;

    const time = releaseTime || Tone.now();
    
    try {
      this.polySynth.triggerRelease(note, time);
      
      // Remove from active notes
      this.activeNotes.delete(note);
      
      // Notify listeners
      this.noteReleasedListeners.forEach(listener => 
        listener(note, time)
      );
      
    } catch (error) {
      console.error('Failed to release Tone.js piano note:', error);
    }
  }

  /**
   * Stop all active notes immediately
   */
  stopAllNotes(): void {
    if (!this.polySynth) return;

    const currentTime = Tone.now();
    
    for (const [note] of this.activeNotes.entries()) {
      try {
        this.polySynth.triggerRelease(note, currentTime);
      } catch (error) {
        console.error(`Failed to stop note ${note}:`, error);
      }
    }
    
    this.activeNotes.clear();
  }

  /**
   * Set master volume (-60 to 0 dB)
   */
  setVolume(volumeDb: number): void {
    if (!this.masterVolume) return;

    const clampedVolume = Math.max(-60, Math.min(0, volumeDb));
    this.masterVolume.volume.value = clampedVolume;
  }

  /**
   * Set master volume from linear scale (0-1)
   */
  setVolumeLinear(volume: number): void {
    if (!this.masterVolume) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    // Convert linear to dB: 20 * log10(volume)
    const volumeDb = clampedVolume === 0 ? -60 : 20 * Math.log10(clampedVolume);
    this.setVolume(volumeDb);
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

  /**
   * Get initialization status
   */
  getInitializationStatus(): { isInitialized: boolean; isContextRunning: boolean } {
    return {
      isInitialized: this.isInitialized,
      isContextRunning: Tone.context.state === 'running'
    };
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
  async destroy(): Promise<void> {
    this.stopAllNotes();
    
    if (this.polySynth) {
      this.polySynth.dispose();
      this.polySynth = null;
    }
    
    if (this.masterVolume) {
      this.masterVolume.dispose();
      this.masterVolume = null;
    }
    
    this.activeNotes.clear();
    this.noteTriggeredListeners.length = 0;
    this.noteReleasedListeners.length = 0;
    this.isInitialized = false;
  }

  // Singleton pattern
  private static instance: TonePianoService | null = null;
  
  static getInstance(): TonePianoService {
    if (!TonePianoService.instance) {
      TonePianoService.instance = new TonePianoService();
    }
    return TonePianoService.instance;
  }
}

// Export singleton instance
export const tonePianoService = TonePianoService.getInstance();
export default tonePianoService;