import type { AIProvider, DrumPatternInput, DrumPatternOutput, MelodyInput, MelodyOutput } from './types';

export class AIService {
  private provider?: AIProvider;

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.provider;
  }

  async getRemainingQuota(): Promise<number> {
    return 100; // Placeholder
  }

  getRateLimitStatus() {
    return {
      remaining: 10,
      resetTime: Date.now() + 60000,
      isBlocked: false
    };
  }

  async generateDrumPattern(input: DrumPatternInput, userId?: string): Promise<DrumPatternOutput & { metadata?: any }> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }
    const result = await this.provider.generateDrumPattern(input);
    return {
      ...result,
      metadata: {
        style: input.style,
        tempo: input.tempo,
        bars: input.bars
      }
    };
  }

  async generateMelody(input: MelodyInput, userId?: string): Promise<MelodyOutput & { metadata?: any }> {
    if (!this.provider) {
      throw new Error('AI provider not configured');
    }
    const result = await this.provider.generateMelody(input);
    return {
      ...result,
      metadata: {
        key: input.key,
        scale: input.scale,
        bars: input.bars
      }
    };
  }
}

// Create and export singleton instance
export const aiService = new AIService();