// Tone Mixer Service
// Audio mixing and effects using Tone.js Channel and effects

import Tone from 'tone';

interface ChannelConfig {
  volume?: number; // -60 to 0 dB
  pan?: number; // -1 to 1
  mute?: boolean;
  solo?: boolean;
}

interface EffectConfig {
  type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'eq3';
  params?: Record<string, any>;
}

class ToneMixerService {
  private channels: Map<string, Tone.Channel> = new Map();
  private effects: Map<string, Tone.ToneAudioNode> = new Map();
  private masterBus: Tone.Channel | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize will be called after Tone.start()
  }

  /**
   * Initialize the mixer service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure Tone.js is started
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Create master bus
      this.masterBus = new Tone.Channel().toDestination();

      this.isInitialized = true;
      console.log('ToneMixerService initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize ToneMixerService:', error);
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
   * Create a new mixer channel
   */
  async createChannel(channelId: string, config: ChannelConfig = {}): Promise<Tone.Channel> {
    await this.ensureInitialized();

    if (!this.masterBus) {
      throw new Error('Master bus not initialized');
    }

    // Create new channel
    const channel = new Tone.Channel({
      volume: config.volume || -12, // Start at reasonable level
      pan: config.pan || 0,
      mute: config.mute || false,
      solo: config.solo || false,
    });

    // Connect to master bus
    channel.connect(this.masterBus);

    // Store channel
    this.channels.set(channelId, channel);

    console.log(`Created mixer channel: ${channelId}`);
    return channel;
  }

  /**
   * Get existing channel or create new one
   */
  async getChannel(channelId: string): Promise<Tone.Channel> {
    let channel = this.channels.get(channelId);
    if (!channel) {
      channel = await this.createChannel(channelId);
    }
    return channel;
  }

  /**
   * Remove a channel
   */
  removeChannel(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.dispose();
      this.channels.delete(channelId);
      console.log(`Removed mixer channel: ${channelId}`);
    }
  }

  /**
   * Update channel configuration
   */
  updateChannel(channelId: string, config: ChannelConfig): void {
    const channel = this.channels.get(channelId);
    if (!channel) {
      console.warn(`Channel ${channelId} not found`);
      return;
    }

    if (config.volume !== undefined) {
      channel.volume.value = Math.max(-60, Math.min(0, config.volume));
    }
    if (config.pan !== undefined) {
      channel.pan.value = Math.max(-1, Math.min(1, config.pan));
    }
    if (config.mute !== undefined) {
      channel.mute = config.mute;
    }
    if (config.solo !== undefined) {
      channel.solo = config.solo;
    }
  }

  /**
   * Create and add an effect to a channel
   */
  async addEffect(channelId: string, effectId: string, effectConfig: EffectConfig): Promise<Tone.ToneAudioNode | null> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      console.warn(`Channel ${channelId} not found`);
      return null;
    }

    let effect: Tone.ToneAudioNode;

    try {
      // Create effect based on type
      switch (effectConfig.type) {
        case 'reverb':
          effect = new Tone.Reverb({
            decay: effectConfig.params?.decay || 1.5,
            preDelay: effectConfig.params?.preDelay || 0.01,
            wet: effectConfig.params?.wet || 0.3,
          });
          break;

        case 'delay':
          effect = new Tone.FeedbackDelay({
            delayTime: effectConfig.params?.delayTime || '8n',
            feedback: effectConfig.params?.feedback || 0.3,
            wet: effectConfig.params?.wet || 0.2,
          });
          break;

        case 'distortion':
          effect = new Tone.Distortion({
            distortion: effectConfig.params?.distortion || 0.4,
            oversample: effectConfig.params?.oversample || '4x',
            wet: effectConfig.params?.wet || 0.5,
          });
          break;

        case 'filter':
          effect = new Tone.Filter({
            frequency: effectConfig.params?.frequency || 1000,
            type: effectConfig.params?.type || 'lowpass',
            Q: effectConfig.params?.Q || 1,
          });
          break;

        case 'eq3':
          effect = new Tone.EQ3({
            low: effectConfig.params?.low || 0,
            mid: effectConfig.params?.mid || 0,
            high: effectConfig.params?.high || 0,
            lowFrequency: effectConfig.params?.lowFrequency || 400,
            highFrequency: effectConfig.params?.highFrequency || 2500,
          });
          break;

        default:
          console.warn(`Unknown effect type: ${effectConfig.type}`);
          return null;
      }

      // Connect effect to channel
      channel.chain(effect, this.masterBus!);

      // Store effect
      this.effects.set(effectId, effect);

      console.log(`Added ${effectConfig.type} effect to channel ${channelId}`);
      return effect;

    } catch (error) {
      console.error(`Failed to create ${effectConfig.type} effect:`, error);
      return null;
    }
  }

  /**
   * Remove an effect
   */
  removeEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      effect.dispose();
      this.effects.delete(effectId);
      console.log(`Removed effect: ${effectId}`);
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volumeDb: number): void {
    if (!this.masterBus) return;

    const clampedVolume = Math.max(-60, Math.min(0, volumeDb));
    this.masterBus.volume.value = clampedVolume;
  }

  /**
   * Set master volume from linear scale (0-1)
   */
  setMasterVolumeLinear(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const volumeDb = clampedVolume === 0 ? -60 : 20 * Math.log10(clampedVolume);
    this.setMasterVolume(volumeDb);
  }

  /**
   * Get all channel IDs
   */
  getChannelIds(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get all effect IDs
   */
  getEffectIds(): string[] {
    return Array.from(this.effects.keys());
  }

  /**
   * Get channel configuration
   */
  getChannelConfig(channelId: string): ChannelConfig | null {
    const channel = this.channels.get(channelId);
    if (!channel) return null;

    return {
      volume: channel.volume.value,
      pan: channel.pan.value,
      mute: channel.mute,
      solo: channel.solo,
    };
  }

  /**
   * Get master bus for direct connections
   */
  getMasterBus(): Tone.Channel | null {
    return this.masterBus;
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

  /**
   * Destroy the service and clean up resources
   */
  async destroy(): Promise<void> {
    // Dispose all effects
    for (const effect of this.effects.values()) {
      effect.dispose();
    }
    this.effects.clear();

    // Dispose all channels
    for (const channel of this.channels.values()) {
      channel.dispose();
    }
    this.channels.clear();

    // Dispose master bus
    if (this.masterBus) {
      this.masterBus.dispose();
      this.masterBus = null;
    }

    this.isInitialized = false;
    console.log('ToneMixerService destroyed');
  }

  // Singleton pattern
  private static instance: ToneMixerService | null = null;
  
  static getInstance(): ToneMixerService {
    if (!ToneMixerService.instance) {
      ToneMixerService.instance = new ToneMixerService();
    }
    return ToneMixerService.instance;
  }
}

// Export singleton instance
export const toneMixerService = ToneMixerService.getInstance();
export default toneMixerService;