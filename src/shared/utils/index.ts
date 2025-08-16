// Shared Utilities
// Common utility functions

// Audio Utilities
export const audioUtils = {
  // Convert BPM to milliseconds per beat
  bpmToMs: (bpm: number): number => (60 / bpm) * 1000,
  
  // Convert milliseconds to BPM
  msToBpm: (ms: number): number => (60 / ms) * 1000,
  
  // Calculate swing timing offset
  swingOffset: (step: number, swingPercent: number): number => {
    const isOffBeat = step % 2 === 1;
    return isOffBeat ? (swingPercent / 100) * 0.25 : 0; // Quarter note swing
  },
  
  // Quantize a time value to the nearest step
  quantize: (timeMs: number, stepMs: number, strength: number = 1): number => {
    const quantizedTime = Math.round(timeMs / stepMs) * stepMs;
    return timeMs + (quantizedTime - timeMs) * strength;
  },
  
  // Convert MIDI note number to frequency
  midiToFreq: (midiNote: number): number => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  },
  
  // Convert note name to MIDI number (e.g., "C4" -> 60)
  noteToMidi: (noteName: string): number => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) throw new Error(`Invalid note name: ${noteName}`);
    
    const [, note, octave] = match;
    return noteMap[note] + (parseInt(octave) + 1) * 12;
  },
  
  // Convert decibels to linear gain
  dbToGain: (db: number): number => Math.pow(10, db / 20),
  
  // Convert linear gain to decibels
  gainToDb: (gain: number): number => 20 * Math.log10(Math.max(gain, 0.000001)),
};

// Time Utilities
export const timeUtils = {
  // Format milliseconds as MM:SS
  formatTime: (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
  
  // Format bars and beats (1-indexed)
  formatBarsBeat: (step: number, stepsPerBar: number = 16): string => {
    const bar = Math.floor(step / stepsPerBar) + 1;
    const beat = Math.floor((step % stepsPerBar) / 4) + 1;
    return `${bar}.${beat}`;
  },
  
  // Calculate total duration from bars and BPM
  barsToDuration: (bars: number, bpm: number): number => {
    return (bars * 4 * 60 / bpm) * 1000; // 4 beats per bar
  },
};

// File Utilities
export const fileUtils = {
  // Read file as ArrayBuffer
  readAsArrayBuffer: (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  },
  
  // Create download link for blob
  downloadBlob: (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  // Validate audio file type
  isAudioFile: (file: File): boolean => {
    return file.type.startsWith('audio/') || 
           /\.(wav|mp3|ogg|m4a|aac|flac)$/i.test(file.name);
  },
};

// Scale Utilities
export const scaleUtils = {
  // Define scale intervals (semitones from root)
  scales: {
    major: [0, 2, 4, 5, 7, 9, 11],
    natural_minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    pentatonic: [0, 2, 4, 7, 9],
  },
  
  // Get notes in a scale
  getScaleNotes: (root: string, scaleName: keyof typeof scaleUtils.scales): string[] => {
    const rootMidi = audioUtils.noteToMidi(root + '4');
    const intervals = scaleUtils.scales[scaleName];
    
    return intervals.map(interval => {
      const midiNote = rootMidi + interval;
      const octave = Math.floor((midiNote - 12) / 12);
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const noteName = noteNames[midiNote % 12];
      return `${noteName}${octave}`;
    });
  },
  
  // Check if note is in scale
  isInScale: (note: string, root: string, scaleName: keyof typeof scaleUtils.scales): boolean => {
    const scaleNotes = scaleUtils.getScaleNotes(root, scaleName);
    const noteWithoutOctave = note.replace(/\d+$/, '');
    return scaleNotes.some(scaleNote => scaleNote.replace(/\d+$/, '') === noteWithoutOctave);
  },
};

// Local Storage Utilities
export const storageUtils = {
  // Set item with error handling
  setItem: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  // Get item with error handling
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },
  
  // Remove item
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return false;
    }
  },
};