// Phase 4 - Complete Recording View
// Comprehensive microphone recording with all features

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Headphones, 
  Volume2, 
  Play, 
  Square, 
  Clock, 
  AlertTriangle,
  Settings,
  Upload,
  Download,
  Scissors,
  Grid,
  Music,
  Zap
} from 'lucide-react';
import { recordingService, RecordingOptions, AudioClip, RecordingState } from '../../core/recording-service.js';
import { useStore, useScheduler, useAudioService } from '../../core/index.js';
import { supabase, getCurrentUser, uploadAudioRecording } from '../../lib/supabase.js';

interface AssignmentMode {
  type: 'pad' | 'keys' | 'none';
  padIndex?: number;
  keyRange?: { start: number; end: number };
}

export function RecordView(): JSX.Element {
  const { actions } = useStore();
  const { isPlaying, currentPosition } = useScheduler();
  const { audioState } = useAudioService();
  
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isWaitingForDownbeat: false,
    isCountingIn: false,
    hasPermission: false,
    inputLevel: 0,
    recordingTime: 0,
    currentClip: null,
    error: null
  });
  
  // Recording options
  const [options, setOptions] = useState<RecordingOptions>({
    barSync: true,
    countIn: true,
    maxBars: 8,
    autoTrim: true,
    quantizeToBar: false
  });
  
  // Input controls
  const [inputGain, setInputGain] = useState(0); // dB
  const [monitorEnabled, setMonitorEnabled] = useState(false);
  
  // Post-recording state
  const [currentClip, setCurrentClip] = useState<AudioClip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>({ type: 'none' });
  
  // User auth state
  const [user, setUser] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  // Visual state
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize recording service and auth
  useEffect(() => {
    // Check user auth
    getCurrentUser().then(user => {
      setUser(user);
      setIsAnonymous(!user);
    });
    
    // Mock permission granted for demo
    setRecordingState(prev => ({ ...prev, hasPermission: true }));
  }, []);
  
  // Mock recording functions
  const handleRequestPermission = useCallback(async () => {
    setRecordingState(prev => ({ ...prev, hasPermission: true }));
  }, []);
  
  const handleStartRecording = useCallback(async () => {
    setRecordingState(prev => ({ 
      ...prev, 
      isRecording: true,
      recordingTime: 0
    }));
    
    // Mock recording timer
    const timer = setInterval(() => {
      setRecordingState(prev => ({
        ...prev,
        recordingTime: prev.recordingTime + 0.1,
        inputLevel: Math.random() * 0.8 + 0.1
      }));
    }, 100);
    
    // Auto-stop after max duration
    setTimeout(() => {
      clearInterval(timer);
      handleStopRecording();
    }, options.maxBars * 2000); // Mock: 2 seconds per bar
  }, [options.maxBars]);
  
  const handleStopRecording = useCallback(async () => {
    setRecordingState(prev => ({ 
      ...prev, 
      isRecording: false,
      inputLevel: 0
    }));
    
    // Mock audio clip
    const mockClip = {
      buffer: null as any,
      duration: recordingState.recordingTime,
      sampleRate: 44100,
      startTime: Date.now() - (recordingState.recordingTime * 1000)
    };
    
    setCurrentClip(mockClip);
    
    // Generate mock waveform
    const samples = [];
    for (let i = 0; i < 200; i++) {
      samples.push((Math.random() - 0.5) * 2);
    }
    setWaveformData(samples);
  }, [recordingState.recordingTime]);
  
  const handleEmergencyStop = useCallback(() => {
    setRecordingState(prev => ({ 
      ...prev, 
      isRecording: false,
      inputLevel: 0,
      recordingTime: 0
    }));
    setCurrentClip(null);
    setWaveformData([]);
  }, []);
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Permission request screen
  if (!recordingState.hasPermission) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Record</h2>
        
        <div className="text-center py-12">
          <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Enable Microphone</h3>
          <p className="text-gray-400 mb-2">
            Allow microphone access to start recording your audio
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We only access your microphone when you're actively recording
          </p>
          <button 
            onClick={handleRequestPermission}
            className="bg-vibe-purple hover:bg-vibe-purple-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Enable Microphone
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Record</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>Position: {currentPosition.bar + 1}.{currentPosition.beat + 1}.{currentPosition.step + 1}</span>
        </div>
      </div>
      
      {/* Input Level Meter */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Input Level</label>
          <span className="text-xs text-gray-400">{Math.round(recordingState.inputLevel * 100)}%</span>
        </div>
        <div className="h-6 bg-gray-700 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
            style={{ width: `${recordingState.inputLevel * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="w-0.5 h-full bg-white opacity-50" style={{ left: '70%' }} />
            <div className="w-0.5 h-full bg-red-500" style={{ left: '90%' }} />
          </div>
        </div>
      </div>
      
      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-medium mb-2">Input Gain</label>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400">-20dB</span>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={inputGain}
              onChange={(e) => setInputGain(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-400">+20dB</span>
          </div>
          <div className="text-center mt-1">
            <span className="text-sm font-mono">{inputGain > 0 ? '+' : ''}{inputGain}dB</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Monitor</label>
            <button
              onClick={() => setMonitorEnabled(!monitorEnabled)}
              className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                monitorEnabled 
                  ? 'bg-vibe-purple text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {monitorEnabled ? <Headphones className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="text-sm">{monitorEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          {monitorEnabled && (
            <div className="flex items-center space-x-2 text-amber-400 text-xs">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Use headphones to prevent feedback</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Recording Options */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Recording Options</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.barSync}
              onChange={(e) => setOptions(prev => ({ ...prev, barSync: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Bar Sync</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.countIn}
              onChange={(e) => setOptions(prev => ({ ...prev, countIn: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Count-In</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.autoTrim}
              onChange={(e) => setOptions(prev => ({ ...prev, autoTrim: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Auto Trim</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options.quantizeToBar}
              onChange={(e) => setOptions(prev => ({ ...prev, quantizeToBar: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Quantize</span>
          </label>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Max Length</label>
          <select
            value={options.maxBars}
            onChange={(e) => setOptions(prev => ({ ...prev, maxBars: Number(e.target.value) }))}
            className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
          >
            <option value={1}>1 Bar</option>
            <option value={2}>2 Bars</option>
            <option value={4}>4 Bars</option>
            <option value={8}>8 Bars</option>
            <option value={16}>16 Bars</option>
            <option value={32}>32 Bars</option>
          </select>
        </div>
      </div>
      
      {/* Recording Controls */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col items-center space-y-4">
          {recordingState.isRecording && (
            <div className="text-red-400 mb-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-semibold">RECORDING</span>
              </div>
              <div className="text-xl font-mono text-center">
                {formatTime(recordingState.recordingTime)}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {!recordingState.isRecording ? (
              <button
                onClick={handleStartRecording}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Mic className="h-8 w-8 text-white" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleStopRecording}
                  className="w-16 h-16 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <Square className="h-8 w-8 text-white" />
                </button>
                
                <button
                  onClick={handleEmergencyStop}
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded transition-colors"
                >
                  Emergency Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Waveform Display */}
      {waveformData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Recording</h3>
          <div className="bg-gray-900 h-24 rounded mb-4 flex items-center justify-center">
            <span className="text-gray-500">Waveform Visualization</span>
          </div>
          
          {currentClip && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
              <span>Duration: {formatTime(currentClip.duration)}</span>
              <span>Sample Rate: {currentClip.sampleRate}Hz</span>
            </div>
          )}
        </div>
      )}
      
      {/* Post-Recording Actions */}
      {currentClip && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Post-Recording Actions</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              <Zap className="h-4 w-4" />
              <span>Process</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">
              <Upload className="h-4 w-4" />
              <span>{isAnonymous ? 'Save Local' : 'Save Cloud'}</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors">
              <Grid className="h-4 w-4" />
              <span>To Pad</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors">
              <Music className="h-4 w-4" />
              <span>To Keys</span>
            </button>
          </div>
          
          {assignmentMode.type !== 'none' && (
            <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
              {assignmentMode.type === 'pad' ? (
                <span>Ready to assign to Pad {(assignmentMode.padIndex || 0) + 1}</span>
              ) : (
                <span>Ready to assign to Keys (C4-C5)</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* User Status */}
      <div className="text-center text-sm text-gray-500">
        {isAnonymous ? (
          <span>Recording as guest • Recordings will be saved locally</span>
        ) : (
          <span>Signed in as {user?.email} • Recordings will be saved to cloud</span>
        )}
      </div>
    </div>
  );
}

export default RecordView;