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

interface ActivityCanvasProps {
  waveformData: any;
  width: number;
  height: number;
  trimStart: number;
  trimEnd: number;
  selectedRegion: { start: number; end: number } | null;
  transientSlices: TransientSlice[];
  playbackPosition: number;
  onTrimChange: (start: number, end: number) => void;
  onRegionSelect: (start: number, end: number) => void;
  onSliceAdd: (position: number) => void;
  onSliceRemove: (id: string) => void;
}

const ActivityCanvas: React.FC<ActivityCanvasProps> = ({
  waveformData,
  width,
  height,
  trimStart,
  trimEnd,
  selectedRegion,
  transientSlices,
  playbackPosition,
  onTrimChange,
  onRegionSelect,
  onSliceAdd,
  onSliceRemove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'trim-start' | 'trim-end' | 'region' | null>(null);
  const [dragStart, setDragStart] = useState(0);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size for high DPI
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    const peaks = waveformData.peaks;
    const duration = waveformData.duration;
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform peaks
    ctx.fillStyle = '#6366f1';
    const centerY = height / 2;
    
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const peak = peaks[i];
      const peakHeight = peak * centerY * 0.9;
      
      ctx.fillRect(x, centerY - peakHeight, 1, peakHeight * 2);
    }
    
    // Draw trim regions
    const trimStartX = (trimStart / duration) * width;
    const trimEndX = (trimEnd / duration) * width;
    
    // Dimmed areas outside trim
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, trimStartX, height);
    ctx.fillRect(trimEndX, 0, width - trimEndX, height);
    
    // Trim handles
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(trimStartX - 2, 0, 4, height);
    ctx.fillRect(trimEndX - 2, 0, 4, height);
    
    // Selected region
    if (selectedRegion) {
      const startX = (selectedRegion.start / duration) * width;
      const endX = (selectedRegion.end / duration) * width;
      
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, endX - startX, height);
    }
    
    // Slice markers
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    transientSlices.forEach(slice => {
      const x = (slice.position / duration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Intensity indicator
      const intensityHeight = slice.intensity * 10;
      ctx.fillStyle = slice.assigned ? '#10b981' : '#f59e0b';
      ctx.fillRect(x - 1, height - intensityHeight, 2, intensityHeight);
    });
    
    // Playback cursor
    if (playbackPosition > 0) {
      const playX = (playbackPosition / duration) * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();
    }
    
    // Time grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
  }, [waveformData, width, height, trimStart, trimEnd, selectedRegion, transientSlices, playbackPosition]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!waveformData) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = (x / width) * waveformData.duration;
    
    // Check if clicking on trim handles
    const trimStartX = (trimStart / waveformData.duration) * width;
    const trimEndX = (trimEnd / waveformData.duration) * width;
    
    if (Math.abs(x - trimStartX) < 10) {
      setDragType('trim-start');
      setIsDragging(true);
    } else if (Math.abs(x - trimEndX) < 10) {
      setDragType('trim-end');
      setIsDragging(true);
    } else {
      // Start region selection
      setDragType('region');
      setIsDragging(true);
      setDragStart(timePosition);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !waveformData) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = Math.max(0, Math.min(waveformData.duration, (x / width) * waveformData.duration));
    
    if (dragType === 'trim-start') {
      onTrimChange(timePosition, trimEnd);
    } else if (dragType === 'trim-end') {
      onTrimChange(trimStart, timePosition);
    } else if (dragType === 'region') {
      const start = Math.min(dragStart, timePosition);
      const end = Math.max(dragStart, timePosition);
      onRegionSelect(start, end);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!waveformData) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timePosition = (x / width) * waveformData.duration;
    
    onSliceAdd(timePosition);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-600 rounded cursor-crosshair"
      style={{ width: `${width}px`, height: `${height}px` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    />
  );
};

export function SampleView(): JSX.Element {
  const { actions } = useStore();
  const { audioState } = useAudioService();
  
  // Editor state
  const [editorState, setEditorState] = useState<SampleEditorState>(sampleEditorService.getState());
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
    const unsubscribe = sampleEditorService.subscribe(setEditorState);
    
    getCurrentUser().then(setUser);
    
    return () => {
      unsubscribe();
      sampleEditorService.dispose();
    };
  }, []);
  
  // File upload handlers
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    try {
      await sampleEditorService.loadFile(file);
      setActiveTab('trim');
    } catch (error) {
      actions.setError(`Failed to load file: ${error.message}`);
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
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
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
  
  // Playback controls
  const handlePlay = () => {
    if (editorState.isPlaying) {
      sampleEditorService.stopPreview();
    } else {
      const startTime = editorState.selectedRegion?.start || editorState.trimStart || 0;
      sampleEditorService.playPreview(startTime);
    }
  };
  
  // Trim controls
  const handleTrimChange = (start: number, end: number) => {
    sampleEditorService.setState({ trimStart: start, trimEnd: end });
  };
  
  const handleAutoTrim = () => {
    const trimPoints = sampleEditorService.autoTrimSilence(-40);
    handleTrimChange(trimPoints.start, trimPoints.end);
  };
  
  // Region selection
  const handleRegionSelect = (start: number, end: number) => {
    sampleEditorService.setState({ selectedRegion: { start, end } });
  };
  
  // Slice controls
  const handleSliceAdd = (position: number) => {
    const newSlice = {
      position,
      intensity: 0.8,
      id: `manual_${Date.now()}`,
      assigned: false
    };
    
    const slices = [...editorState.transientSlices, newSlice].sort((a, b) => a.position - b.position);
    sampleEditorService.setState({ transientSlices: slices });
  };
  
  const handleSliceRemove = (id: string) => {
    const slices = editorState.transientSlices.filter(s => s.id !== id);
    sampleEditorService.setState({ transientSlices: slices });
  };
  
  const handleSensitivityChange = (sensitivity: number) => {
    sampleEditorService.updateSliceSensitivity(sensitivity);
  };
  
  // Processing
  const handlePitchChange = (semitones: number) => {
    sampleEditorService.setState({ pitchShift: semitones });
  };
  
  const handleStretchChange = (ratio: number) => {
    sampleEditorService.setState({ timeStretch: ratio });
  };
  
  // Save and export
  const handleSave = async () => {
    if (!editorState.audioBuffer) return;
    
    try {
      setIsUploading(true);
      
      // Apply current edits
      let processedBuffer = editorState.audioBuffer;
      
      // Apply trim
      if (editorState.trimStart > 0 || editorState.trimEnd < editorState.audioBuffer.duration) {
        processedBuffer = sampleEditorService.trimAudio(editorState.trimStart, editorState.trimEnd);
      }
      
      // Apply pitch shift
      if (editorState.pitchShift !== 0) {
        processedBuffer = await sampleEditorService.pitchShift(editorState.pitchShift, processingOptions);
      }
      
      // Apply time stretch
      if (editorState.timeStretch !== 1) {
        processedBuffer = await sampleEditorService.timeStretch(editorState.timeStretch, processingOptions);
      }
      
      // Convert to base64 and upload
      const audioData = await audioBufferToBase64(processedBuffer);
      const fileName = `edited-${editorState.currentFile?.name || 'sample.wav'}`;
      
      if (user) {
        // Upload to cloud
        await uploadAudioRecording(audioData, fileName, {
          duration: processedBuffer.duration,
          sampleRate: processedBuffer.sampleRate,
          recordingType: 'edited-upload',
          originalFile: editorState.currentFile?.name
        });
      } else {
        // Save locally
        const blob = await audioBufferToBlob(processedBuffer);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      setIsUploading(false);
      
    } catch (error) {
      setIsUploading(false);
      actions.setError(`Save failed: ${error.message}`);
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
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Trim Audio</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlay}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              {editorState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={handleAutoTrim}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              Auto Trim
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="number"
              step="0.001"
              value={editorState.trimStart.toFixed(3)}
              onChange={(e) => handleTrimChange(parseFloat(e.target.value), editorState.trimEnd)}
              className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="number"
              step="0.001"
              value={editorState.trimEnd.toFixed(3)}
              onChange={(e) => handleTrimChange(editorState.trimStart, parseFloat(e.target.value))}
              className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
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
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Aggressive</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          {editorState.transientSlices.length} slices detected • 
          {editorState.transientSlices.filter(s => s.assigned).length} assigned to pads
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[...Array(16)].map((_, i) => {
            const slice = editorState.transientSlices[i];
            return (
              <button
                key={i}
                className={`p-3 rounded text-sm font-medium transition-colors ${
                  slice 
                    ? 'bg-vibe-purple hover:bg-vibe-purple-dark text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
                disabled={!slice}
                onClick={() => slice && sampleEditorService.playPreview(slice.position)}
              >
                Pad {i + 1}
                {slice && (
                  <div className="text-xs opacity-75">
                    {formatTime(slice.position)}
                  </div>
                )}
              </button>
            );
          })}
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
              onChange={(e) => handlePitchChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-12</span>
              <span>0</span>
              <span>+12</span>
            </div>
            <div className="text-center text-sm mt-2">
              {editorState.pitchShift > 0 ? '+' : ''}{editorState.pitchShift} semitones
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
              onChange={(e) => handleStretchChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
            </div>
            <div className="text-center text-sm mt-2">
              {editorState.timeStretch}x speed
            </div>
          </div>
        </div>
      </div>
      
      {/* Processing Options */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Processing Options</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={processingOptions.preserveFormants}
              onChange={(e) => setProcessingOptions(prev => ({ ...prev, preserveFormants: e.target.checked }))}
              className="text-vibe-blue"
            />
            <span className="text-sm">Preserve formants (vocal processing)</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={processingOptions.quality}
              onChange={(e) => setProcessingOptions(prev => ({ ...prev, quality: e.target.value as 'standard' | 'high' }))}
              className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
            >
              <option value="standard">Standard</option>
              <option value="high">High Quality</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sample Editor</h2>
          <p className="text-gray-400 text-sm">
            Professional audio editing with trim, slice, pitch, and stretch
          </p>
        </div>
        
        {editorState.currentFile && (
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="px-4 py-2 bg-vibe-purple hover:bg-vibe-purple-dark text-white rounded transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            {isUploading ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        {(['upload', 'trim', 'slice', 'process'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={tab !== 'upload' && !editorState.currentFile}
            className={`px-4 py-2 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-vibe-purple text-vibe-purple'
                : 'border-transparent text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Waveform Display */}
      {editorState.waveformData && activeTab !== 'upload' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Waveform</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlay}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {editorState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <ActivityCanvas
            waveformData={editorState.waveformData}
            width={800}
            height={200}
            trimStart={editorState.trimStart}
            trimEnd={editorState.trimEnd}
            selectedRegion={editorState.selectedRegion}
            transientSlices={editorState.transientSlices}
            playbackPosition={editorState.playbackPosition}
            onTrimChange={handleTrimChange}
            onRegionSelect={handleRegionSelect}
            onSliceAdd={handleSliceAdd}
            onSliceRemove={handleSliceRemove}
          />
          
          <div className="mt-2 text-xs text-gray-400">
            Drag to trim • Double-click to add slice • Click trim handles to adjust
          </div>
        </div>
      )}
      
      {/* Tab Content */}
      <div>
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'trim' && renderTrimTab()}
        {activeTab === 'slice' && renderSliceTab()}
        {activeTab === 'process' && renderProcessTab()}
      </div>
    </div>
  );
}
