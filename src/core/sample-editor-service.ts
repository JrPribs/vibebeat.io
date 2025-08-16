import { AudioSample } from '../shared/models';

export interface SampleEditOptions {
  startTime?: number;
  endTime?: number;
  volume?: number;
  pitch?: number;
  reverse?: boolean;
  normalize?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export class SampleEditorService {
  private audioContext?: AudioContext;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async editSample(sample: AudioSample, options: SampleEditOptions): Promise<AudioBuffer> {
    if (!sample.audioBuffer || !this.audioContext) {
      throw new Error('Sample or AudioContext not available');
    }

    let buffer = sample.audioBuffer;
    
    // Apply edits in sequence
    if (options.startTime !== undefined || options.endTime !== undefined) {
      buffer = this.trimSample(buffer, options.startTime, options.endTime);
    }
    
    if (options.reverse) {
      buffer = this.reverseSample(buffer);
    }
    
    if (options.normalize) {
      buffer = this.normalizeSample(buffer);
    }
    
    if (options.fadeIn || options.fadeOut) {
      buffer = this.applyFades(buffer, options.fadeIn, options.fadeOut);
    }
    
    if (options.volume !== undefined && options.volume !== 1) {
      buffer = this.adjustVolume(buffer, options.volume);
    }
    
    if (options.pitch !== undefined && options.pitch !== 0) {
      buffer = this.adjustPitch(buffer, options.pitch);
    }

    return buffer;
  }

  private trimSample(buffer: AudioBuffer, startTime?: number, endTime?: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');
    
    const sampleRate = buffer.sampleRate;
    const startSample = Math.floor((startTime || 0) * sampleRate);
    const endSample = Math.floor((endTime || buffer.duration) * sampleRate);
    const newLength = endSample - startSample;
    
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        newChannelData[i] = channelData[startSample + i] || 0;
      }
    }
    
    return newBuffer;
  }

  private reverseSample(buffer: AudioBuffer): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');
    
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        newChannelData[i] = channelData[buffer.length - 1 - i];
      }
    }
    
    return newBuffer;
  }

  private normalizeSample(buffer: AudioBuffer): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');
    
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      
      // Find peak amplitude
      let peak = 0;
      for (let i = 0; i < buffer.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
      
      // Normalize to peak if peak > 0
      const normalizeFactor = peak > 0 ? 1 / peak : 1;
      for (let i = 0; i < buffer.length; i++) {
        newChannelData[i] = channelData[i] * normalizeFactor;
      }
    }
    
    return newBuffer;
  }

  private applyFades(buffer: AudioBuffer, fadeInTime?: number, fadeOutTime?: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');
    
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    const fadeInSamples = Math.floor((fadeInTime || 0) * buffer.sampleRate);
    const fadeOutSamples = Math.floor((fadeOutTime || 0) * buffer.sampleRate);
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        let multiplier = 1;
        
        // Apply fade in
        if (i < fadeInSamples) {
          multiplier = i / fadeInSamples;
        }
        
        // Apply fade out
        if (i > buffer.length - fadeOutSamples) {
          const fadeOutProgress = (buffer.length - i) / fadeOutSamples;
          multiplier = Math.min(multiplier, fadeOutProgress);
        }
        
        newChannelData[i] = channelData[i] * multiplier;
      }
    }
    
    return newBuffer;
  }

  private adjustVolume(buffer: AudioBuffer, volume: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available');
    
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        newChannelData[i] = channelData[i] * volume;
      }
    }
    
    return newBuffer;
  }

  private adjustPitch(buffer: AudioBuffer, pitchShift: number): AudioBuffer {
    // This is a simplified pitch shifting implementation
    // In production, you'd want to use more sophisticated algorithms
    if (!this.audioContext) throw new Error('AudioContext not available');
    
    const playbackRate = Math.pow(2, pitchShift / 12); // Convert semitones to playback rate
    const newLength = Math.floor(buffer.length / playbackRate);
    
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i * playbackRate;
        const sourceIndexFloor = Math.floor(sourceIndex);
        const sourceIndexCeil = Math.min(sourceIndexFloor + 1, buffer.length - 1);
        const fraction = sourceIndex - sourceIndexFloor;
        
        // Linear interpolation
        const value1 = channelData[sourceIndexFloor] || 0;
        const value2 = channelData[sourceIndexCeil] || 0;
        newChannelData[i] = value1 + (value2 - value1) * fraction;
      }
    }
    
    return newBuffer;
  }

  analyzeBuffer(buffer: AudioBuffer): {
    duration: number;
    sampleRate: number;
    channels: number;
    peakAmplitude: number;
    rmsLevel: number;
  } {
    let peakAmplitude = 0;
    let rmsSum = 0;
    let totalSamples = 0;
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const sample = channelData[i];
        peakAmplitude = Math.max(peakAmplitude, Math.abs(sample));
        rmsSum += sample * sample;
        totalSamples++;
      }
    }
    
    const rmsLevel = Math.sqrt(rmsSum / totalSamples);
    
    return {
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      peakAmplitude,
      rmsLevel
    };
  }
}