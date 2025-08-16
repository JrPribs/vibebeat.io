export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  tracks: RecordingTrack[];
  bpm: number;
  timeSignature: [number, number];
}

export interface RecordingTrack {
  id: string;
  name: string;
  events: RecordingEvent[];
  muted: boolean;
  volume: number;
}

export interface RecordingEvent {
  timestamp: number;
  type: 'pad' | 'note' | 'cc';
  data: PadEvent | NoteEvent | CCEvent;
}

export interface PadEvent {
  padId: string;
  velocity: number;
}

export interface NoteEvent {
  note: number;
  velocity: number;
  duration?: number;
}

export interface CCEvent {
  controller: number;
  value: number;
}

export class RecordingService {
  private isRecording = false;
  private currentSession?: RecordingSession;
  private recordingStartTime = 0;
  private audioContext?: AudioContext;
  private recordedEvents: RecordingEvent[] = [];
  private metronomeEnabled = true;
  private countInBars = 1;
  private isCountingIn = false;
  private countInStartTime = 0;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext;
    this.setupEventListeners();
  }

  startRecording(sessionName: string, bpm: number = 120, timeSignature: [number, number] = [4, 4]): void {
    if (this.isRecording) {
      this.stopRecording();
    }

    this.currentSession = {
      id: this.generateSessionId(),
      name: sessionName,
      startTime: Date.now(),
      tracks: [{
        id: 'main',
        name: 'Main Track',
        events: [],
        muted: false,
        volume: 1.0
      }],
      bpm,
      timeSignature
    };

    this.recordedEvents = [];
    
    if (this.countInBars > 0) {
      this.startCountIn();
    } else {
      this.beginRecording();
    }
  }

  private startCountIn(): void {
    this.isCountingIn = true;
    this.countInStartTime = this.audioContext?.currentTime || Date.now() / 1000;
    
    const countInDuration = this.getCountInDuration();
    
    if (this.metronomeEnabled) {
      this.startMetronome(true);
    }
    
    setTimeout(() => {
      this.isCountingIn = false;
      this.beginRecording();
    }, countInDuration * 1000);
    
    this.emitRecordingEvent('countInStarted', {
      duration: countInDuration,
      bars: this.countInBars
    });
  }

  private beginRecording(): void {
    this.isRecording = true;
    this.recordingStartTime = this.audioContext?.currentTime || Date.now() / 1000;
    
    if (this.metronomeEnabled && !this.isCountingIn) {
      this.startMetronome(false);
    }
    
    this.emitRecordingEvent('recordingStarted', {
      sessionId: this.currentSession?.id,
      startTime: this.recordingStartTime
    });
  }

  stopRecording(): RecordingSession | null {
    if (!this.isRecording && !this.isCountingIn) {
      return null;
    }

    this.isRecording = false;
    this.isCountingIn = false;
    this.stopMetronome();

    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.tracks[0].events = [...this.recordedEvents];
      
      this.emitRecordingEvent('recordingStopped', {
        session: this.currentSession,
        eventCount: this.recordedEvents.length
      });
      
      const session = this.currentSession;
      this.currentSession = undefined;
      this.recordedEvents = [];
      
      return session;
    }

    return null;
  }

  pauseRecording(): void {
    if (this.isRecording) {
      this.isRecording = false;
      this.stopMetronome();
      
      this.emitRecordingEvent('recordingPaused', {
        sessionId: this.currentSession?.id
      });
    }
  }

  resumeRecording(): void {
    if (this.currentSession && !this.isRecording) {
      this.isRecording = true;
      
      if (this.metronomeEnabled) {
        this.startMetronome(false);
      }
      
      this.emitRecordingEvent('recordingResumed', {
        sessionId: this.currentSession.id
      });
    }
  }

  private setupEventListeners(): void {
    // Listen for pad trigger events
    window.addEventListener('padTrigger', (event: any) => {
      if (this.isRecording) {
        this.recordPadEvent(event.detail);
      }
    });
    
    // Listen for MIDI events if available
    window.addEventListener('midiNote', (event: any) => {
      if (this.isRecording) {
        this.recordNoteEvent(event.detail);
      }
    });
  }

  private recordPadEvent(padEvent: any): void {
    const currentTime = this.audioContext?.currentTime || Date.now() / 1000;
    const relativeTime = currentTime - this.recordingStartTime;
    
    const recordingEvent: RecordingEvent = {
      timestamp: relativeTime,
      type: 'pad',
      data: {
        padId: padEvent.padId,
        velocity: padEvent.velocity
      }
    };
    
    this.recordedEvents.push(recordingEvent);
    
    this.emitRecordingEvent('eventRecorded', {
      event: recordingEvent,
      totalEvents: this.recordedEvents.length
    });
  }

  private recordNoteEvent(noteEvent: any): void {
    const currentTime = this.audioContext?.currentTime || Date.now() / 1000;
    const relativeTime = currentTime - this.recordingStartTime;
    
    const recordingEvent: RecordingEvent = {
      timestamp: relativeTime,
      type: 'note',
      data: {
        note: noteEvent.note,
        velocity: noteEvent.velocity,
        duration: noteEvent.duration
      }
    };
    
    this.recordedEvents.push(recordingEvent);
    
    this.emitRecordingEvent('eventRecorded', {
      event: recordingEvent,
      totalEvents: this.recordedEvents.length
    });
  }

  private startMetronome(isCountIn: boolean): void {
    // Metronome implementation would go here
    // For now, just emit events for metronome beats
    this.emitRecordingEvent('metronomeStarted', { isCountIn });
  }

  private stopMetronome(): void {
    this.emitRecordingEvent('metronomeStopped', {});
  }

  private getCountInDuration(): number {
    if (!this.currentSession) return 0;
    
    const bpm = this.currentSession.bpm;
    const beatsPerBar = this.currentSession.timeSignature[0];
    const secondsPerBeat = 60 / bpm;
    
    return this.countInBars * beatsPerBar * secondsPerBeat;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitRecordingEvent(eventType: string, data: any): void {
    window.dispatchEvent(new CustomEvent('recordingEvent', {
      detail: {
        type: eventType,
        data,
        timestamp: Date.now()
      }
    }));
  }

  // Public getters and setters
  isRecording_(): boolean {
    return this.isRecording;
  }

  isCountingIn_(): boolean {
    return this.isCountingIn;
  }

  getCurrentSession(): RecordingSession | undefined {
    return this.currentSession;
  }

  getRecordedEvents(): RecordingEvent[] {
    return [...this.recordedEvents];
  }

  setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled;
  }

  getMetronomeEnabled(): boolean {
    return this.metronomeEnabled;
  }

  setCountInBars(bars: number): void {
    this.countInBars = Math.max(0, Math.min(8, bars));
  }

  getCountInBars(): number {
    return this.countInBars;
  }

  getRecordingDuration(): number {
    if (!this.isRecording || !this.recordingStartTime) return 0;
    
    const currentTime = this.audioContext?.currentTime || Date.now() / 1000;
    return currentTime - this.recordingStartTime;
  }

  clearCurrentSession(): void {
    if (!this.isRecording) {
      this.currentSession = undefined;
      this.recordedEvents = [];
    }
  }

  exportSession(session: RecordingSession): string {
    return JSON.stringify(session, null, 2);
  }

  importSession(sessionData: string): RecordingSession {
    return JSON.parse(sessionData);
  }
}