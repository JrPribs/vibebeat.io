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
}