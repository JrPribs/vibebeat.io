// Music Theory Service
// Unified professional music theory operations using Tonal.js

import { Scale, Note, Chord, Interval } from 'tonal';

// Common scale types with user-friendly names
export const SCALE_TYPES = {
  'Major': 'major',
  'Natural Minor': 'natural minor',
  'Dorian': 'dorian',
  'Mixolydian': 'mixolydian',
  'Pentatonic Major': 'major pentatonic',
  'Pentatonic Minor': 'minor pentatonic',
  'Blues': 'blues',
  'Harmonic Minor': 'harmonic minor',
  'Melodic Minor': 'melodic minor',
  'Phrygian': 'phrygian',
  'Lydian': 'lydian',
  'Locrian': 'locrian'
} as const;

export type ScaleTypeName = keyof typeof SCALE_TYPES;

// Common chord types
export const CHORD_TYPES = {
  'Major': 'M',
  'Minor': 'm',
  'Dominant 7th': '7',
  'Major 7th': 'M7',
  'Minor 7th': 'm7',
  'Diminished': 'dim',
  'Augmented': 'aug',
  'Sus2': 'sus2',
  'Sus4': 'sus4'
} as const;

export type ChordTypeName = keyof typeof CHORD_TYPES;

export interface ScaleInfo {
  name: string;
  notes: string[];
  intervals: string[];
  triads: string[];
}

export interface ChordInfo {
  name: string;
  notes: string[];
  intervals: string[];
  type: string;
}

class MusicTheoryService {
  /**
   * Note and MIDI conversion utilities
   */
  
  // Convert note name to MIDI number (e.g., "C4" -> 60)
  noteToMidi(noteName: string): number {
    const midiNumber = Note.midi(noteName);
    if (midiNumber === null) {
      throw new Error(`Invalid note name: ${noteName}`);
    }
    return midiNumber;
  }
  
  // Convert MIDI number to note name (e.g., 60 -> "C4")
  midiToNote(midiNumber: number): string {
    return Note.fromMidi(midiNumber) || 'C4';
  }
  
  // Convert MIDI number to frequency (e.g., 60 -> 261.63 Hz)
  midiToFreq(midiNumber: number): number {
    const noteName = this.midiToNote(midiNumber);
    return Note.freq(noteName) || 440;
  }
  
  // Convert note name to frequency (e.g., "C4" -> 261.63 Hz)
  noteToFreq(noteName: string): number {
    return Note.freq(noteName) || 440;
  }
  
  // Get note pitch class without octave (e.g., "C4" -> "C")
  getNotePitchClass(noteName: string): string {
    return Note.pitchClass(noteName) || 'C';
  }
  
  /**
   * Scale utilities
   */
  
  // Get scale information
  getScale(root: string, scaleType: ScaleTypeName): ScaleInfo {
    const tonalScaleName = SCALE_TYPES[scaleType];
    const scale = Scale.get(`${root} ${tonalScaleName}`);
    
    return {
      name: `${root} ${scaleType}`,
      notes: scale.notes || [],
      intervals: scale.intervals || [],
      triads: scale.triads || []
    };
  }
  
  // Get scale notes
  getScaleNotes(root: string, scaleType: ScaleTypeName): string[] {
    return this.getScale(root, scaleType).notes;
  }
  
  // Check if note is in scale
  isNoteInScale(note: string, root: string, scaleType: ScaleTypeName): boolean {
    const scaleNotes = this.getScaleNotes(root, scaleType);
    const noteClass = this.getNotePitchClass(note);
    return scaleNotes.some(scaleNote => this.getNotePitchClass(scaleNote) === noteClass);
  }
  
  // Check if MIDI note is in scale
  isMidiInScale(midiNumber: number, root: string, scaleType: ScaleTypeName): boolean {
    const noteName = this.midiToNote(midiNumber);
    return this.isNoteInScale(noteName, root, scaleType);
  }
  
  // Get all available scale types
  getAvailableScaleTypes(): ScaleTypeName[] {
    return Object.keys(SCALE_TYPES) as ScaleTypeName[];
  }
  
  /**
   * Chord utilities
   */
  
  // Get chord information
  getChord(root: string, chordType: ChordTypeName): ChordInfo {
    const tonalChordSymbol = CHORD_TYPES[chordType];
    const chord = Chord.get(`${root}${tonalChordSymbol}`);
    
    return {
      name: chord.name || `${root} ${chordType}`,
      notes: chord.notes || [],
      intervals: chord.intervals || [],
      type: chord.type || tonalChordSymbol
    };
  }
  
  // Get chord notes
  getChordNotes(root: string, chordType: ChordTypeName): string[] {
    return this.getChord(root, chordType).notes;
  }
  
  // Detect chord from notes
  detectChord(notes: string[]): string[] {
    return Chord.detect(notes);
  }
  
  // Get all available chord types
  getAvailableChordTypes(): ChordTypeName[] {
    return Object.keys(CHORD_TYPES) as ChordTypeName[];
  }
  
  /**
   * Interval utilities
   */
  
  // Calculate interval between two notes
  getInterval(fromNote: string, toNote: string): string {
    return Interval.distance(fromNote, toNote);
  }
  
  // Transpose note by interval
  transposeNote(note: string, interval: string): string {
    return Note.transpose(note, interval);
  }
  
  // Transpose note by semitones
  transposeNoteBySemitones(note: string, semitones: number): string {
    const midiNumber = this.noteToMidi(note);
    return this.midiToNote(midiNumber + semitones);
  }
  
  /**
   * Utility functions
   */
  
  // Normalize note name (handle enharmonics)
  normalizeNote(note: string): string {
    return Note.simplify(note);
  }
  
  // Get enharmonic equivalent
  getEnharmonic(note: string): string {
    return Note.enharmonic(note);
  }
  
  // Check if two notes are enharmonically equivalent
  areNotesEnharmonic(note1: string, note2: string): boolean {
    return Note.chroma(note1) === Note.chroma(note2);
  }
}

// Export singleton instance
export const musicTheoryService = new MusicTheoryService();
export default musicTheoryService;