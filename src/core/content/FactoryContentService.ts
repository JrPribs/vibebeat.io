import type { DrumKit, Instrument, FactoryContent, ContentLoadingStatus } from './types';

export class FactoryContentService {
  private content: FactoryContent = {
    drumKits: [],
    instruments: []
  };
  
  private status: ContentLoadingStatus = {
    isLoading: false,
    progress: 0
  };

  async loadFactoryContent(): Promise<FactoryContent> {
    this.status = { isLoading: true, progress: 0 };
    
    try {
      // Placeholder factory content
      this.content = {
        drumKits: [
          {
            id: 'factory-kit-01',
            name: 'Factory Kit 01',
            samples: {
              'KICK': '/assets/kits/factory-kit-01/kick.wav',
              'SNARE': '/assets/kits/factory-kit-01/snare.wav',
              'HIHAT_CLOSED': '/assets/kits/factory-kit-01/hihat.wav'
            }
          }
        ],
        instruments: [
          {
            id: 'factory-piano',
            name: 'Factory Piano',
            samples: {
              'C4': '/assets/instruments/piano/C4.wav',
              'E4': '/assets/instruments/piano/E4.wav',
              'G4': '/assets/instruments/piano/G4.wav'
            }
          }
        ]
      };
      
      this.status = { isLoading: false, progress: 100 };
      return this.content;
    } catch (error) {
      this.status = { 
        isLoading: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
      throw error;
    }
  }

  getContent(): FactoryContent {
    return this.content;
  }

  getStatus(): ContentLoadingStatus {
    return this.status;
  }
}

// Create and export singleton instance
export const factoryContentService = new FactoryContentService();