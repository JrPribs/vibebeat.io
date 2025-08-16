// Mixer Service
// Basic mixing controls for pads and tracks with gain/pan

import type { PadName, MixerChannelState } from '../shared/models/index';
import { audioService } from './audio-service';
import { padTriggerService } from './pad-trigger-service';

interface MixerChannel {
  id: string;
  name: string;
  type: 'pad' | 'track' | 'master';
  gainNode: GainNode;
  panNode: StereoPannerNode;
  analyserNode: AnalyserNode;
  state: MixerChannelState;
}

interface MixerState {
  masterVolume: number;
  channels: Map<string, MixerChannel>;
  isInitialized: boolean;
}

class MixerService {
  private mixerState: MixerState = {
    masterVolume: 0.8,
    channels: new Map(),
    isInitialized: false
  };
  
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private outputNode: AudioNode | null = null;
  
  // Event listeners
  private channelUpdateListeners: ((channelId: string, state: MixerChannelState) => void)[] = [];
  private levelUpdateListeners: ((levels: Map<string, { rms: number; peak: number }>) => void)[] = [];
  private masterLevelListeners: ((level: { rms: number; peak: number }) => void)[] = [];
  
  // Level monitoring
  private levelMonitoringActive: boolean = false;
  private levelMonitoringInterval: number | null = null;

  constructor() {
    this.setupMasterChain();
    this.createPadChannels();
    this.startLevelMonitoring();
  }

  /**
   * Set up master audio processing chain
   */
  private setupMasterChain(): void {
    const context = audioService.getState().context;
    if (!context) return;

    try {
      // Create master gain
      this.masterGain = context.createGain();
      this.masterGain.gain.setValueAtTime(this.mixerState.masterVolume, context.currentTime);
      
      // Create master analyser for level monitoring
      this.masterAnalyser = context.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      this.masterAnalyser.smoothingTimeConstant = 0.8;
      
      // Connect: master gain -> analyser -> destination
      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(context.destination);
      
      this.outputNode = this.masterGain;
      this.mixerState.isInitialized = true;
      
      console.log('Mixer master chain initialized');
      
    } catch (error) {
      console.error('Failed to setup mixer master chain:', error);
    }
  }

  /**
   * Create mixer channels for each drum pad
   */
  private createPadChannels(): void {
    const context = audioService.getState().context;
    if (!context || !this.outputNode) return;

    const padNames: PadName[] = [
      'KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN',
      'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH',
      'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02',
      'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16'
    ];

    for (const padName of padNames) {
      this.createChannel(padName, padName, 'pad');
    }
  }

  /**
   * Create a mixer channel
   */
  private createChannel(id: string, name: string, type: 'pad' | 'track' | 'master'): MixerChannel | null {
    const context = audioService.getState().context;
    if (!context || !this.outputNode) return null;

    try {
      // Create audio nodes
      const gainNode = context.createGain();
      const panNode = context.createStereoPanner();
      const analyserNode = context.createAnalyser();
      
      // Configure nodes
      gainNode.gain.setValueAtTime(1.0, context.currentTime);
      panNode.pan.setValueAtTime(0, context.currentTime);
      analyserNode.fftSize = 128;
      analyserNode.smoothingTimeConstant = 0.8;
      
      // Connect: input -> gain -> pan -> analyser -> output
      gainNode.connect(panNode);
      panNode.connect(analyserNode);
      analyserNode.connect(this.outputNode);
      
      // Create channel state
      const state: MixerChannelState = {
        vol: 1.0,
        pan: 0,
        sendA: 0,
        sendB: 0,
        mute: false,
        solo: false,
        inputGain: 1.0
      };
      
      const channel: MixerChannel = {
        id,
        name,
        type,
        gainNode,
        panNode,
        analyserNode,
        state
      };
      
      this.mixerState.channels.set(id, channel);
      
      // For pad channels, update the pad trigger service
      if (type === 'pad') {
        padTriggerService.setPadGain(id as PadName, state.vol);
        padTriggerService.setPadPan(id as PadName, state.pan);
      }
      
      return channel;
      
    } catch (error) {
      console.error(`Failed to create mixer channel ${id}:`, error);
      return null;
    }
  }

  /**
   * Set channel volume
   */
  setChannelVolume(channelId: string, volume: number): void {
    const channel = this.mixerState.channels.get(channelId);
    if (!channel) return;

    const context = audioService.getState().context;
    if (!context) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    const dbValue = clampedVolume === 0 ? -60 : 20 * Math.log10(clampedVolume);
    const gainValue = Math.pow(10, dbValue / 20);
    
    // Apply gain with smooth transition
    channel.gainNode.gain.setTargetAtTime(
      gainValue,
      context.currentTime,
      0.01 // 10ms transition
    );
    
    channel.state.vol = clampedVolume;
    
    // Update pad trigger service for pad channels
    if (channel.type === 'pad') {
      padTriggerService.setPadGain(channelId as PadName, clampedVolume);
    }
    
    this.notifyChannelUpdate(channelId, channel.state);
  }

  /**
   * Set channel panning
   */
  setChannelPan(channelId: string, pan: number): void {
    const channel = this.mixerState.channels.get(channelId);
    if (!channel) return;

    const context = audioService.getState().context;
    if (!context) return;

    const clampedPan = Math.max(-1, Math.min(1, pan));
    
    channel.panNode.pan.setTargetAtTime(
      clampedPan,
      context.currentTime,
      0.01
    );
    
    channel.state.pan = clampedPan;
    
    // Update pad trigger service for pad channels
    if (channel.type === 'pad') {
      padTriggerService.setPadPan(channelId as PadName, clampedPan);
    }
    
    this.notifyChannelUpdate(channelId, channel.state);
  }

  /**
   * Set channel mute state
   */
  setChannelMute(channelId: string, muted: boolean): void {
    const channel = this.mixerState.channels.get(channelId);
    if (!channel) return;

    channel.state.mute = muted;
    
    // Apply mute by setting gain to 0 or restoring original volume
    const targetGain = muted ? 0 : channel.state.vol;
    this.setChannelVolume(channelId, targetGain);
    
    this.notifyChannelUpdate(channelId, channel.state);
  }

  /**
   * Set channel solo state
   */
  setChannelSolo(channelId: string, soloed: boolean): void {
    const channel = this.mixerState.channels.get(channelId);
    if (!channel) return;

    channel.state.solo = soloed;
    
    // Handle solo logic - mute all other channels if this one is soloed
    if (soloed) {
      for (const [id, ch] of this.mixerState.channels) {
        if (id !== channelId && !ch.state.solo) {
          this.setChannelMute(id, true);
        }
      }
    } else {
      // If no channels are soloed, unmute all
      const hasSoloChannels = Array.from(this.mixerState.channels.values())
        .some(ch => ch.state.solo);
      
      if (!hasSoloChannels) {
        for (const [id, ch] of this.mixerState.channels) {
          if (ch.state.mute) {
            this.setChannelMute(id, false);
          }
        }
      }
    }
    
    this.notifyChannelUpdate(channelId, channel.state);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (!this.masterGain) return;

    const context = audioService.getState().context;
    if (!context) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    const dbValue = clampedVolume === 0 ? -60 : 20 * Math.log10(clampedVolume);
    const gainValue = Math.pow(10, dbValue / 20);
    
    this.masterGain.gain.setTargetAtTime(
      gainValue,
      context.currentTime,
      0.01
    );
    
    this.mixerState.masterVolume = clampedVolume;
    
    // Update pad trigger service master gain
    padTriggerService.setMasterGain(clampedVolume);
  }

  /**
   * Get channel state
   */
  getChannelState(channelId: string): MixerChannelState | null {
    const channel = this.mixerState.channels.get(channelId);
    return channel ? { ...channel.state } : null;
  }

  /**
   * Get all channel states
   */
  getAllChannelStates(): Map<string, MixerChannelState> {
    const states = new Map<string, MixerChannelState>();
    for (const [id, channel] of this.mixerState.channels) {
      states.set(id, { ...channel.state });
    }
    return states;
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.mixerState.masterVolume;
  }

  /**
   * Start level monitoring
   */
  private startLevelMonitoring(): void {
    if (this.levelMonitoringActive) return;
    
    this.levelMonitoringActive = true;
    
    const updateLevels = () => {
      if (!this.levelMonitoringActive) return;
      
      const channelLevels = new Map<string, { rms: number; peak: number }>();
      
      // Monitor each channel
      for (const [id, channel] of this.mixerState.channels) {
        const levels = this.getChannelLevels(channel.analyserNode);
        channelLevels.set(id, levels);
      }
      
      // Monitor master
      if (this.masterAnalyser) {
        const masterLevels = this.getChannelLevels(this.masterAnalyser);
        this.masterLevelListeners.forEach(listener => listener(masterLevels));
      }
      
      this.levelUpdateListeners.forEach(listener => listener(channelLevels));
      
      // Schedule next update
      this.levelMonitoringInterval = window.setTimeout(updateLevels, 50); // 20 FPS
    };
    
    updateLevels();
  }

  /**
   * Get audio levels from analyser node
   */
  private getChannelLevels(analyser: AnalyserNode): { rms: number; peak: number } {
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);
    
    let sum = 0;
    let peak = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const sample = Math.abs(dataArray[i]);
      sum += sample * sample;
      peak = Math.max(peak, sample);
    }
    
    const rms = Math.sqrt(sum / bufferLength);
    
    return {
      rms: rms,
      peak: peak
    };
  }

  /**
   * Stop level monitoring
   */
  stopLevelMonitoring(): void {
    this.levelMonitoringActive = false;
    if (this.levelMonitoringInterval) {
      clearTimeout(this.levelMonitoringInterval);
      this.levelMonitoringInterval = null;
    }
  }

  /**
   * Reset all channels to default settings
   */
  resetAllChannels(): void {
    for (const [id] of this.mixerState.channels) {
      this.setChannelVolume(id, 1.0);
      this.setChannelPan(id, 0);
      this.setChannelMute(id, false);
      this.setChannelSolo(id, false);
    }
    
    this.setMasterVolume(0.8);
  }

  /**
   * Get mixer state
   */
  getState(): { 
    isInitialized: boolean; 
    masterVolume: number; 
    channelCount: number;
  } {
    return {
      isInitialized: this.mixerState.isInitialized,
      masterVolume: this.mixerState.masterVolume,
      channelCount: this.mixerState.channels.size
    };
  }

  // Event listener management
  onChannelUpdate(listener: (channelId: string, state: MixerChannelState) => void): () => void {
    this.channelUpdateListeners.push(listener);
    return () => {
      const index = this.channelUpdateListeners.indexOf(listener);
      if (index > -1) this.channelUpdateListeners.splice(index, 1);
    };
  }

  onLevelUpdate(listener: (levels: Map<string, { rms: number; peak: number }>) => void): () => void {
    this.levelUpdateListeners.push(listener);
    return () => {
      const index = this.levelUpdateListeners.indexOf(listener);
      if (index > -1) this.levelUpdateListeners.splice(index, 1);
    };
  }

  onMasterLevelUpdate(listener: (level: { rms: number; peak: number }) => void): () => void {
    this.masterLevelListeners.push(listener);
    return () => {
      const index = this.masterLevelListeners.indexOf(listener);
      if (index > -1) this.masterLevelListeners.splice(index, 1);
    };
  }

  private notifyChannelUpdate(channelId: string, state: MixerChannelState): void {
    this.channelUpdateListeners.forEach(listener => listener(channelId, state));
  }

  /**
   * Destroy the mixer and clean up resources
   */
  destroy(): void {
    this.stopLevelMonitoring();
    
    // Disconnect all nodes
    for (const channel of this.mixerState.channels.values()) {
      channel.gainNode.disconnect();
      channel.panNode.disconnect();
      channel.analyserNode.disconnect();
    }
    
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    
    if (this.masterAnalyser) {
      this.masterAnalyser.disconnect();
      this.masterAnalyser = null;
    }
    
    this.mixerState.channels.clear();
    this.mixerState.isInitialized = false;
  }

  // Singleton pattern
  private static instance: MixerService | null = null;
  
  static getInstance(): MixerService {
    if (!MixerService.instance) {
      MixerService.instance = new MixerService();
    }
    return MixerService.instance;
  }
}

// Export singleton instance
export const mixerService = MixerService.getInstance();
export default mixerService;