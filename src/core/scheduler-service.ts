import { AudioProvider } from './audio-engine';
import { Pattern, PatternStep } from '../shared/models';

export interface SchedulerConfig {
  bpm: number;
  timeSignature: [number, number];
  swing: number;
  quantize: boolean;
}

export class SchedulerService {
  private audioProvider: AudioProvider;
  private isPlaying = false;
  private isPaused = false;
  private currentStep = 0;
  private pattern?: Pattern;
  private bpm = 120;
  private timeSignature: [number, number] = [4, 4];
  private swing = 0;
  private quantize = true;
  private schedulerInterval?: number;
  private lookAhead = 25.0; // ms
  private scheduleAheadTime = 0.1; // seconds
  private nextNoteTime = 0.0;
  private stepLength = 0.0;
  private currentBeatInBar = 0;

  constructor(audioProvider: AudioProvider) {
    this.audioProvider = audioProvider;
    this.calculateStepLength();
  }

  start(pattern: Pattern, bpm?: number): void {
    if (bpm) {
      this.bpm = bpm;
      this.calculateStepLength();
    }
    
    this.pattern = pattern;
    this.isPlaying = true;
    this.isPaused = false;
    this.currentStep = 0;
    this.currentBeatInBar = 0;
    
    const audioContext = this.audioProvider.getAudioContext();
    if (audioContext) {
      this.nextNoteTime = audioContext.currentTime;
      this.schedule();
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    this.currentBeatInBar = 0;
    
    if (this.schedulerInterval) {
      clearTimeout(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
  }

  pause(): void {
    if (this.isPlaying) {
      this.isPaused = true;
      this.isPlaying = false;
      
      if (this.schedulerInterval) {
        clearTimeout(this.schedulerInterval);
        this.schedulerInterval = undefined;
      }
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.isPlaying = true;
      
      const audioContext = this.audioProvider.getAudioContext();
      if (audioContext) {
        this.nextNoteTime = audioContext.currentTime;
        this.schedule();
      }
    }
  }

  private schedule(): void {
    const audioContext = this.audioProvider.getAudioContext();
    if (!audioContext || !this.pattern) return;

    while (this.nextNoteTime < audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.nextNoteTime);
      this.nextStep();
    }

    if (this.isPlaying) {
      this.schedulerInterval = window.setTimeout(
        () => this.schedule(),
        this.lookAhead
      );
    }
  }

  private scheduleStep(time: number): void {
    if (!this.pattern) return;

    // Get the current step data
    const step = this.pattern.steps[this.currentStep];
    if (step && step.active) {
      // Schedule each track in the step
      step.tracks.forEach((track, trackIndex) => {
        if (track.enabled && track.velocity > 0) {
          this.scheduleNote(time, trackIndex, track.velocity, step);
        }
      });
    }

    // Emit step event for UI updates
    this.emitStepEvent(this.currentStep, time);
  }

  private scheduleNote(time: number, trackIndex: number, velocity: number, step: PatternStep): void {
    // Apply swing to the timing
    let adjustedTime = time;
    if (this.swing > 0 && this.currentStep % 2 === 1) {
      const swingDelay = (this.stepLength * this.swing) / 100;
      adjustedTime += swingDelay;
    }

    // Emit note event for the audio service to handle
    this.emitNoteEvent({
      trackIndex,
      velocity,
      time: adjustedTime,
      step: this.currentStep,
      stepData: step
    });
  }

  private nextStep(): void {
    const stepsPerBeat = 4; // Assuming 16th note resolution
    const beatsPerBar = this.timeSignature[0];
    const stepsPerBar = stepsPerBeat * beatsPerBar;

    this.currentStep++;
    this.currentBeatInBar = Math.floor(this.currentStep / stepsPerBeat);

    if (this.pattern && this.currentStep >= this.pattern.steps.length) {
      this.currentStep = 0;
      this.currentBeatInBar = 0;
    }

    this.nextNoteTime += this.stepLength;
  }

  private calculateStepLength(): void {
    // Calculate the length of one step in seconds
    // Assuming 16th note resolution (4 steps per quarter note)
    const quarterNoteLength = 60 / this.bpm;
    this.stepLength = quarterNoteLength / 4;
  }

  private emitStepEvent(step: number, time: number): void {
    window.dispatchEvent(new CustomEvent('schedulerStep', {
      detail: {
        step,
        time,
        currentBeatInBar: this.currentBeatInBar,
        isPlaying: this.isPlaying
      }
    }));
  }

  private emitNoteEvent(event: {
    trackIndex: number;
    velocity: number;
    time: number;
    step: number;
    stepData: PatternStep;
  }): void {
    window.dispatchEvent(new CustomEvent('schedulerNote', {
      detail: event
    }));
  }

  // Public getters and setters
  isPlaying_(): boolean {
    return this.isPlaying;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getBpm(): number {
    return this.bpm;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
    this.calculateStepLength();
  }

  getTimeSignature(): [number, number] {
    return this.timeSignature;
  }

  setTimeSignature(numerator: number, denominator: number): void {
    this.timeSignature = [numerator, denominator];
    this.calculateStepLength();
  }

  getSwing(): number {
    return this.swing;
  }

  setSwing(swing: number): void {
    this.swing = Math.max(0, Math.min(100, swing));
  }

  getQuantize(): boolean {
    return this.quantize;
  }

  setQuantize(enabled: boolean): void {
    this.quantize = enabled;
  }

  getPattern(): Pattern | undefined {
    return this.pattern;
  }

  getCurrentBeatInBar(): number {
    return this.currentBeatInBar;
  }

  getPlaybackPosition(): number {
    const audioContext = this.audioProvider.getAudioContext();
    if (!audioContext || !this.isPlaying) return 0;
    
    const elapsed = audioContext.currentTime - (this.nextNoteTime - this.stepLength * this.currentStep);
    return elapsed;
  }

  setCurrentStep(step: number): void {
    if (this.pattern && step >= 0 && step < this.pattern.steps.length) {
      this.currentStep = step;
      this.currentBeatInBar = Math.floor(this.currentStep / 4);
      
      const audioContext = this.audioProvider.getAudioContext();
      if (audioContext && this.isPlaying) {
        this.nextNoteTime = audioContext.currentTime;
      }
    }
  }
}