// Recording Service - Phase 4
// Comprehensive microphone recording with bar-sync, processing, and assignment


export interface RecordingOptions {
  barSync: boolean;
  countIn: boolean;
  maxBars: number;
  autoTrim: boolean;
  quantizeToBar: boolean;
}

export interface AudioClip {
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  originalSampleRate: number;
  startTime: number;
  endTime: number;
  metadata: {
    barSync: boolean;
    bpm?: number;
    key?: string;
    slices?: { time: number; intensity: number }[];
    trimmed?: { start: number; end: number };
  };
}

export interface RecordingState {
  isRecording: boolean;
  isWaitingForDownbeat: boolean;
  isCountingIn: boolean;
  hasPermission: boolean;
  inputLevel: number;
  recordingTime: number;
  currentClip: AudioClip | null;
  error: string | null;
}

class RecordingService {
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private audioContext: AudioContext | null = null;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private isWaitingForDownbeat = false;
  private isCountingIn = false;
  private recordingStartTime = 0;
  private inputLevel = 0;
  private listeners: ((state: RecordingState) => void)[] = [];
  private animationFrame: number | null = null;

  // State getters
  get state(): RecordingState {
    return {
      isRecording: this.isRecording,
      isWaitingForDownbeat: this.isWaitingForDownbeat,
      isCountingIn: this.isCountingIn,
      hasPermission: this.mediaStream !== null,
      inputLevel: this.inputLevel,
      recordingTime: this.isRecording ? (Date.now() - this.recordingStartTime) / 1000 : 0,
      currentClip: null, // Will be set after recording
      error: null
    };
  }

  // Request microphone permission
  async requestPermission(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          autoGainControl: false,
          noiseSuppression: false,
          echoCancellation: true
        }
      });

      await this.setupAudioNodes();
      this.startInputMonitoring();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.notifyListeners();
      return false;
    }
  }

  // Setup Web Audio API nodes
  private async setupAudioNodes(): Promise<void> {
    if (!this.mediaStream) throw new Error('No media stream available');

    // Create or reuse audio context
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
    }

    // Ensure audio context is running
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create audio nodes
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.gainNode = this.audioContext.createGain();
    this.analyzerNode = this.audioContext.createAnalyser();
    this.monitorGainNode = this.audioContext.createGain();

    // Configure analyzer
    this.analyzerNode.fftSize = 256;
    this.analyzerNode.smoothingTimeConstant = 0.3;

    // Connect nodes
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.analyzerNode);
    this.gainNode.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.audioContext.destination);

    // Set initial values
    this.setInputGain(0); // 0dB
    this.setMonitorEnabled(false); // Monitor off by default for safety
  }

  // Set input gain (-20dB to +20dB)
  setInputGain(gainDb: number): void {
    if (this.gainNode) {
      const gainLinear = Math.pow(10, gainDb / 20);
      this.gainNode.gain.setValueAtTime(gainLinear, this.audioContext!.currentTime);
    }
  }

  // Set monitor enabled/disabled
  setMonitorEnabled(enabled: boolean): void {
    if (this.monitorGainNode) {
      // Use a small gain to avoid complete silence but allow monitoring
      this.monitorGainNode.gain.setValueAtTime(enabled ? 0.5 : 0, this.audioContext!.currentTime);
    }
  }

  // Start input level monitoring
  private startInputMonitoring(): void {
    if (!this.analyzerNode) return;

    const dataArray = new Uint8Array(this.analyzerNode.frequencyBinCount);
    
    const updateLevel = () => {
      if (!this.analyzerNode) return;
      
      this.analyzerNode.getByteFrequencyData(dataArray);
      
      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      this.inputLevel = rms / 255; // Normalize to 0-1
      
      this.notifyListeners();
      this.animationFrame = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }

  // Start recording with options
  async startRecording(options: RecordingOptions): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('No microphone permission');
    }

    if (this.isRecording) {
      throw new Error('Already recording');
    }

    this.recordedChunks = [];
    
    // Setup MediaRecorder
    this.recorder = new MediaRecorder(this.mediaStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    if (options.barSync) {
      // Bar sync functionality temporarily disabled - can be re-implemented with ToneTransportService
      console.log('Bar sync recording requested but temporarily disabled');
      this.isWaitingForDownbeat = false;
      if (options.countIn) {
        this.startCountIn(() => this.actuallyStartRecording(options));
      } else {
        this.actuallyStartRecording(options);
      }
    } else {
      if (options.countIn) {
        this.startCountIn(() => this.actuallyStartRecording(options));
      } else {
        this.actuallyStartRecording(options);
      }
    }
  }

  // Start count-in sequence
  private startCountIn(callback: () => void): void {
    this.isCountingIn = true;
    this.notifyListeners();
    
    // TODO: Connect to metronome for count-in
    // For now, simulate 1 bar count-in
    setTimeout(() => {
      this.isCountingIn = false;
      callback();
    }, 2000); // 2 seconds for 1 bar at 120 BPM
  }

  // Actually start recording
  private actuallyStartRecording(options: RecordingOptions): void {
    if (!this.recorder) return;
    
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.recorder.start(100); // Collect data every 100ms
    
    // Auto-stop after max duration
    setTimeout(() => {
      if (this.isRecording) {
        this.stopRecording();
      }
    }, options.maxBars * 2000); // 2 seconds per bar at 120 BPM
    
    this.notifyListeners();
  }

  // Stop recording
  async stopRecording(): Promise<AudioClip> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          const audioBuffer = await this.convertBlobToAudioBuffer(audioBlob);
          const clip = await this.processRecording(audioBuffer);
          
          this.isRecording = false;
          this.notifyListeners();
          
          resolve(clip);
        } catch (error) {
          reject(error);
        }
      };

      this.recorder.stop();
    });
  }

  // Convert blob to AudioBuffer
  private async convertBlobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return this.audioContext!.decodeAudioData(arrayBuffer);
  }

  // Process recorded audio
  private async processRecording(buffer: AudioBuffer): Promise<AudioClip> {
    const clip: AudioClip = {
      buffer,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      originalSampleRate: buffer.sampleRate,
      startTime: 0,
      endTime: buffer.duration,
      metadata: {
        barSync: false
      }
    };

    // TODO: Implement post-processing
    // - Auto-trim silence
    // - BPM detection
    // - Key detection
    // - Quantize to bar

    return clip;
  }

  // Emergency stop
  emergencyStop(): void {
    if (this.recorder && this.isRecording) {
      this.recorder.stop();
      this.isRecording = false;
      this.isWaitingForDownbeat = false;
      this.isCountingIn = false;
      this.notifyListeners();
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: RecordingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Cleanup
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const recordingService = new RecordingService();
