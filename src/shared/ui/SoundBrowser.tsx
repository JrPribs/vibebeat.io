import React, { useState, useEffect } from 'react';
import { musicRadarKitLoader, type MusicRadarKit } from '../../core/musicradar-kit-loader';
import { padTriggerService } from '../../core/pad-trigger-service';
import type { PadName } from '../models/audio';

interface SoundBrowserProps {
  currentKit: string;
  selectedPad?: PadName;
  onSoundSelect?: (sampleUrl: string, padName: PadName) => void;
  onClose?: () => void;
}

interface SampleInfo {
  name: string;
  url: string;
  padName: PadName;
  type: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom' | 'perc' | 'fx';
}

export function SoundBrowser({ currentKit, selectedPad, onSoundSelect, onClose }: SoundBrowserProps): JSX.Element {
  const [samples, setSamples] = useState<SampleInfo[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<SampleInfo[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // Load samples when kit changes
  useEffect(() => {
    loadKitSamples();
  }, [currentKit]);

  // Filter samples by type
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredSamples(samples);
    } else {
      setFilteredSamples(samples.filter(sample => sample.type === selectedType));
    }
  }, [samples, selectedType]);

  const loadKitSamples = async () => {
    setIsLoading(true);
    try {
      const kit = musicRadarKitLoader.getKit(currentKit);
      if (!kit) {
        setSamples([]);
        return;
      }

      const sampleMapping = await musicRadarKitLoader.generateKitSampleMapping(currentKit);
      if (!sampleMapping) {
        setSamples([]);
        return;
      }

      const sampleList: SampleInfo[] = [];
      
      for (const [padName, sampleUrl] of sampleMapping.entries()) {
        const fileName = sampleUrl.split('/').pop()?.replace('.wav', '') || '';
        const type = getSampleType(padName, fileName);
        
        sampleList.push({
          name: formatSampleName(fileName),
          url: sampleUrl,
          padName,
          type
        });
      }

      setSamples(sampleList);
    } catch (error) {
      console.error('Failed to load kit samples:', error);
      setSamples([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSampleType = (padName: PadName, fileName: string): SampleInfo['type'] => {
    const lowerFileName = fileName.toLowerCase();
    const lowerPadName = padName.toLowerCase();

    if (lowerFileName.includes('kick') || lowerPadName.includes('kick')) return 'kick';
    if (lowerFileName.includes('snr') || lowerFileName.includes('snare') || lowerPadName.includes('snare')) return 'snare';
    if (lowerFileName.includes('hat') || lowerPadName.includes('hihat')) return 'hihat';
    if (lowerFileName.includes('crash') || lowerFileName.includes('ride') || lowerFileName.includes('cymbal') || lowerPadName.includes('crash') || lowerPadName.includes('ride')) return 'cymbal';
    if (lowerFileName.includes('tom') || lowerPadName.includes('tom')) return 'tom';
    if (lowerFileName.includes('fx') || lowerFileName.includes('perc') || lowerPadName.includes('perc')) return 'perc';
    
    return 'fx';
  };

  const formatSampleName = (fileName: string): string => {
    return fileName
      .replace(/^CY[Cc]dh_[^_]*_/, '') // Remove MusicRadar prefix
      .replace(/-\d+$/, '') // Remove trailing numbers
      .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
      .trim();
  };

  const handleSamplePreview = async (sample: SampleInfo) => {
    if (playingUrl === sample.url) {
      setPlayingUrl(null);
      return;
    }

    setPlayingUrl(sample.url);
    try {
      // Trigger the pad to preview the sound
      await padTriggerService.triggerPad(sample.padName, 100);
      
      // Stop playing indicator after a delay
      setTimeout(() => {
        setPlayingUrl(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to preview sample:', error);
      setPlayingUrl(null);
    }
  };

  const handleSampleSelect = (sample: SampleInfo) => {
    if (selectedPad && onSoundSelect) {
      onSoundSelect(sample.url, selectedPad);
    }
  };

  const sampleTypes = [
    { id: 'all', name: 'All', count: samples.length },
    { id: 'kick', name: 'Kicks', count: samples.filter(s => s.type === 'kick').length },
    { id: 'snare', name: 'Snares', count: samples.filter(s => s.type === 'snare').length },
    { id: 'hihat', name: 'Hi-Hats', count: samples.filter(s => s.type === 'hihat').length },
    { id: 'cymbal', name: 'Cymbals', count: samples.filter(s => s.type === 'cymbal').length },
    { id: 'tom', name: 'Toms', count: samples.filter(s => s.type === 'tom').length },
    { id: 'perc', name: 'Percussion', count: samples.filter(s => s.type === 'perc').length },
    { id: 'fx', name: 'FX', count: samples.filter(s => s.type === 'fx').length }
  ];

  if (isLoading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
          <span className="ml-3 text-gray-400">Loading samples...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Sound Browser</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {selectedPad && (
        <div className="text-sm text-gray-400">
          Selecting sound for: <span className="text-white font-medium">{selectedPad.replace(/_/g, ' ')}</span>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {sampleTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedType === type.id
                ? 'bg-vibe-blue text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {type.name}
            <span className="ml-1 text-xs opacity-70">({type.count})</span>
          </button>
        ))}
      </div>

      {/* Sample List */}
      <div className="max-h-80 overflow-y-auto space-y-1">
        {filteredSamples.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No samples found for this filter
          </div>
        ) : (
          filteredSamples.map((sample, index) => (
            <div
              key={`${sample.url}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{sample.name}</div>
                <div className="text-xs text-gray-400">
                  {sample.type} • {sample.padName}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Preview Button */}
                <button
                  onClick={() => handleSamplePreview(sample)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    playingUrl === sample.url
                      ? 'bg-vibe-purple text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {playingUrl === sample.url ? '⏹' : '▶'}
                </button>
                
                {/* Select Button */}
                {selectedPad && (
                  <button
                    onClick={() => handleSampleSelect(sample)}
                    className="px-3 py-1 bg-vibe-blue text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-700">
        {filteredSamples.length} of {samples.length} samples shown
      </div>
    </div>
  );
}