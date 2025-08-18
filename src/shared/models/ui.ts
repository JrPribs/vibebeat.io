// UI Models
// User interface state and view management types

// Selection State
export interface SelectionState {
  selectedTrackId: string | null;
  selectedPad: string | null;
  selectedSteps: number[];
  editMode: 'select' | 'draw' | 'erase';
}

// UI State
export interface UIState {
  currentView: ViewMode;
  latencyMode: LatencyMode;
  sidebarCollapsed: boolean;
  loading: boolean;
  error: string | null;
  showHelp: boolean;
}

// UI State Types
export type ViewMode = 'pads' | 'keys' | 'sample' | 'record' | 'mixer' | 'arrange' | 'factory';
export type LatencyMode = 'low' | 'stable';
export type EditMode = 'select' | 'draw' | 'erase';

// Performance Metrics
export interface PerformanceMetrics {
  audioLatency: number;
  renderTime: number;
  cpuUsage: number;
  memoryUsage: number;
  droppedFrames: number;
}