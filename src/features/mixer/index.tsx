// Mixer Feature
// Track mixing and effects

import React from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import type { Track } from '../../shared/models';

export interface MixerViewProps {
  tracks: Track[];
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
}

export function MixerView({ tracks, onTrackUpdate }: MixerViewProps): JSX.Element {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Mixer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <div key={track.id} className="bg-gray-800 p-4 rounded-lg">
            {/* Track Header */}
            <div className="mb-4">
              <h3 className="font-semibold">{track.name}</h3>
              <p className="text-xs text-gray-400 uppercase">{track.type}</p>
            </div>
            
            {/* Volume */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm flex items-center space-x-1">
                  <Volume2 className="h-4 w-4" />
                  <span>Volume</span>
                </label>
                <span className="text-xs text-gray-400">
                  {Math.round(track.mixer.vol * 100)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={track.mixer.vol * 100}
                onChange={(e) => onTrackUpdate(track.id, {
                  mixer: { ...track.mixer, vol: parseInt(e.target.value) / 100 }
                })}
                className="w-full"
              />
            </div>
            
            {/* Pan */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm flex items-center space-x-1">
                  <RotateCcw className="h-4 w-4" />
                  <span>Pan</span>
                </label>
                <span className="text-xs text-gray-400">
                  {track.mixer.pan > 0 ? 'R' : track.mixer.pan < 0 ? 'L' : 'C'}
                  {Math.abs(Math.round(track.mixer.pan * 100))}
                </span>
              </div>
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={track.mixer.pan * 100}
                onChange={(e) => onTrackUpdate(track.id, {
                  mixer: { ...track.mixer, pan: parseInt(e.target.value) / 100 }
                })}
                className="w-full"
              />
            </div>
            
            {/* Send Effects */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Send A (Reverb)</label>
                  <span className="text-xs text-gray-400">{Math.round(track.mixer.sendA * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={track.mixer.sendA * 100}
                  onChange={(e) => onTrackUpdate(track.id, {
                    mixer: { ...track.mixer, sendA: parseInt(e.target.value) / 100 }
                  })}
                  className="w-full h-2"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Send B (Delay)</label>
                  <span className="text-xs text-gray-400">{Math.round(track.mixer.sendB * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={track.mixer.sendB * 100}
                  onChange={(e) => onTrackUpdate(track.id, {
                    mixer: { ...track.mixer, sendB: parseInt(e.target.value) / 100 }
                  })}
                  className="w-full h-2"
                />
              </div>
            </div>
            
            {/* Mute/Solo */}
            <div className="flex space-x-2 mt-4">
              <button className="btn-secondary flex-1 text-xs">Mute</button>
              <button className="btn-secondary flex-1 text-xs">Solo</button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Master Section */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Master</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Master Volume</label>
            <input type="range" min="0" max="100" defaultValue="80" className="w-full" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Soft Clip</label>
            <button className="btn-secondary w-full">-1dBTP Guard</button>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Output</label>
            <div className="h-8 bg-gray-700 rounded flex items-center px-3">
              <div className="text-sm text-gray-300">Stereo Out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}