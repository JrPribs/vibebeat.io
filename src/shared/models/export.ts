// Export Models
// Types for exporting projects and audio content

// Export Options Enhanced
export interface ExportOptions {
  format: 'mp3' | 'wav' | 'project';
  quality: 'low' | 'medium' | 'high';
  bitrate?: number; // For MP3
  sampleRate?: number; // For WAV
  includeProject: boolean;
  includeAssets: boolean;
  filename?: string;
}