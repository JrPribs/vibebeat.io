// MusicRadar Kit Loader Service
// Handles loading and mapping of MusicRadar drum sample collections to vibebeat.io PadName structure

import type { PadName } from '../shared/models/index';

export interface MusicRadarKit {
  id: string;
  name: string;
  category: 'acoustic' | 'electronic' | 'vinyl' | 'kurzweil';
  description: string;
  basePath: string;
  sampleMapping: { [pattern: string]: PadName };
}

/**
 * Sample name pattern mappings for MusicRadar collection
 */
const SAMPLE_PATTERN_MAP: { [pattern: string]: PadName } = {
  // Kicks
  'Kick': 'KICK',
  
  // Snares
  'Snr': 'SNARE',
  'SnrOff': 'SNARE', // Snares off (alternate snare sound)
  
  // Hi-hats
  'ClHat': 'HIHAT_CLOSED',
  'OpHat': 'HIHAT_OPEN',
  'PdHat': 'HIHAT_CLOSED', // Pedal hat (also closed)
  'HfHat': 'HIHAT_OPEN', // Half-open hat
  
  // Crashes and Rides
  'Crash': 'CRASH',
  'Ride': 'RIDE',
  'China': 'CRASH', // China cymbal mapped to crash
  'RevCrash': 'CRASH', // Reverse crash
  
  // Toms
  'Tom01': 'TOM_HIGH',  // High tom
  'Tom02': 'TOM_MID',   // Mid tom
  'Tom03': 'TOM_FLOOR', // Floor tom
  'Tom': 'TOM_MID',     // Generic tom
  
  // Percussion
  'Clap': 'CLAP',
  'Rim': 'PERC_01',     // Rim shot
  'SdSt': 'PERC_02',    // Side stick
  'Flam': 'PERC_01',    // Flam (percussion effect)
  'Perc': 'PERC_02',    // Generic percussion
  'Trash': 'PERC_01',   // Trash snare sound
  'Brsh': 'PERC_01',    // Brush sound
  'Scratch': 'PERC_02', // Scratch sound
  'Shkr': 'PERC_01',    // Shaker
  'Tamb': 'PERC_02',    // Tambourine
  
  // Electronic specific
  'FX': 'PAD_13',       // Sound effects
  'Cymbal': 'CRASH',    // Electronic cymbal
};

// MusicRadar Kit Definitions
// Professional drum kits from Computer Music magazine's sample collection
export const MUSICRADAR_KITS: Record<string, MusicRadarKit> = {
  // Acoustic Category
  'musicradar-acoustic-01-close': {
    id: 'musicradar-acoustic-01-close',
    name: 'Acoustic Close',
    category: 'acoustic',
    description: 'Close-miked acoustic drums with tight, punchy sound',
    basePath: '/assets/kits/musicradar/acoustic/01-acoustic-close',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-acoustic-02-room': {
    id: 'musicradar-acoustic-02-room',
    name: 'Acoustic Room',
    category: 'acoustic',
    description: 'Room-miked acoustic drums with natural ambience',
    basePath: '/assets/kits/musicradar/acoustic/02-acoustic-room',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-acoustic-03-standard': {
    id: 'musicradar-acoustic-03-standard',
    name: 'Acoustic Standard',
    category: 'acoustic',
    description: 'Balanced acoustic drum sound with moderate processing',
    basePath: '/assets/kits/musicradar/acoustic/03-acoustic-standard',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-acoustic-04-punchy': {
    id: 'musicradar-acoustic-04-punchy',
    name: 'Acoustic Punchy',
    category: 'acoustic',
    description: 'Hard-hitting acoustic drums with aggressive transients',
    basePath: '/assets/kits/musicradar/acoustic/04-acoustic-punchy',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-acoustic-05-vintage': {
    id: 'musicradar-acoustic-05-vintage',
    name: 'Acoustic Vintage',
    category: 'acoustic',
    description: 'Classic acoustic drum sound with vintage character',
    basePath: '/assets/kits/musicradar/acoustic/05-acoustic-vintage',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-acoustic-06-minimal': {
    id: 'musicradar-acoustic-06-minimal',
    name: 'Acoustic Minimal',
    category: 'acoustic',
    description: 'Stripped-down acoustic drums with essential elements',
    basePath: '/assets/kits/musicradar/acoustic/06-acoustic-minimal',
    sampleMapping: SAMPLE_PATTERN_MAP
  },

  // Electronic Category
  'musicradar-electronic-01-classic': {
    id: 'musicradar-electronic-01-classic',
    name: 'Electro Classic',
    category: 'electronic',
    description: 'Classic 80s-style electronic drums with analog character',
    basePath: '/assets/kits/musicradar/electronic/01-electro-classic',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-electronic-02-hiphop': {
    id: 'musicradar-electronic-02-hiphop',
    name: 'Electro Hip-Hop',
    category: 'electronic',
    description: 'Hard-hitting electronic drums for hip-hop production',
    basePath: '/assets/kits/musicradar/electronic/02-electro-hiphop',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-electronic-03-minimal': {
    id: 'musicradar-electronic-03-minimal',
    name: 'Electro Minimal',
    category: 'electronic',
    description: 'Clean, simple electronic drums for minimal productions',
    basePath: '/assets/kits/musicradar/electronic/03-electro-minimal',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-electronic-04-heavy': {
    id: 'musicradar-electronic-04-heavy',
    name: 'Electro Heavy',
    category: 'electronic',
    description: 'Aggressive electronic drums with heavy processing',
    basePath: '/assets/kits/musicradar/electronic/04-electro-heavy',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-electronic-05-modern': {
    id: 'musicradar-electronic-05-modern',
    name: 'Electro Modern',
    category: 'electronic',
    description: 'Contemporary electronic drums with crisp digital sound',
    basePath: '/assets/kits/musicradar/electronic/05-electro-modern',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-electronic-06-punchy': {
    id: 'musicradar-electronic-06-punchy',
    name: 'Electro Punchy',
    category: 'electronic',
    description: 'Sharp, punchy electronic drums with tight dynamics',
    basePath: '/assets/kits/musicradar/electronic/06-electro-punchy',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-electronic-07-deep': {
    id: 'musicradar-electronic-07-deep',
    name: 'Electro Deep',
    category: 'electronic',
    description: 'Deep, atmospheric electronic drums with low-end focus',
    basePath: '/assets/kits/musicradar/electronic/07-electro-deep',
    sampleMapping: SAMPLE_PATTERN_MAP
  },

  // Vinyl Category
  'musicradar-vinyl-01-classic': {
    id: 'musicradar-vinyl-01-classic',
    name: 'Vinyl Classic',
    category: 'vinyl',
    description: 'Classic vinyl drum sound with warm, nostalgic character',
    basePath: '/assets/kits/musicradar/vinyl/01-vinyl-classic',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-vinyl-02-dusty': {
    id: 'musicradar-vinyl-02-dusty',
    name: 'Vinyl Dusty',
    category: 'vinyl',
    description: 'Aged vinyl drums with dust and crackle for vintage feel',
    basePath: '/assets/kits/musicradar/vinyl/02-vinyl-dusty',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-vinyl-03-lofi': {
    id: 'musicradar-vinyl-03-lofi',
    name: 'Vinyl Lo-Fi',
    category: 'vinyl',
    description: 'Lo-fi vinyl drums with reduced fidelity and analog warmth',
    basePath: '/assets/kits/musicradar/vinyl/03-vinyl-lofi',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-vinyl-04-crispy': {
    id: 'musicradar-vinyl-04-crispy',
    name: 'Vinyl Crispy',
    category: 'vinyl',
    description: 'Crisp vinyl drums with enhanced high-frequency content',
    basePath: '/assets/kits/musicradar/vinyl/04-vinyl-crispy',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-vinyl-05-warm': {
    id: 'musicradar-vinyl-05-warm',
    name: 'Vinyl Warm',
    category: 'vinyl',
    description: 'Warm, saturated vinyl drums with tube-like compression',
    basePath: '/assets/kits/musicradar/vinyl/05-vinyl-warm',
    sampleMapping: SAMPLE_PATTERN_MAP
  },

  // Kurzweil Category  
  'musicradar-kurzweil-01-classic': {
    id: 'musicradar-kurzweil-01-classic',
    name: 'Kurzweil Classic',
    category: 'kurzweil',
    description: 'Classic Kurzweil drum sounds with signature digital character',
    basePath: '/assets/kits/musicradar/kurzweil/01-kurzweil-classic',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-02-modern': {
    id: 'musicradar-kurzweil-02-modern',
    name: 'Kurzweil Modern',
    category: 'kurzweil',
    description: 'Modern Kurzweil drums with enhanced processing',
    basePath: '/assets/kits/musicradar/kurzweil/02-kurzweil-modern',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-03-vintage': {
    id: 'musicradar-kurzweil-03-vintage',
    name: 'Kurzweil Vintage',
    category: 'kurzweil',
    description: 'Vintage-style Kurzweil drums with retro character',
    basePath: '/assets/kits/musicradar/kurzweil/03-kurzweil-vintage',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-04-electronic': {
    id: 'musicradar-kurzweil-04-electronic',
    name: 'Kurzweil Electronic',
    category: 'kurzweil',
    description: 'Pure electronic drums from Kurzweil sound engines',
    basePath: '/assets/kits/musicradar/kurzweil/04-kurzweil-electronic',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-05-experimental': {
    id: 'musicradar-kurzweil-05-experimental',
    name: 'Kurzweil Experimental',
    category: 'kurzweil',
    description: 'Experimental and unique Kurzweil drum textures',
    basePath: '/assets/kits/musicradar/kurzweil/05-kurzweil-experimental',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-06-ambient': {
    id: 'musicradar-kurzweil-06-ambient',
    name: 'Kurzweil Ambient',
    category: 'kurzweil',
    description: 'Atmospheric Kurzweil drums for ambient productions',
    basePath: '/assets/kits/musicradar/kurzweil/06-kurzweil-ambient',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-07-percussive': {
    id: 'musicradar-kurzweil-07-percussive',
    name: 'Kurzweil Percussive',
    category: 'kurzweil',
    description: 'Percussive-focused Kurzweil drums with extended range',
    basePath: '/assets/kits/musicradar/kurzweil/07-kurzweil-percussive',
    sampleMapping: SAMPLE_PATTERN_MAP
  },
  'musicradar-kurzweil-08-dynamic': {
    id: 'musicradar-kurzweil-08-dynamic',
    name: 'Kurzweil Dynamic',
    category: 'kurzweil',
    description: 'Dynamic Kurzweil drums with expressive velocity response',
    basePath: '/assets/kits/musicradar/kurzweil/08-kurzweil-dynamic',
    sampleMapping: SAMPLE_PATTERN_MAP
  }
};

class MusicRadarKitLoader {
  private loadedKits: Map<string, MusicRadarKit> = new Map();

  /**
   * Get all available MusicRadar kits
   */
  getAvailableKits(): MusicRadarKit[] {
    return Object.values(MUSICRADAR_KITS);
  }

  /**
   * Get kits by category
   */
  getKitsByCategory(category: MusicRadarKit['category']): MusicRadarKit[] {
    return Object.values(MUSICRADAR_KITS).filter(kit => kit.category === category);
  }

  /**
   * Get kit by ID
   */
  getKit(kitId: string): MusicRadarKit | null {
    return MUSICRADAR_KITS[kitId] || null;
  }

  /**
   * Generate sample mapping for a specific kit
   */
  async generateKitSampleMapping(kitId: string): Promise<Map<PadName, string> | null> {
    const kit = MUSICRADAR_KITS[kitId];
    if (!kit) {
      console.error(`Kit not found: ${kitId}`);
      return null;
    }

    try {
      const sampleMapping = new Map<PadName, string>();

      // Map each PadName to the best available sample
      const padMappings = await this.findBestSampleForEachPad(kit);
      
      for (const [padName, samplePath] of padMappings.entries()) {
        sampleMapping.set(padName, samplePath);
      }

      console.log(`✅ Generated sample mapping for ${kitId} (${sampleMapping.size} samples)`);
      return sampleMapping;

    } catch (error) {
      console.error(`❌ Failed to generate sample mapping for ${kitId}:`, error);
      return null;
    }
  }

  /**
   * Find the best sample file for each pad based on naming patterns
   */
  private async findBestSampleForEachPad(kit: MusicRadarKit): Promise<Map<PadName, string>> {
    const mapping = new Map<PadName, string>();

    // Define priority samples for each pad type with multiple pattern variants
    const padSamplePriority: { [key in PadName]: string[] } = {
      'KICK': ['Kick-01', 'Kick01', 'Kick-1', 'Kick1', 'Kick', 'Kick02', 'Kick93'],
      'SNARE': ['Snr-01', 'Snr01', 'Snr-1', 'Snr1', 'Snr', 'Snr02'],
      'HIHAT_CLOSED': ['ClHat-01', 'ClHat01', 'ClHat-1', 'ClHat1', 'ClHat', 'ClHat02'],
      'HIHAT_OPEN': ['OpHat-01', 'OpHat01', 'OpHat-1', 'OpHat1', 'OpHat', 'OpHat02'],
      'CLAP': ['Clap-01', 'Clap01', 'Clap-1', 'Clap1', 'Clap', 'Clap02'],
      'CRASH': ['Crash-01', 'Crash01', 'Crash-1', 'Crash1', 'Crash', 'Crash02'],
      'RIDE': ['Ride-01', 'Ride01', 'Ride-1', 'Ride1', 'Ride', 'Ride02'],
      'TOM_HIGH': ['Tom01', 'Tom-01', 'Tom1', 'Tom-1', 'Tom', 'Tom01a', 'Tom01b', 'Tom-04', 'Tom04'],
      'TOM_MID': ['Tom02', 'Tom-02', 'Tom2', 'Tom-2', 'Tom', 'Tom02a', 'Tom02b', 'Tom-05', 'Tom05'],
      'TOM_FLOOR': ['Tom03', 'Tom-03', 'Tom3', 'Tom-3', 'Tom', 'Tom03a', 'Tom03b'],
      'PERC_01': ['Rim-01', 'Rim01', 'SdSt-01', 'SdSt01', 'Flam-01', 'Flam01', 'Perc01', 'Brsh01', 'Shkr01'],
      'PERC_02': ['Perc-01', 'Perc01', 'FX-01', 'FX01', 'SdSt-02', 'SdSt02', 'Perc02', 'Tamb', 'Scratch01'],
      'PAD_13': ['FX-01', 'FX01', 'Perc-02', 'Perc02', 'Perc03', 'Perc04'],
      'PAD_14': ['FX-02', 'FX02', 'Perc-03', 'Perc03', 'Perc04', 'Perc05'],
      'PAD_15': ['FX-03', 'FX03', 'Perc-04', 'Perc04', 'Perc05', 'Perc06'],
      'PAD_16': ['FX-04', 'FX04', 'Perc-05', 'Perc05', 'Perc06', 'Perc07']
    };

    // Try to find samples for each pad
    for (const [padName, priorities] of Object.entries(padSamplePriority)) {
      let foundSample = false;

      for (const priority of priorities) {
        const filename = this.findMatchingFile(kit, priority);
        const constructedPath = `${kit.basePath}/${filename}`;
        mapping.set(padName as PadName, constructedPath);
        foundSample = true;
        break;
      }

      // If no priority sample found, use a fallback strategy
      if (!foundSample) {
        const fallbackSample = this.findFallbackSample(padName as PadName, kit);
        if (fallbackSample) {
          mapping.set(padName as PadName, fallbackSample);
        }
      }
    }

    return mapping;
  }

  /**
   * Find matching file patterns for different kit naming conventions
   */
  private findMatchingFile(kit: MusicRadarKit, pattern: string): string {
    // Map kit IDs to their specific prefixes based on the actual file structure
    const kitPrefixMap: { [kitId: string]: string } = {
      // Acoustic Category
      'musicradar-acoustic-01-close': 'CYCdh_K1close_',
      'musicradar-acoustic-02-room': 'CYCdh_K2room_',
      'musicradar-acoustic-03-standard': 'CyCdh_K3',
      'musicradar-acoustic-04-punchy': 'CYCdh_K4-',
      'musicradar-acoustic-05-vintage': 'CYCdh_K5-',
      'musicradar-acoustic-06-minimal': 'CYCdh_K6-',
      
      // Electronic Category
      'musicradar-electronic-01-classic': 'CYCdh_ElecK01-',
      'musicradar-electronic-02-hiphop': 'CYCdh_ElecK02-',
      'musicradar-electronic-03-minimal': 'CYCdh_ElecK03-',
      'musicradar-electronic-04-heavy': 'CYCdh_ElecK04-',
      'musicradar-electronic-05-modern': 'CYCdh_ElecK05-',
      'musicradar-electronic-06-punchy': 'CYCdh_ElecK06-',
      'musicradar-electronic-07-deep': 'CYCdh_ElecK07-',
      
      // Vinyl Category  
      'musicradar-vinyl-01-classic': 'CYCdh_VinylK1-',
      'musicradar-vinyl-02-dusty': 'CYCdh_VinylK2-',
      'musicradar-vinyl-03-lofi': 'CYCdh_VinylK3-',
      'musicradar-vinyl-04-crispy': 'CYCdh_VinylK4-',
      'musicradar-vinyl-05-warm': 'CYCdh_VinylK5-',
      
      // Kurzweil Category
      'musicradar-kurzweil-01-classic': 'CYCdh_Kurz01-',
      'musicradar-kurzweil-02-modern': 'CYCdh_Kurz02-',
      'musicradar-kurzweil-03-vintage': 'CYCdh_Kurz03-',
      'musicradar-kurzweil-04-electronic': 'CYCdh_Kurz04-',
      'musicradar-kurzweil-05-experimental': 'CYCdh_Kurz05-',
      'musicradar-kurzweil-06-ambient': 'CYCdh_Kurz06-',
      'musicradar-kurzweil-07-percussive': 'CYCdh_Kurz07-',
      'musicradar-kurzweil-08-dynamic': 'CYCdh_Kurz08-'
    };

    // Get the appropriate prefix for this kit
    const prefix = kitPrefixMap[kit.id];
    
    if (!prefix) {
      console.warn(`No prefix mapping found for kit: ${kit.id}`);
      return `${pattern}.wav`;
    }

    // Construct the full filename with prefix and .wav extension
    return `${prefix}${pattern}.wav`;
  }

  /**
   * Find fallback sample for a pad if primary samples aren't available
   */
  private findFallbackSample(padName: PadName, kit: MusicRadarKit): string | null {
    // Define fallback strategies based on pad type using proper prefixes
    const fallbackPatterns: { [key in PadName]: string } = {
      'KICK': 'Kick01',
      'SNARE': 'Snr01',
      'HIHAT_CLOSED': 'ClHat01',
      'HIHAT_OPEN': 'OpHat01',
      'CLAP': 'Clap01',
      'CRASH': 'Crash01',
      'RIDE': 'Ride01',
      'TOM_HIGH': 'Tom01',
      'TOM_MID': 'Tom02',
      'TOM_FLOOR': 'Tom03',
      'PERC_01': 'Rim01',
      'PERC_02': 'SdSt01',
      'PAD_13': 'Perc01',
      'PAD_14': 'Perc02',
      'PAD_15': 'Perc03',
      'PAD_16': 'Perc04'
    };

    const pattern = fallbackPatterns[padName];
    if (!pattern) return null;

    const filename = this.findMatchingFile(kit, pattern);
    return `${kit.basePath}/${filename}`;
  }

  /**
   * Search kits by name, description, or category
   */
  searchKits(query: string): MusicRadarKit[] {
    const lowerQuery = query.toLowerCase();
    
    return Object.values(MUSICRADAR_KITS).filter(kit => 
      kit.name.toLowerCase().includes(lowerQuery) ||
      kit.description.toLowerCase().includes(lowerQuery) ||
      kit.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get kits grouped by category for UI display
   */
  getKitsGroupedByCategory(): Record<string, MusicRadarKit[]> {
    const grouped: Record<string, MusicRadarKit[]> = {
      acoustic: [],
      electronic: [],
      vinyl: [],
      kurzweil: []
    };

    Object.values(MUSICRADAR_KITS).forEach(kit => {
      grouped[kit.category].push(kit);
    });

    return grouped;
  }

  /**
   * Get kit statistics
   */
  getKitStats(): { total: number; byCategory: Record<string, number> } {
    const kits = Object.values(MUSICRADAR_KITS);
    const byCategory = kits.reduce((acc, kit) => {
      acc[kit.category] = (acc[kit.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: kits.length,
      byCategory
    };
  }

  // Singleton pattern
  private static instance: MusicRadarKitLoader | null = null;

  static getInstance(): MusicRadarKitLoader {
    if (!MusicRadarKitLoader.instance) {
      MusicRadarKitLoader.instance = new MusicRadarKitLoader();
    }
    return MusicRadarKitLoader.instance;
  }
}

// Export singleton instance
export const musicRadarKitLoader = MusicRadarKitLoader.getInstance();
export default musicRadarKitLoader;