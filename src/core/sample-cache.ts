export class SampleCache {
  private cache: Map<string, AudioBuffer> = new Map();
  private audioContext?: AudioContext;
  private loading: Map<string, Promise<AudioBuffer>> = new Map();

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  async loadSample(url: string): Promise<AudioBuffer> {
    // Return cached sample if available
    const cached = this.cache.get(url);
    if (cached) {
      return cached;
    }

    // Return existing loading promise if in progress
    const loading = this.loading.get(url);
    if (loading) {
      return loading;
    }

    // Start new loading process
    const loadPromise = this.fetchAndDecode(url);
    this.loading.set(url, loadPromise);

    try {
      const audioBuffer = await loadPromise;
      this.cache.set(url, audioBuffer);
      this.loading.delete(url);
      return audioBuffer;
    } catch (error) {
      this.loading.delete(url);
      throw error;
    }
  }

  private async fetchAndDecode(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sample: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading sample from ${url}:`, error);
      throw error;
    }
  }

  preloadSamples(urls: string[]): Promise<AudioBuffer[]> {
    return Promise.all(urls.map(url => this.loadSample(url)));
  }

  getSample(url: string): AudioBuffer | undefined {
    return this.cache.get(url);
  }

  hasSample(url: string): boolean {
    return this.cache.has(url);
  }

  isLoading(url: string): boolean {
    return this.loading.has(url);
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getLoadingCount(): number {
    return this.loading.size;
  }

  clearCache(): void {
    this.cache.clear();
  }

  removeSample(url: string): boolean {
    return this.cache.delete(url);
  }

  getCacheInfo(): { url: string; duration: number; channels: number }[] {
    return Array.from(this.cache.entries()).map(([url, buffer]) => ({
      url,
      duration: buffer.duration,
      channels: buffer.numberOfChannels
    }));
  }

  // Additional methods for factory kit support
  async loadFactoryKit(kitId: string): Promise<Map<string, any>> {
    // Placeholder implementation - return mock samples
    console.log('Loading factory kit:', kitId);
    return new Map();
  }

  getStats() {
    return {
      totalSamples: this.cache.size,
      loadingCount: this.loading.size,
      memoryUsage: 0 // Placeholder
    };
  }

  getFactoryKits() {
    return [
      { 
        id: 'factory-kit-01', 
        name: 'Factory Kit 01',
        samples: {
          'KICK': '/assets/kits/factory-kit-01/kick.wav',
          'SNARE': '/assets/kits/factory-kit-01/snare.wav',
          'HIHAT_CLOSED': '/assets/kits/factory-kit-01/hihat.wav'
        }
      },
      { 
        id: 'factory-kit-02', 
        name: 'Factory Kit 02',
        samples: {
          'KICK': '/assets/kits/factory-kit-02/kick.wav',
          'SNARE': '/assets/kits/factory-kit-02/snare.wav',
          'HIHAT_CLOSED': '/assets/kits/factory-kit-02/hihat.wav'
        }
      }
    ];
  }

  async preloadEssentials(): Promise<void> {
    // Placeholder implementation
    console.log('Preloading essential samples');
  }

  getFactoryContent() {
    return {
      drumKits: this.getFactoryKits(),
      instruments: []
    };
  }
}

// Create and export singleton instance
export const sampleCache = new SampleCache();