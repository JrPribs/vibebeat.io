import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, Settings, Download, LogIn } from 'lucide-react';
import { audioService } from '../core/audio-service';
import type { AudioContextState } from '../shared/models/audio';

export function TopBar(): JSX.Element {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioState, setAudioState] = useState<AudioContextState | null>(null);
  const [latencyMode, setLatencyMode] = useState<'low' | 'stable'>('stable');
  
  // Initialize audio and subscribe to state changes
  // useEffect(() => {
  //   const unsubscribe = audioService.subscribe(setAudioState);
    
  //   // Initialize audio context on mount
  //   audioService.initialize({ latencyHint: 'interactive' })
  //     .catch(error => console.warn('Audio initialization failed:', error));
    
  //   return unsubscribe;
  // }, []);
  
  // Handle play/stop
  const handlePlayStop = async (): Promise<void> => {
    try {
      // if (audioService.needsUserGesture()) {
      //   await audioService.handleUserGesture();
      // }
      
      setIsPlaying(!isPlaying);
      // TODO: Integrate with transport in next phase
    } catch (error) {
      console.error('Playback error:', error);
    }
  };
  
  // Handle latency mode change
  const handleLatencyModeChange = async (mode: 'low' | 'stable'): Promise<void> => {
    try {
      setLatencyMode(mode);
      // await audioService.updateLatencyMode(mode);
    } catch (error) {
      console.error('Failed to update latency mode:', error);
    }
  };
  
  // Format latency for display
  const formatLatency = (latency: number): string => {
    return `${latency.toFixed(1)}ms`;
  };
  
  return (
    <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-4">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          vibebeat.io
        </div>
      </div>
      
      {/* Transport and Controls */}
      <div className="flex items-center space-x-6">
        {/* Tempo */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">BPM</span>
          <input 
            type="number" 
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-center focus:outline-none focus:border-blue-500"
            min={60}
            max={200}
          />
        </div>
        
        {/* Play/Stop */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePlayStop}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying 
                ? 'bg-green-700 hover:bg-green-800' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPlaying ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Metronome */}
        <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
          <Volume2 className="h-4 w-4" />
          <span className="text-sm">Click</span>
        </button>
        
        {/* Latency Mode and Display */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Latency</span>
            <select 
              value={latencyMode}
              onChange={(e) => handleLatencyModeChange(e.target.value as 'low' | 'stable')}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="stable">Stable</option>
            </select>
          </div>
          
          {/* Real-time Latency Display */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              !audioState?.isRunning 
                ? 'bg-red-500' 
                : audioState.outputLatency < 50 
                  ? 'bg-green-500' 
                  : audioState.outputLatency < 100 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-400 font-mono min-w-[40px]">
              {audioState ? formatLatency(audioState.outputLatency) : '---'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Audio Status Indicator */}
        {(!audioService.getState().isInitialized || audioService.getAudioContext()?.state === 'suspended') && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
            <Settings className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-yellow-300">Click to enable audio</span>
          </div>
        )}
        
        <button className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
          <Download className="h-4 w-4" />
          <span className="text-sm">Export</span>
        </button>
        
        <button className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
          <LogIn className="h-4 w-4" />
          <span className="text-sm">Login</span>
        </button>
      </div>
    </div>
  );
}