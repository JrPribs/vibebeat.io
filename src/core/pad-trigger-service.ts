import { AudioSample, PadTriggerEvent } from '../shared/models';
import { AudioService } from './audio-service';

export interface PadConfig {
  id: string;
  sample: AudioSample;
  velocity: number;
  enabled: boolean;
  midiNote?: number;
  keyboardKey?: string;
}

export class PadTriggerService {
  private audioService: AudioService;
  private pads: Map<string, PadConfig> = new Map();
  private keyboardListeners: Map<string, () => void> = new Map();
  private midiListeners: Map<number, () => void> = new Map();
  private isListening = false;

  constructor(audioService: AudioService) {
    this.audioService = audioService;
  }

  addPad(config: PadConfig): void {
    this.pads.set(config.id, config);
    
    if (config.keyboardKey) {
      this.setupKeyboardListener(config.id, config.keyboardKey);
    }
    
    if (config.midiNote !== undefined) {
      this.setupMidiListener(config.id, config.midiNote);
    }
  }

  removePad(padId: string): void {
    const pad = this.pads.get(padId);
    if (pad) {
      if (pad.keyboardKey) {
        this.removeKeyboardListener(pad.keyboardKey);
      }
      if (pad.midiNote !== undefined) {
        this.removeMidiListener(pad.midiNote);
      }
      this.pads.delete(padId);
    }
  }

  updatePad(padId: string, updates: Partial<PadConfig>): void {
    const existing = this.pads.get(padId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.pads.set(padId, updated);
      
      // Update listeners if keyboard key or MIDI note changed
      if (updates.keyboardKey !== undefined && updates.keyboardKey !== existing.keyboardKey) {
        if (existing.keyboardKey) {
          this.removeKeyboardListener(existing.keyboardKey);
        }
        if (updates.keyboardKey) {
          this.setupKeyboardListener(padId, updates.keyboardKey);
        }
      }
      
      if (updates.midiNote !== undefined && updates.midiNote !== existing.midiNote) {
        if (existing.midiNote !== undefined) {
          this.removeMidiListener(existing.midiNote);
        }
        if (updates.midiNote !== undefined) {
          this.setupMidiListener(padId, updates.midiNote);
        }
      }
    }
  }

  async triggerPad(padId: string, velocity: number = 1): Promise<void> {
    const pad = this.pads.get(padId);
    if (!pad || !pad.enabled) {
      return;
    }

    const effectiveVelocity = velocity * pad.velocity;
    
    try {
      await this.audioService.playSample(pad.sample, effectiveVelocity);
      
      // Emit trigger event for UI feedback, recording, etc.
      this.emitTriggerEvent({
        padId,
        sample: pad.sample,
        velocity: effectiveVelocity,
        timestamp: Date.now(),
        source: 'manual'
      });
    } catch (error) {
      console.error(`Failed to trigger pad ${padId}:`, error);
    }
  }

  private setupKeyboardListener(padId: string, key: string): void {
    const listener = (event: KeyboardEvent) => {
      if (event.code === key && !event.repeat) {
        event.preventDefault();
        this.triggerPad(padId, 1);
      }
    };
    
    document.addEventListener('keydown', listener);
    this.keyboardListeners.set(key, () => {
      document.removeEventListener('keydown', listener);
    });
  }

  private removeKeyboardListener(key: string): void {
    const cleanup = this.keyboardListeners.get(key);
    if (cleanup) {
      cleanup();
      this.keyboardListeners.delete(key);
    }
  }

  private setupMidiListener(padId: string, midiNote: number): void {
    // MIDI implementation would go here
    // For now, just store the mapping
    this.midiListeners.set(midiNote, () => {
      this.triggerPad(padId, 1);
    });
  }

  private removeMidiListener(midiNote: number): void {
    this.midiListeners.delete(midiNote);
  }

  private emitTriggerEvent(event: PadTriggerEvent): void {
    // Emit custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('padTrigger', { detail: event }));
  }

  startListening(): void {
    this.isListening = true;
  }

  stopListening(): void {
    this.isListening = false;
  }

  getPad(padId: string): PadConfig | undefined {
    return this.pads.get(padId);
  }

  getAllPads(): PadConfig[] {
    return Array.from(this.pads.values());
  }

  getEnabledPads(): PadConfig[] {
    return this.getAllPads().filter(pad => pad.enabled);
  }

  setPadEnabled(padId: string, enabled: boolean): void {
    this.updatePad(padId, { enabled });
  }

  setPadVelocity(padId: string, velocity: number): void {
    this.updatePad(padId, { velocity: Math.max(0, Math.min(1, velocity)) });
  }

  clear(): void {
    // Remove all listeners
    this.keyboardListeners.forEach(cleanup => cleanup());
    this.keyboardListeners.clear();
    this.midiListeners.clear();
    
    // Clear pads
    this.pads.clear();
    
    this.isListening = false;
  }
}