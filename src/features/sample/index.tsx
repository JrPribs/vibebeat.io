// Phase 5 - Sample Editor View
// Professional audio editing with upload, waveform, trim, slice, pitch, and stretch

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Upload,
  File as FileIcon,
  Play,
  Pause,
  Square,
  Scissors,
  Zap,
  Volume2,
  Settings,
  Grid,
  Music,
  RotateCcw,
  Save,
  Download,
  Sliders,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { sampleEditorService, SampleEditorState, TransientSlice } from '../../core/sample-editor-service.js';
import { useStore, useAudioService } from '../../core/index.js';
import { uploadAudioRecording, getCurrentUser } from '../../lib/supabase.js';

export function SampleView(): JSX.Element {
  const { actions } = useStore();
  const { audioState } = useAudioService();
  
  // Editor state
  const [editorState, setEditorState] = useState<SampleEditorState>({
    currentFile: null,
    audioBuffer: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    trimStart: 0,
    trimEnd: 0,
    selectedRegion: null,
    transientSlices: [],
    sliceSensitivity: 5,
    pitchShift: 0,
    timeStretch: 1,
    waveformData: null,
    fileInfo: null,
    isPlaying: false,
    playbackPosition: 0
  });
  
  const [user, setUser] = useState<any>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'upload' | 'trim' | 'slice' | 'process'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [processingOptions, setProcessingOptions] = useState({
    quality: 'standard' as const,
    preserveFormants: true
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Initialize service and auth
  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);
  
  // File upload handlers
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    try {
      setEditorState(prev => ({ ...prev, isLoading: true }));
      
      // Mock file loading process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditorState(prev => ({
        ...prev,
        currentFile: file,
        fileInfo: {
          name: file.name,
          size: file.size,
          duration: 30, // Mock duration
          sampleRate: 44100,
          channels: 2,
          format: 'wav',
          detectedBPM: 120
        },
        trimEnd: 30,
        isLoading: false
      }));
      
      setActiveTab('trim');
    } catch (error) {
      actions.setError(`Failed to load file: ${error.message}`);
      setEditorState(prev => ({ ...prev, isLoading: false }));
    }
  }, [actions]);
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };
  
  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  // Upload tab content
  const renderUploadTab = () => (
    <div className="space-y-6">
      {!editorState.currentFile ? (
        <div
          ref={dropZoneRef}
          className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-vibe-purple transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Upload Audio File</h3>
          <p className="text-gray-400 mb-4">
            Drag and drop your audio file here, or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Supports WAV, MP3, AIFF, M4A • Max 50MB
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-vibe-purple hover:bg-vibe-purple-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <FileIcon className="h-8 w-8 text-vibe-purple" />
            <div>
              <h3 className="font-semibold">{editorState.fileInfo?.name}</h3>
              <p className="text-sm text-gray-400">
                {(editorState.fileInfo?.size! / 1024 / 1024).toFixed(1)}MB • 
                {formatTime(editorState.fileInfo?.duration || 0)} • 
                {editorState.fileInfo?.sampleRate}Hz
              </p>
            </div>
          </div>
          
          {editorState.fileInfo?.detectedBPM && (
            <div className="text-sm text-gray-400">
              Detected BPM: {editorState.fileInfo.detectedBPM}
            </div>
          )}
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 text-vibe-purple hover:text-vibe-purple-light transition-colors"
          >
            Load Different File
          </button>
        </div>
      )}
      
      {editorState.isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-purple mx-auto mb-2"></div>
          <p className="text-gray-400">Loading audio file...</p>
        </div>
      )}
    </div>
  );
  
  // Trim tab content
  const renderTrimTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Trim Audio</h3>
        <div className="bg-gray-900 h-32 rounded mb-4 flex items-center justify-center">
          <span className="text-gray-500">Waveform Display</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="number"
              step="0.001"
              value={editorState.trimStart.toFixed(3)}
              className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="number"
              step="0.001"
              value={editorState.trimEnd.toFixed(3)}
              className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
              readOnly
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-400">
          Duration: {formatTime(editorState.trimEnd - editorState.trimStart)}
        </div>
      </div>
    </div>
  );
  
  // Slice tab content
  const renderSliceTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Transient Detection</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Sensitivity</label>
          <input
            type="range"
            min="1"
            max="10"
            value={editorState.sliceSensitivity}
            className="w-full"
            readOnly
          />
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          {editorState.transientSlices.length} slices detected
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[...Array(16)].map((_, i) => (
            <button
              key={i}
              className="p-3 rounded text-sm font-medium bg-gray-700 text-gray-400"
            >
              Pad {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Process tab content
  const renderProcessTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pitch Shift */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Pitch Shift</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Semitones</label>
            <input
              type="range"
              min="-12"
              max="12"
              value={editorState.pitchShift}
              className="w-full"
              readOnly
            />
            <div className="text-center mt-1 text-sm">
              {editorState.pitchShift > 0 ? '+' : ''}{editorState.pitchShift}
            </div>
          </div>
        </div>
        
        {/* Time Stretch */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Time Stretch</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Ratio</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={editorState.timeStretch}
              className="w-full"
              readOnly
            />
            <div className="text-center mt-1 text-sm">
              {editorState.timeStretch.toFixed(1)}x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Sample Editor</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'upload', label: 'Upload', icon: Upload },
          { id: 'trim', label: 'Trim', icon: Scissors },
          { id: 'slice', label: 'Slice', icon: Grid },
          { id: 'process', label: 'Process', icon: Sliders }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-vibe-purple text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            disabled={id !== 'upload' && !editorState.currentFile}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'trim' && renderTrimTab()}
        {activeTab === 'slice' && renderSliceTab()}
        {activeTab === 'process' && renderProcessTab()}
      </div>
      
      {/* Save Button */}
      {editorState.currentFile && (
        <div className="mt-8 text-center">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            disabled={isUploading}
          >
            <Save className="h-5 w-5 mr-2 inline" />
            {isUploading ? 'Saving...' : user ? 'Save to Cloud' : 'Save Locally'}
          </button>
        </div>
      )}
    </div>
  );
}

export default SampleView;