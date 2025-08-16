// Sample Editor Service - Phase 5
// Professional audio editing with upload, trim, slice, pitch, and stretch

export interface WaveformData {
  peaks: Float32Array;
  length: number;
  duration: number;
  sampleRate: number;
  samplesPerPixel: number;
}

export interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  bitDepth?: number;
  detectedBPM?: number;
}

export interface TransientSlice {
  position: number; // in seconds
  intensity: number; // 0-1
  id: string;
  assigned?: boolean;
  padIndex?: number;
}

export interface ProcessingOptions {
  quality: 'draft' | 'standard' | 'high';
  preserveFormants?: boolean;
  algorithm?: string;
}

export interface SampleEditorState {
  currentFile: File | null;
  audioBuffer: AudioBuffer | null;
  waveformData: WaveformData | null;
  fileInfo: AudioFileInfo | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Editing state
  trimStart: number;
  trimEnd: number;
  selectedRegion: { start: number; end: number } | null;
  
  // Slice state
  transientSlices: TransientSlice[];
  sliceSensitivity: number;
  
  // Processing state
  pitchShift: number; // semitones
  timeStretch: number; // ratio
  
  // Preview state
  isPlaying: boolean;
  playbackPosition: number;
}

class SampleEditorService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private currentFile: File | null = null;
  private waveformData: WaveformData | null = null;
  private listeners: ((state: SampleEditorState) => void)[] = [];
  private sourceNode: AudioBufferSourceNode | null = null;
  private playbackStartTime = 0;
  private playbackOffset = 0;
  
  private state: SampleEditorState = {
    currentFile: null,
    audioBuffer: null,
    waveformData: null,
    fileInfo: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    trimStart: 0,
    trimEnd: 0,
    selectedRegion: null,
    transientSlices: [],
    sliceSensitivity: 5,
    pitchShift: 0,
    timeStretch: 1,
    isPlaying: false,
    playbackPosition: 0
  };

  // Initialize audio context
  private async ensureAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Load audio file
  async loadFile(file: File): Promise<void> {
    this.setState({ isLoading: true, error: null });
    
    try {
      await this.ensureAudioContext();
      
      // Validate file type
      const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aiff', 'audio/m4a', 'audio/webm', 'audio/ogg'];
      if (!supportedTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      // Generate file info
      const fileInfo: AudioFileInfo = {
        name: file.name,
        size: file.size,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        format: file.type,
        detectedBPM: await this.detectBPM(audioBuffer)
      };
      
      // Generate waveform data
      const waveformData = this.generateWaveformData(audioBuffer);
      
      // Update state
      this.audioBuffer = audioBuffer;
      this.currentFile = file;
      this.waveformData = waveformData;
      
      this.setState({
        currentFile: file,
        audioBuffer,
        waveformData,
        fileInfo,
        isLoading: false,
        trimStart: 0,
        trimEnd: audioBuffer.duration,
        transientSlices: await this.detectTransients(audioBuffer, 5)
      });
      
    } catch (error) {
      this.setState({
        isLoading: false,
        error: `Failed to load audio file: ${error.message}`
      });
    }
  }

  // Generate waveform data for visualization
  private generateWaveformData(buffer: AudioBuffer, width: number = 800): WaveformData {
    const channelData = buffer.getChannelData(0); // Use first channel
    const samplesPerPixel = Math.floor(buffer.length / width);
    const peaks = new Float32Array(width);
    
    for (let i = 0; i < width; i++) {
      const start = i * samplesPerPixel;
      const end = start + samplesPerPixel;
      let peak = 0;
      
      for (let j = start; j < end && j < channelData.length; j++) {
        peak = Math.max(peak, Math.abs(channelData[j]));
      }
      
      peaks[i] = peak;
    }
    
    return {
      peaks,
      length: width,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      samplesPerPixel
    };
  }

  // Basic BPM detection
  private async detectBPM(buffer: AudioBuffer): Promise<number | undefined> {
    // Simplified BPM detection using autocorrelation
    // This is a basic implementation - could be enhanced with more sophisticated algorithms
    
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Use a smaller window for analysis (first 30 seconds max)
    const analysisLength = Math.min(channelData.length, sampleRate * 30);
    const analysisData = channelData.slice(0, analysisLength);
    
    // Apply energy-based onset detection
    const frameSize = 1024;
    const hopSize = 512;
    const frames = Math.floor((analysisData.length - frameSize) / hopSize);
    const energy = new Float32Array(frames);
    
    for (let i = 0; i < frames; i++) {
      const start = i * hopSize;
      let frameEnergy = 0;
      
      for (let j = 0; j < frameSize; j++) {
        frameEnergy += analysisData[start + j] * analysisData[start + j];
      }
      
      energy[i] = frameEnergy / frameSize;
    }
    
    // Find peaks in energy
    const peaks = [];
    for (let i = 1; i < energy.length - 1; i++) {
      if (energy[i] > energy[i - 1] && energy[i] > energy[i + 1] && energy[i] > 0.01) {
        peaks.push(i * hopSize / sampleRate);
      }
    }
    
    if (peaks.length < 4) return undefined;
    
    // Calculate intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // Find most common interval (simplified)
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    if (medianInterval > 0 && medianInterval < 2) {
      const bpm = 60 / medianInterval;
      return Math.round(bpm);
    }
    
    return undefined;
  }

  // Detect transients for slicing
  private async detectTransients(buffer: AudioBuffer, sensitivity: number): Promise<TransientSlice[]> {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Energy-based onset detection
    const frameSize = 1024;
    const hopSize = 256;
    const frames = Math.floor((channelData.length - frameSize) / hopSize);
    
    const energy = new Float32Array(frames);
    const spectralFlux = new Float32Array(frames);
    
    // Calculate energy and spectral flux
    for (let i = 0; i < frames; i++) {
      const start = i * hopSize;
      let frameEnergy = 0;
      
      for (let j = 0; j < frameSize; j++) {
        const sample = channelData[start + j] || 0;
        frameEnergy += sample * sample;
      }
      
      energy[i] = Math.sqrt(frameEnergy / frameSize);
      
      // Simple spectral flux approximation
      if (i > 0) {
        spectralFlux[i] = Math.max(0, energy[i] - energy[i - 1]);
      }
    }
    
    // Find peaks based on sensitivity
    const threshold = this.calculateAdaptiveThreshold(spectralFlux, sensitivity);
    const transients: TransientSlice[] = [];
    
    for (let i = 1; i < spectralFlux.length - 1; i++) {
      if (spectralFlux[i] > threshold &&
          spectralFlux[i] > spectralFlux[i - 1] &&
          spectralFlux[i] > spectralFlux[i + 1]) {
        
        const timePosition = (i * hopSize) / sampleRate;
        const intensity = Math.min(1, spectralFlux[i] / (threshold * 2));
        
        transients.push({
          position: timePosition,
          intensity,
          id: `slice_${i}_${Date.now()}`,
          assigned: false
        });
      }
    }
    
    // Sort by position and limit to reasonable number
    transients.sort((a, b) => a.position - b.position);
    return transients.slice(0, 32); // Max 32 slices
  }

  // Calculate adaptive threshold based on sensitivity
  private calculateAdaptiveThreshold(data: Float32Array, sensitivity: number): number {
    // Calculate mean and standard deviation
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const mean = sum / data.length;
    
    let variance = 0;
    for (let i = 0; i < data.length; i++) {
      variance += (data[i] - mean) * (data[i] - mean);
    }
    const stdDev = Math.sqrt(variance / data.length);
    
    // Sensitivity from 1-10 maps to threshold multiplier
    const multiplier = (11 - sensitivity) * 0.5; // 5.0 to 0.5
    return mean + stdDev * multiplier;
  }

  // Trim audio buffer
  trimAudio(startSec: number, endSec: number): AudioBuffer {
    if (!this.audioBuffer) throw new Error('No audio buffer loaded');
    
    const sampleRate = this.audioBuffer.sampleRate;
    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.floor(endSec * sampleRate);
    const length = endSample - startSample;
    
    const trimmedBuffer = this.audioContext!.createBuffer(
      this.audioBuffer.numberOfChannels,
      length,
      sampleRate
    );
    
    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const originalData = this.audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        trimmedData[i] = originalData[startSample + i] || 0;
      }
    }
    
    return trimmedBuffer;
  }

  // Auto-trim silence
  autoTrimSilence(thresholdDb: number = -40): { start: number; end: number } {
    if (!this.audioBuffer) throw new Error('No audio buffer loaded');
    
    const channelData = this.audioBuffer.getChannelData(0);
    const threshold = Math.pow(10, thresholdDb / 20); // Convert dB to linear
    const sampleRate = this.audioBuffer.sampleRate;
    
    // Find start
    let startSample = 0;
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > threshold) {
        startSample = Math.max(0, i - Math.floor(sampleRate * 0.1)); // 100ms before
        break;
      }
    }
    
    // Find end
    let endSample = channelData.length - 1;
    for (let i = channelData.length - 1; i >= 0; i--) {
      if (Math.abs(channelData[i]) > threshold) {
        endSample = Math.min(channelData.length - 1, i + Math.floor(sampleRate * 0.1)); // 100ms after
        break;
      }
    }
    
    return {
      start: startSample / sampleRate,
      end: endSample / sampleRate
    };
  }

  // Basic pitch shifting (simplified implementation)
  async pitchShift(semitones: number, options: ProcessingOptions = { quality: 'standard' }): Promise<AudioBuffer> {
    if (!this.audioBuffer) throw new Error('No audio buffer loaded');
    
    // Simple pitch shifting using playback rate adjustment
    // This is a basic implementation - real pitch shifting would use PSOLA or phase vocoder
    const ratio = Math.pow(2, semitones / 12);
    return this.timeStretch(1 / ratio, options);
  }

  // Basic time stretching
  async timeStretch(ratio: number, options: ProcessingOptions = { quality: 'standard' }): Promise<AudioBuffer> {
    if (!this.audioBuffer) throw new Error('No audio buffer loaded');
    
    const originalBuffer = this.audioBuffer;
    const newLength = Math.floor(originalBuffer.length * ratio);
    
    const stretchedBuffer = this.audioContext!.createBuffer(
      originalBuffer.numberOfChannels,
      newLength,
      originalBuffer.sampleRate
    );
    
    // Simple linear interpolation time stretching
    // Real-world implementation would use WSOLA or phase vocoder
    for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
      const originalData = originalBuffer.getChannelData(channel);
      const stretchedData = stretchedBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        const position = i / ratio;
        const index = Math.floor(position);
        const fraction = position - index;
        
        if (index < originalData.length - 1) {
          stretchedData[i] = originalData[index] * (1 - fraction) + originalData[index + 1] * fraction;
        } else if (index < originalData.length) {
          stretchedData[i] = originalData[index];
        }
      }
    }
    
    return stretchedBuffer;
  }

  // Play audio preview
  async playPreview(startTime: number = 0): Promise<void> {
    if (!this.audioBuffer || !this.audioContext) return;
    
    this.stopPreview();
    
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.audioContext.destination);
    
    this.sourceNode.onended = () => {
      this.setState({ isPlaying: false, playbackPosition: 0 });
    };
    
    this.sourceNode.start(0, startTime);
    this.playbackStartTime = this.audioContext.currentTime;
    this.playbackOffset = startTime;
    
    this.setState({ isPlaying: true });
    this.startPlaybackTracking();
  }

  // Stop audio preview
  stopPreview(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    this.setState({ isPlaying: false, playbackPosition: 0 });
  }

  // Track playback position
  private startPlaybackTracking(): void {
    const updatePosition = () => {
      if (this.state.isPlaying && this.audioContext) {
        const elapsed = this.audioContext.currentTime - this.playbackStartTime;
        const position = this.playbackOffset + elapsed;
        
        this.setState({ playbackPosition: position });
        
        if (position < this.audioBuffer!.duration) {
          requestAnimationFrame(updatePosition);
        }
      }
    };
    
    requestAnimationFrame(updatePosition);
  }

  // Update slice sensitivity and recalculate
  async updateSliceSensitivity(sensitivity: number): Promise<void> {
    if (!this.audioBuffer) return;
    
    this.setState({ sliceSensitivity: sensitivity });
    const transients = await this.detectTransients(this.audioBuffer, sensitivity);
    this.setState({ transientSlices: transients });
  }

  // Get current state
  getState(): SampleEditorState {
    return { ...this.state };
  }

  // Set state and notify listeners
  private setState(updates: Partial<SampleEditorState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Subscribe to state changes
  subscribe(listener: (state: SampleEditorState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Cleanup
  dispose(): void {
    this.stopPreview();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const sampleEditorService = new SampleEditorService();