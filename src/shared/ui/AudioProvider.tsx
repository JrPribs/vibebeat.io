// Audio Provider Component
// Manages audio system initialization and provides audio context

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAudioService } from '../../core/use-audio-service';
import type { AudioContextState } from '../models/audio';

interface AudioProviderContextType {
  audioState: AudioContextState;
  initializeAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  suspendAudio: () => Promise<void>;
  isInitialized: boolean;
  hasUserInteracted: boolean;
  latencyMs: number;
}

const AudioProviderContext = createContext<AudioProviderContextType | null>(null);

export const useAudioContext = () => {
  const context = useContext(AudioProviderContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioService = useAudioService();
  const [showEnableAudio, setShowEnableAudio] = useState(false);
  
  // Show "Enable Audio" overlay if audio needs user interaction
  useEffect(() => {
    // Check if we need to show the enable audio overlay
    const needsUserInteraction = !audioService.hasUserInteracted && !audioService.isInitialized;
    setShowEnableAudio(needsUserInteraction);
    
    // Auto-hide modal when audio is successfully initialized
    if (audioService.isInitialized && audioService.hasUserInteracted) {
      setShowEnableAudio(false);
    }
  }, [audioService.hasUserInteracted, audioService.isInitialized]);

  const handleEnableAudio = async () => {
    console.log('🎵 User clicked Enable Audio');
    try {
      await audioService.initializeAudioManually();
      setShowEnableAudio(false);
      console.log('✅ Audio initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
    }
  };

  const contextValue: AudioProviderContextType = {
    audioState: audioService.audioState,
    initializeAudio: audioService.initializeAudioManually,
    resumeAudio: audioService.resumeAudio,
    suspendAudio: audioService.suspendAudio,
    isInitialized: audioService.isInitialized,
    hasUserInteracted: audioService.hasUserInteracted,
    latencyMs: audioService.latencyMs
  };

  return (
    <AudioProviderContext.Provider value={contextValue}>
      {children}
      
      {/* Audio Enable Overlay */}
      {showEnableAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 text-center max-w-md">
            <div className="text-4xl mb-4">🎵</div>
            <h2 className="text-xl font-bold text-white mb-4">
              Enable Audio System
            </h2>
            <p className="text-gray-300 mb-6">
              Click the button below to initialize the audio system and start creating music.
            </p>
            <button
              onClick={handleEnableAudio}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Enable Audio
            </button>
            <p className="text-gray-400 text-sm mt-4">
              This is required for Web Audio API to work in your browser.
            </p>
          </div>
        </div>
      )}
    </AudioProviderContext.Provider>
  );
};

export default AudioProvider;