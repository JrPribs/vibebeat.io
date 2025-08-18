/**
 * Programmatic drum sound generator using Web Audio API
 * Creates synthesized drum sounds without requiring sample files
 */

export interface DrumSample {
  name: string;
  trigger: (audioContext: BaseAudioContext, destination: AudioNode, velocity?: number) => void;
}

/**
 * Creates a kick drum sound using oscillator and envelope
 */
export function createKickDrum(): DrumSample {
  return {
    name: 'kick',
    trigger: (audioContext: BaseAudioContext, destination: AudioNode, velocity = 1) => {
      const now = audioContext.currentTime;
      
      // Create oscillator for the main thump
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      // Kick drum frequency envelope - starts high and drops quickly
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
      
      // Amplitude envelope - quick attack, medium decay
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(velocity * 0.8, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      // Add some noise for texture
      const noiseBuffer = createNoiseBuffer(audioContext, 0.1);
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      const noiseFilter = audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 100;
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      // Connect oscillator chain
      osc.connect(gain);
      gain.connect(destination);
      
      // Connect noise chain
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(destination);
      
      // Start and stop
      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + 0.3);
      noiseSource.stop(now + 0.1);
    }
  };
}

/**
 * Creates a snare drum sound using noise and tone
 */
export function createSnareDrum(): DrumSample {
  return {
    name: 'snare',
    trigger: (audioContext: BaseAudioContext, destination: AudioNode, velocity = 1) => {
      const now = audioContext.currentTime;
      
      // Create noise component (main snare sound)
      const noiseBuffer = createNoiseBuffer(audioContext, 0.2);
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      const noiseFilter = audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 200;
      noiseFilter.Q.value = 1;
      
      // Snare noise envelope - sharp attack, medium decay
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      // Add tonal component for body
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const oscGain = audioContext.createGain();
      
      osc1.frequency.value = 200;
      osc2.frequency.value = 311;
      
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(velocity * 0.2, now + 0.01);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      // Connect noise chain
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(destination);
      
      // Connect tonal chain
      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(destination);
      
      // Start and stop
      noiseSource.start(now);
      osc1.start(now);
      osc2.start(now);
      
      noiseSource.stop(now + 0.2);
      osc1.stop(now + 0.1);
      osc2.stop(now + 0.1);
    }
  };
}

/**
 * Creates a hi-hat sound using filtered noise
 */
export function createHiHat(): DrumSample {
  return {
    name: 'hihat',
    trigger: (audioContext: BaseAudioContext, destination: AudioNode, velocity = 1) => {
      const now = audioContext.currentTime;
      
      // Create high-frequency noise
      const noiseBuffer = createNoiseBuffer(audioContext, 0.1);
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      const highpass = audioContext.createBiquadFilter();
      const lowpass = audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      
      // Filter for metallic hi-hat sound
      highpass.type = 'highpass';
      highpass.frequency.value = 7000;
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 14000;
      lowpass.Q.value = 1;
      
      // Hi-hat envelope - very sharp attack, quick decay
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      // Connect the chain
      noiseSource.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(destination);
      
      // Start and stop
      noiseSource.start(now);
      noiseSource.stop(now + 0.1);
    }
  };
}

/**
 * Creates an open hi-hat sound with longer decay
 */
export function createOpenHiHat(): DrumSample {
  return {
    name: 'openhat',
    trigger: (audioContext: BaseAudioContext, destination: AudioNode, velocity = 1) => {
      const now = audioContext.currentTime;
      
      // Create high-frequency noise
      const noiseBuffer = createNoiseBuffer(audioContext, 0.4);
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      const highpass = audioContext.createBiquadFilter();
      const lowpass = audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      
      // Filter for metallic sound
      highpass.type = 'highpass';
      highpass.frequency.value = 6000;
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 15000;
      lowpass.Q.value = 0.5;
      
      // Open hi-hat envelope - sharp attack, longer decay
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      // Connect the chain
      noiseSource.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(destination);
      
      // Start and stop
      noiseSource.start(now);
      noiseSource.stop(now + 0.4);
    }
  };
}

/**
 * Creates a crash cymbal sound
 */
export function createCrash(): DrumSample {
  return {
    name: 'crash',
    trigger: (audioContext: BaseAudioContext, destination: AudioNode, velocity = 1) => {
      const now = audioContext.currentTime;
      
      // Create metallic noise
      const noiseBuffer = createNoiseBuffer(audioContext, 2.0);
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      
      // Filter for crash cymbal
      filter.type = 'bandpass';
      filter.frequency.value = 8000;
      filter.Q.value = 0.3;
      
      // Crash envelope - medium attack, long decay
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(velocity * 0.6, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      // Connect the chain
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);
      
      // Start and stop
      noiseSource.start(now);
      noiseSource.stop(now + 2.0);
    }
  };
}

/**
 * Helper function to create noise buffer
 */
function createNoiseBuffer(audioContext: BaseAudioContext, duration: number): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  return buffer;
}

/**
 * Get all available drum samples
 */
export function getAllDrumSamples(): DrumSample[] {
  return [
    createKickDrum(),
    createSnareDrum(),
    createHiHat(),
    createOpenHiHat(),
    createCrash()
  ];
}

/**
 * Get drum sample by name
 */
export function getDrumSample(name: string): DrumSample | null {
  const samples = getAllDrumSamples();
  return samples.find(sample => sample.name === name) || null;
}