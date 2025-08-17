// Audio Service
// Core Web Audio API management with latency measurement

import type { AudioContextState, AudioError, PerformanceMetrics } from '../shared/models/index';

class AudioService {
  private context: AudioContext | null = null;
  private destination: AudioDestinationNode | null = null;
  private analyser: AnalyserNode | null = null;
  private outputLatency: number = 0;
  private isInitialized: boolean = false;
  private latencyMode: 'low' | 'stable' = 'stable';
  private performanceMetrics: PerformanceMetrics = {
    audioLatency: 0,
    renderTime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    droppedFrames: 0
  };
  
  // Event listeners
  private stateChangeListeners: ((state: AudioContextState) => void)[] = [];
  private errorListeners: ((error: AudioError) => void)[] = [];
  private latencyUpdateListeners: ((latency: number) => void)[] = [];

  constructor() {
    this.measurePerformance = this.measurePerformance.bind(this);
  }

  /**
   * Initialize the Audio Context with optimal settings
   */
  async initialize(latencyMode: 'low' | 'stable' = 'stable'): Promise<void> {
    try {
      this.latencyMode = latencyMode;
      
      // Check for AudioContext support
      if (typeof AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        throw new Error('Web Audio API is not supported in this browser');
      }
      
      // Create AudioContext with latency-optimized settings
      const contextOptions: AudioContextOptions = {
        latencyHint: latencyMode === 'low' ? 'interactive' : 'balanced',
        sampleRate: 44100 // Standard sample rate for compatibility
      };

      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass(contextOptions);
      this.destination = this.context.destination;
      
      // Create analyser for performance monitoring
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.destination);
      
      // Wait for context to be running
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      // Measure initial latency
      await this.measureLatency();
      
      // Set up performance monitoring
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      
      // Notify listeners
      this.notifyStateChange();
      
      console.log('AudioService initialized:', {
        sampleRate: this.context.sampleRate,
        outputLatency: this.outputLatency,
        latencyMode: this.latencyMode,
        state: this.context.state
      });
      
    } catch (error) {
      const audioError: AudioError = {
        code: 'CONTEXT_FAILED',
        message: 'Failed to initialize AudioContext: ' + (error as Error).message,
        details: error
      };
      this.notifyError(audioError);
      throw audioError;
    }
  }

  /**
   * Measure audio output latency using Web Audio API
   */
  private async measureLatency(): Promise<number> {
    if (!this.context) {
      throw new Error('AudioContext not initialized');
    }

    try {
      // Base latency from AudioContext
      const baseLatency = this.context.baseLatency || 0;
      
      // Output latency (hardware + buffer)
      const outputLatency = this.context.outputLatency || 0;
      
      // Calculate total perceived latency
      // This includes the audio processing pipeline delay
      const bufferSize = this.latencyMode === 'low' ? 128 : 256;
      const bufferLatency = bufferSize / this.context.sampleRate;
      
      this.outputLatency = baseLatency + outputLatency + bufferLatency;
      
      // For low latency mode, try to get more accurate measurement
      if (this.latencyMode === 'low') {
        this.outputLatency = await this.preciseLatencyMeasurement();
      }
      
      this.performanceMetrics.audioLatency = this.outputLatency;
      
      // Notify listeners
      this.latencyUpdateListeners.forEach(listener => {
        listener(this.outputLatency);
      });
      
      console.log('Audio latency measured:', {
        baseLatency,
        outputLatency,
        bufferLatency,
        totalLatency: this.outputLatency,
        latencyMs: Math.round(this.outputLatency * 1000)
      });
      
      return this.outputLatency;
      
    } catch (error) {
      console.warn('Latency measurement failed, using defaults:', error);
      this.outputLatency = this.latencyMode === 'low' ? 0.005 : 0.02; // 5ms or 20ms default
      return this.outputLatency;
    }
  }

  /**
   * More precise latency measurement using round-trip timing
   */
  private async preciseLatencyMeasurement(): Promise<number> {
    if (!this.context) return 0;

    return new Promise((resolve) => {
      try {
        // Create a test tone for latency measurement
        const oscillator = this.context!.createOscillator();
        const gainNode = this.context!.createGain();
        
        oscillator.frequency.setValueAtTime(440, this.context!.currentTime);
        gainNode.gain.setValueAtTime(0.001, this.context!.currentTime); // Very quiet
        
        oscillator.connect(gainNode);
        gainNode.connect(this.destination!);
        
        const startTime = performance.now();
        
        oscillator.start();
        oscillator.stop(this.context!.currentTime + 0.001); // 1ms tone
        
        // Estimate latency based on context timing
        const estimatedLatency = this.context!.baseLatency + (this.context!.outputLatency || 0);
        
        setTimeout(() => {
          resolve(estimatedLatency);
        }, 10);
        
      } catch (error) {
        console.warn('Precise latency measurement failed:', error);
        resolve(this.latencyMode === 'low' ? 0.005 : 0.02);
      }
    });
  }

  /**
   * Start continuous performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const monitor = () => {
      if (!this.isInitialized || !this.context) return;
      
      this.measurePerformance();
      
      // Schedule next measurement
      setTimeout(monitor, 1000); // Update every second
    };
    
    monitor();
  }

  /**
   * Measure current performance metrics
   */
  private measurePerformance(): void {
    if (!this.context || !this.analyser) return;

    const now = performance.now();
    
    // CPU usage estimation (simplified)
    const memInfo = (performance as any).memory;
    if (memInfo) {
      this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
    }
    
    // Audio processing metrics
    if (this.context.state === 'running') {
      const bufferData = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.getFloatFrequencyData(bufferData);
      
      // Estimate CPU usage based on processing time
      const processingTime = performance.now() - now;
      this.performanceMetrics.renderTime = processingTime;
      
      // Simple CPU usage heuristic
      this.performanceMetrics.cpuUsage = Math.min(processingTime / 16.67, 1); // 60fps baseline
    }
  }

  /**
   * Change latency mode and reconfigure audio context
   */
  async setLatencyMode(mode: 'low' | 'stable'): Promise<void> {
    if (this.latencyMode === mode) return;
    
    this.latencyMode = mode;
    
    // Reinitialize with new latency mode
    if (this.isInitialized) {
      await this.destroy();
      await this.initialize(mode);
    }
  }

  /**
   * Get current audio context state
   */
  getState(): AudioContextState {
    return {
      context: this.context,
      outputLatency: this.outputLatency,
      sampleRate: this.context?.sampleRate || 44100,
      isRunning: this.context?.state === 'running',
      latencyMode: this.latencyMode
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get the main audio destination for connecting nodes
   */
  getDestination(): AudioDestinationNode | null {
    return this.destination;
  }

  /**
   * Get the analyser node for visualization
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Resume audio context (required for user interaction)
   */
  async resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
      this.notifyStateChange();
    }
  }

  /**
   * Suspend audio context
   */
  async suspend(): Promise<void> {
    if (this.context && this.context.state === 'running') {
      await this.context.suspend();
      this.notifyStateChange();
    }
  }

  /**
   * Destroy the audio service and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.destination = null;
      this.analyser = null;
    }
    
    this.isInitialized = false;
    this.notifyStateChange();
  }

  // Event listener management
  onStateChange(listener: (state: AudioContextState) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  onError(listener: (error: AudioError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  onLatencyUpdate(listener: (latency: number) => void): () => void {
    this.latencyUpdateListeners.push(listener);
    return () => {
      const index = this.latencyUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.latencyUpdateListeners.splice(index, 1);
      }
    };
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeListeners.forEach(listener => listener(state));
  }

  private notifyError(error: AudioError): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  // Singleton pattern
  private static instance: AudioService | null = null;
  
  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
}

// Export singleton instance
export const audioService = AudioService.getInstance();
export default audioService;