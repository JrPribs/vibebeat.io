import { AudioProvider } from './audio-engine';

export interface ChannelConfig {
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  effects?: AudioEffect[];
}

export interface AudioEffect {
  type: 'reverb' | 'delay' | 'filter' | 'compressor';
  parameters: Record<string, number>;
  enabled: boolean;
}

export class MixerService {
  private audioProvider: AudioProvider;
  private channels: Map<string, ChannelConfig> = new Map();
  private masterVolume: number = 0.8;
  private masterGainNode?: GainNode;

  constructor(audioProvider: AudioProvider) {
    this.audioProvider = audioProvider;
    this.initializeMasterChannel();
  }

  private initializeMasterChannel(): void {
    const audioContext = this.audioProvider.getAudioContext();
    if (audioContext) {
      this.masterGainNode = audioContext.createGain();
      this.masterGainNode.gain.value = this.masterVolume;
      this.masterGainNode.connect(audioContext.destination);
    }
  }

  createChannel(channelId: string, config?: Partial<ChannelConfig>): void {
    const defaultConfig: ChannelConfig = {
      volume: 1.0,
      pan: 0,
      mute: false,
      solo: false,
      effects: []
    };

    this.channels.set(channelId, { ...defaultConfig, ...config });
  }

  updateChannel(channelId: string, updates: Partial<ChannelConfig>): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      this.channels.set(channelId, { ...channel, ...updates });
    }
  }

  getChannel(channelId: string): ChannelConfig | undefined {
    return this.channels.get(channelId);
  }

  setChannelVolume(channelId: string, volume: number): void {
    this.updateChannel(channelId, { volume: Math.max(0, Math.min(1, volume)) });
  }

  setChannelPan(channelId: string, pan: number): void {
    this.updateChannel(channelId, { pan: Math.max(-1, Math.min(1, pan)) });
  }

  toggleChannelMute(channelId: string): void {
    const channel = this.getChannel(channelId);
    if (channel) {
      this.updateChannel(channelId, { mute: !channel.mute });
    }
  }

  toggleChannelSolo(channelId: string): void {
    const channel = this.getChannel(channelId);
    if (channel) {
      this.updateChannel(channelId, { solo: !channel.solo });
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getEffectiveVolume(channelId: string): number {
    const channel = this.getChannel(channelId);
    if (!channel || channel.mute) return 0;
    
    // Handle solo logic
    const hasSoloChannels = Array.from(this.channels.values()).some(ch => ch.solo);
    if (hasSoloChannels && !channel.solo) return 0;
    
    return channel.volume * this.masterVolume;
  }

  addEffect(channelId: string, effect: AudioEffect): void {
    const channel = this.getChannel(channelId);
    if (channel) {
      const effects = [...(channel.effects || []), effect];
      this.updateChannel(channelId, { effects });
    }
  }

  removeEffect(channelId: string, effectIndex: number): void {
    const channel = this.getChannel(channelId);
    if (channel && channel.effects) {
      const effects = channel.effects.filter((_, index) => index !== effectIndex);
      this.updateChannel(channelId, { effects });
    }
  }

  getAllChannels(): Map<string, ChannelConfig> {
    return new Map(this.channels);
  }

  reset(): void {
    this.channels.clear();
    this.setMasterVolume(0.8);
  }
}