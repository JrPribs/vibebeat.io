import React, { useState, useEffect } from 'react';
import { SoundBrowser } from './SoundBrowser';
import { padTriggerService } from '../../core/pad-trigger-service';
import { toneDrumService } from '../../core/tone-drum-service';
import type { PadName } from '../models/audio';

interface PadAssignmentProps {
  padName: PadName;
  currentKit: string;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentChange?: (padName: PadName, sampleUrl: string) => void;
}

export function PadAssignment({ 
  padName, 
  currentKit, 
  isOpen, 
  onClose, 
  onAssignmentChange 
}: PadAssignmentProps): JSX.Element | null {
  const [currentSample, setCurrentSample] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Get current sample assignment for this pad
      const samples = toneDrumService.getPadSamples();
      const sample = samples.get(padName);
      setCurrentSample(typeof sample === 'string' ? sample : null);
    }
  }, [isOpen, padName]);

  const handleSoundSelect = async (sampleUrl: string, targetPadName: PadName) => {
    setIsAssigning(true);
    try {
      // Create a temporary sample mapping with just this pad
      const tempMapping = new Map<PadName, string>();
      tempMapping.set(targetPadName, sampleUrl);
      
      // Load the new sample for this specific pad
      await toneDrumService.loadKitSamples(`custom-${Date.now()}`, tempMapping);
      
      setCurrentSample(sampleUrl);
      onAssignmentChange?.(targetPadName, sampleUrl);
      onClose();
    } catch (error) {
      console.error('Failed to assign sample to pad:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const formatPadName = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  };

  const formatSampleName = (url: string): string => {
    const fileName = url.split('/').pop()?.replace('.wav', '') || '';
    return fileName
      .replace(/^CY[Cc]dh_[^_]*_/, '') // Remove MusicRadar prefix
      .replace(/-\d+$/, '') // Remove trailing numbers
      .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
      .trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Assign Sound to {formatPadName(padName)}
              </h2>
              {currentSample && (
                <p className="text-sm text-gray-400 mt-1">
                  Current: {formatSampleName(currentSample)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4">
          {isAssigning && (
            <div className="mb-4 p-3 bg-vibe-blue bg-opacity-20 border border-vibe-blue rounded">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vibe-blue mr-2"></div>
                <span className="text-vibe-blue text-sm">Assigning sample...</span>
              </div>
            </div>
          )}

          <SoundBrowser
            currentKit={currentKit}
            selectedPad={padName}
            onSoundSelect={handleSoundSelect}
          />
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Click a sample's preview button to test it, then click Select to assign it to this pad.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}