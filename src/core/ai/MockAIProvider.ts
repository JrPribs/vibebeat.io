import type { AIProvider, DrumPatternInput, DrumPatternOutput, MelodyInput, MelodyOutput } from './types';

export class MockAIProvider implements AIProvider {
  async generateDrumPattern(input: DrumPatternInput): Promise<DrumPatternOutput> {
    // Mock drum pattern generation
    return {
      pattern: [
        { step: 0, pad: 'KICK', velocity: 127 },
        { step: 8, pad: 'KICK', velocity: 120 },
        { step: 4, pad: 'SNARE', velocity: 125 },
        { step: 12, pad: 'SNARE', velocity: 120 }
      ]
    };
  }

  async generateMelody(input: MelodyInput): Promise<MelodyOutput> {
    // Mock melody generation
    return {
      notes: [
        { step: 0, pitch: 'C4', duration: 4, velocity: 100 },
        { step: 4, pitch: 'E4', duration: 4, velocity: 95 },
        { step: 8, pitch: 'G4', duration: 4, velocity: 105 },
        { step: 12, pitch: 'C5', duration: 4, velocity: 110 }
      ]
    };
  }
}