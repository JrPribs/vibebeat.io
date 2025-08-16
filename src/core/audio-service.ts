import { AudioProvider } from './audio-engine';
import { SampleCache } from './sample-cache';
import { MixerService } from './mixer-service';
import { SchedulerService } from './scheduler-service';
import { AudioSample, AudioState, DrumKit, Pattern } from '../shared/models';

export class AudioService {
  private audioProvider: AudioProvider;
  private sampleCache: SampleCache;
  private mixerService: MixerService;
  private schedulerService: SchedulerService;
  private isInitialized = false;

  constructor() {
    this.audioProvider = new AudioProvider();
    this.sampleCache = new SampleCache();
    this.mixerService = new MixerService(this.audioProvider);
    this.schedulerService = new SchedulerService(this.audioProvider);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.audioProvider.initialize();
      await this.sampleCache.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
      throw error;
    }
  }

  async loadKit(kit: DrumKit): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const samples = await Promise.all(
      kit.samples.map(sample => this.sampleCache.loadSample(sample.url))
    );
    
    kit.samples.forEach((sample, index) => {
      sample.audioBuffer = samples[index];
    });
  }

  async playSample(sample: AudioSample, velocity: number = 1): Promise<void> {
    if (!sample.audioBuffer) {
      throw new Error('Sample not loaded');
    }
    
    await this.audioProvider.playSample(sample.audioBuffer, {
      volume: velocity * sample.volume,
      pan: sample.pan,
      pitch: sample.pitch
    });
  }

  startPlayback(pattern: Pattern, bpm: number): void {
    this.schedulerService.start(pattern, bpm);
  }

  stopPlayback(): void {
    this.schedulerService.stop();
  }

  pausePlayback(): void {
    this.schedulerService.pause();
  }

  resumePlayback(): void {
    this.schedulerService.resume();
  }

  getState(): AudioState {
    return {
      isPlaying: this.schedulerService.isPlaying(),
      currentStep: this.schedulerService.getCurrentStep(),
      bpm: this.schedulerService.getBpm(),
      masterVolume: this.mixerService.getMasterVolume(),
      isInitialized: this.isInitialized
    };
  }

  setMasterVolume(volume: number): void {
    this.mixerService.setMasterVolume(volume);
  }

  setChannelVolume(channelId: string, volume: number): void {
    this.mixerService.setChannelVolume(channelId, volume);
  }

  setChannelPan(channelId: string, pan: number): void {
    this.mixerService.setChannelPan(channelId, pan);
  }

  destroy(): void {
    this.schedulerService.stop();
    this.audioProvider.destroy();
    this.isInitialized = false;
  }
}

export const audioService = new AudioService();