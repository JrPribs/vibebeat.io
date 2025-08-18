// AI Service Types
export interface AIProvider {
  generateDrumPattern(input: DrumPatternInput): Promise<DrumPatternOutput>;
  generateMelody(input: MelodyInput): Promise<MelodyOutput>;
}

export interface DrumPatternInput {
  tempo: number;
  style: string;
  bars: number;
  grid: number;
  kitMap: Record<string, string>;
  density: 'sparse' | 'medium' | 'dense';
  swing: number;
  humanize: boolean;
}

export interface DrumPatternOutput {
  pattern: DrumHit[];
}

export interface DrumHit {
  step: number;
  pad: string;
  velocity: number;
}

export interface MelodyInput {
  tempo: number;
  style: string;
  bars: number;
  key: string;
  scale: string;
  contour: 'rising' | 'falling' | 'wave' | 'random';
  density: 'sparse' | 'medium' | 'dense';
  complexity: 'simple' | 'medium' | 'complex';
  octaveRange: [number, number];
  humanize?: boolean;
}

export interface MelodyOutput {
  notes: MelodyNote[];
}

export interface MelodyNote {
  step: number;
  pitch: string;
  duration: number;
  velocity: number;
}

export interface RepairService {
  repairJSON(json: string): any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AILogEntry {
  timestamp: number;
  tool: string;
  input: any;
  output: any;
  success: boolean;
}