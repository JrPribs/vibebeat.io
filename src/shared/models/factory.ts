// Factory Content Models
// Types for factory kits, instruments, and sample content

import type { PadName } from './audio.js';

// Factory Kit Definition
export interface FactoryKit {
  id: string;
  name: string;
  description: string;
  samples: Record<PadName, string>; // Path to sample file
  license: 'CC0' | 'CC-BY' | 'MIT';
  credits: string;
}

// Factory Content Types
export interface FactoryContent {
  kits: FactoryKit[];
  instruments: {
    id: string;
    name: string;
    samples: Record<string, string>; // Note -> path
  }[];
}