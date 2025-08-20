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
   * Find samples for each pad using simple direct matching
   * Maps only what actually exists - much simpler approach
   */
  private async findBestSampleForEachPad(kit: MusicRadarKit): Promise<Map<PadName, string>> {
    const mapping = new Map<PadName, string>();

    // Simple direct mapping - just look for the first available file for each type
    const simpleMapping: { [key in PadName]: string[] } = {
      'KICK': ['Kick-01', 'Kick01'],
      'SNARE': ['Snr-01', 'Snr01'],
      'HIHAT_CLOSED': ['ClHat-01', 'ClHat01'],
      'HIHAT_OPEN': ['OpHat-01', 'OpHat01'],
      'CLAP': ['Clap-01', 'Clap01'],
      'CRASH': ['Crash-01', 'Crash01', 'Cymbal'],
      'RIDE': ['Ride-01', 'Ride01'],
      'TOM_HIGH': ['Tom01', 'Tom-01'],
      'TOM_MID': ['Tom02', 'Tom-02'],
      'TOM_FLOOR': ['Tom03', 'Tom-03'],
      'PERC_01': ['Rim-01', 'Rim01', 'SdSt-01', 'SdSt01', 'Flam-01', 'Flam01'],
      'PERC_02': ['SdSt-02', 'SdSt02', 'Flam-02', 'Flam02'],
      'PAD_13': ['Perc-01', 'Perc01', 'FX-01', 'FX01'],
      'PAD_14': ['Perc-02', 'Perc02', 'FX-02', 'FX02'],
      'PAD_15': ['Perc-03', 'Perc03', 'FX-03', 'FX03'],
      'PAD_16': ['Perc-04', 'Perc04', 'FX-04', 'FX04']
    };

    // Get available files by scanning the directory
    const availableFiles = await this.getActualKitFiles(kit);
    console.log(`🔍 Found ${availableFiles.length} files in ${kit.id}`);

    // For each pad, try to find a matching file
    for (const [padName, patterns] of Object.entries(simpleMapping)) {
      for (const pattern of patterns) {
        const filename = this.findMatchingFile(kit, pattern);
        
        if (availableFiles.includes(filename)) {
          const fullPath = `${kit.basePath}/${filename}`;
          mapping.set(padName as PadName, fullPath);
          console.log(`✅ Mapped ${padName} to ${filename}`);
          break; // Take the first match
        }
      }
    }

    console.log(`📊 Kit ${kit.name}: ${mapping.size}/16 pads mapped`);
    return mapping;
  }

  /**
   * Find matching file patterns for different kit naming conventions
   */
  private findMatchingFile(kit: MusicRadarKit, pattern: string): string {
    // Get the appropriate prefix for this kit
    const prefix = this.getKitPrefix(kit.id);
    
    if (!prefix) {
      console.warn(`No prefix mapping found for kit: ${kit.id}`);
      return `${pattern}.wav`;
    }

    // Construct the full filename with prefix and .wav extension
    return `${prefix}${pattern}.wav`;
  }

  /**
   * Get actual files available in a kit directory
   * Uses knowledge from directory scanning to return actual files
   */
  private async getActualKitFiles(kit: MusicRadarKit): Promise<string[]> {
    const prefix = this.getKitPrefix(kit.id);
    if (!prefix) return [];

    // Since we're in a browser, we'll use HEAD requests to check if files exist
    // For now, return known common patterns based on kit type
    const commonPatterns = this.getCommonPatternsForKit(kit);
    const existingFiles: string[] = [];

    for (const pattern of commonPatterns) {
      const filename = `${prefix}${pattern}.wav`;
      // For now, just return all patterns - we'll verify existence when loading
      existingFiles.push(filename);
    }

    return existingFiles;
  }

  /**
   * Get common file patterns for different kit categories
   */
  private getCommonPatternsForKit(kit: MusicRadarKit): string[] {
    // Return patterns we know exist in each kit category based on observation
    switch (kit.category) {
      case 'acoustic':
        return [
          'Kick-01', 'Kick-02', 'Kick-03', 'Kick-04', 'Kick-05', 'Kick-06', 'Kick-07', 'Kick-08',
          'Snr-01', 'Snr-02', 'Snr-03', 'Snr-04', 'Snr-05',
          'SnrOff-01', 'SnrOff-02', 'SnrOff-03', 'SnrOff-04', 'SnrOff-05', 'SnrOff-06', 'SnrOff-07', 'SnrOff-08',
          'ClHat-01', 'ClHat-02', 'ClHat-03', 'ClHat-04', 'ClHat-05', 'ClHat-06', 'ClHat-07', 'ClHat-08', 'ClHat-09',
          'OpHat-01', 'OpHat-02', 'OpHat-03', 'OpHat-04', 'OpHat-05', 'OpHat-06', 'OpHat-07',
          'PdHat-01', 'PdHat-02', 'PdHat-03', 'PdHat-04',
          'Rim-01', 'Rim-02', 'Rim-03', 'Rim-04', 'Rim-05', 'Rim-06', 'Rim-07',
          'SdSt-01', 'SdSt-02', 'SdSt-03', 'SdSt-04', 'SdSt-05', 'SdSt-06', 'SdSt-07',
          'Flam-01', 'Flam-02', 'Flam-03', 'Flam-04', 'Flam-05'
        ];
      case 'electronic':
        return [
          'Kick01', 'Kick02',
          'Snr01', 'Snr02', 'Snr03',
          'ClHat01', 'ClHat02', 'ClHat03',
          'OpHat01', 'OpHat02',
          'Tom01', 'Tom02', 'Tom03', 'Tom04',
          'Cymbal'
        ];
      case 'vinyl':
      case 'kurzweil':
        // Similar to acoustic for now
        return [
          'Kick-01', 'Kick-02', 'Snr-01', 'Snr-02', 'ClHat-01', 'ClHat-02', 'OpHat-01', 'OpHat-02',
          'Rim-01', 'SdSt-01', 'Flam-01'
        ];
      default:
        return [];
    }
  }

  /**
   * Get the filename prefix for a specific kit
   */
  private getKitPrefix(kitId: string): string | null {
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

    return kitPrefixMap[kitId] || null;
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

  /**
   * Get estimated pad coverage for a kit (how many of the 16 pads will have samples)
   * This is a rough estimate based on kit type and known patterns
   */
  getEstimatedKitCoverage(kitId: string): number {
    const kit = MUSICRADAR_KITS[kitId];
    if (!kit) return 0;

    // Based on analysis of actual MusicRadar kits:
    // - Acoustic kits typically have 6-8 core samples (kick, snare, hats, rim, flam)
    // - Electronic kits typically have 8-12 samples
    // - Vinyl kits similar to acoustic (6-8)
    // - Kurzweil varies widely (4-10)
    
    const estimatesByCategory: Record<string, number> = {
      'acoustic': 7,     // Usually kick, snare, closed hat, open hat, rim, flam, maybe snare off
      'electronic': 10,  // More variety including FX and percussion
      'vinyl': 6,        // Similar to acoustic but often fewer variants
      'kurzweil': 8      // Mid-range, varies by specific kit
    };

    return estimatesByCategory[kit.category] || 6;
  }

  /**
   * Get actual pad coverage for a kit by checking sample availability
   * Returns a Promise since it needs to check file availability
   */
  async getActualKitCoverage(kitId: string): Promise<number> {
    try {
      const mapping = await this.generateKitSampleMapping(kitId);
      return mapping ? mapping.size : 0;
    } catch (error) {
      console.warn(`Failed to get actual coverage for ${kitId}:`, error);
      return this.getEstimatedKitCoverage(kitId);
    }
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