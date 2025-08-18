// Drum Grid Component
// 4x4 grid of interactive drum pads

import React from 'react';
import { DrumPad } from './DrumPad';
import { usePadTrigger } from '../../core/index';
import type { PadName } from '../../shared/models/index';

export const DrumGrid: React.FC = () => {
  const { triggerPad, hasPadSample, activeVoices } = usePadTrigger();

  const padLayout: PadName[] = [
    'KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN',
    'CLAP', 'CRASH', 'RIDE', 'TOM_HIGH',
    'TOM_MID', 'TOM_FLOOR', 'PERC_01', 'PERC_02',
    'PAD_13', 'PAD_14', 'PAD_15', 'PAD_16'
  ];

  const handlePadTrigger = (padName: PadName, velocity: number) => {
    triggerPad(padName, velocity);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Drum Pads</h3>
        <div className="text-sm text-gray-400">
          Active Voices: <span className="text-vibe-blue font-medium">{activeVoices.size}</span>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mb-4 p-3 bg-gray-700 rounded text-sm text-gray-300">
        <p className="mb-1">
          🎵 <strong>Click or tap pads to trigger sounds</strong>
        </p>
        <p className="text-xs text-gray-400">
          Distance from center affects velocity • Load a kit first to enable sounds
        </p>
      </div>
      
      {/* 4x4 Drum Pad Grid */}
      <div className="grid grid-cols-4 gap-3">
        {padLayout.map((padName, index) => (
          <DrumPad
            key={padName}
            padName={padName}
            padNumber={index + 1}
            isLoaded={hasPadSample(padName)}
            onTrigger={handlePadTrigger}
          />
        ))}
      </div>
      
      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Pro tip: Focus a pad with Tab and trigger with Space or Enter</p>
      </div>
    </div>
  );
};