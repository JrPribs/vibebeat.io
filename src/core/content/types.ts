export interface DrumKit {
  id: string;
  name: string;
  samples: Record<string, string>; // pad name -> sample URL
}

export interface Instrument {
  id: string;
  name: string;
  samples: Record<string, string>; // note -> sample URL
}

export interface ContentLoadingStatus {
  isLoading: boolean;
  progress: number;
  error?: string;
}

export interface FactoryContent {
  drumKits: DrumKit[];
  instruments: Instrument[];
}