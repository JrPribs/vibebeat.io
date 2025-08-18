import type { AIProvider, DrumPatternInput, DrumPatternOutput, MelodyInput, MelodyOutput } from './types';

export class OpenAIProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDrumPattern(input: DrumPatternInput): Promise<DrumPatternOutput> {
    // Placeholder implementation
    throw new Error('OpenAI provider not implemented yet');
  }

  async generateMelody(input: MelodyInput): Promise<MelodyOutput> {
    // Placeholder implementation
    throw new Error('OpenAI provider not implemented yet');
  }
}