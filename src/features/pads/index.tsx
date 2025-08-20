// Enhanced Pads Feature - Phase 3
// 4x4 drum pads with keyboard mappings, velocity control, and step sequencer

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useStore, usePadTrigger, useToneTransport, useAudioService, toneDrumService } from '../../core/index.js';
import { KitSelector } from '../../shared/ui/KitSelector.js';
import { StepSequencer } from '../../shared/ui/StepSequencer.js';
import { SwingQuantizeControls } from '../../shared/ui/SwingQuantizeControls.js';
import { PadAssignment } from '../../shared/ui/PadAssignment.js';
import { AIControls } from '../../components/AIControls';
import type { PadName } from '../../shared/models/index.js';

export const PadsView: React.FC = () => {
  const { triggerPad, hasPadSample, activeVoices, currentKit, setKit, isLoading } = usePadTrigger();
  const { isPlaying, currentPosition } = useToneTransport();
  const { audioState } = useAudioService();

  const [pressedPads, setPressedPads] = useState<Set<PadName>>(new Set());
  const [velocities, setVelocities] = useState<Map<PadName, number>>(new Map());
  const [padVolumes, setPadVolumes] = useState<Map<PadName, number>>(new Map());
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedPadForAssignment, setSelectedPadForAssignment] = useState<PadName | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pad layout with keyboard mappings - memoized to prevent infinite re-renders
  const padLayout = useMemo<Array<{padName: PadName, key: string, keyCode: string}>>(() => [
    {padName: 'KICK', key: 'Q', keyCode: 'KeyQ'},
    {padName: 'SNARE', key: 'W', keyCode: 'KeyW'},
    {padName: 'HIHAT_CLOSED', key: 'E', keyCode: 'KeyE'},
    {padName: 'HIHAT_OPEN', key: 'R', keyCode: 'KeyR'},
    {padName: 'CLAP', key: 'A', keyCode: 'KeyA'},
    {padName: 'CRASH', key: 'S', keyCode: 'KeyS'},
    {padName: 'RIDE', key: 'D', keyCode: 'KeyD'},
    {padName: 'TOM_HIGH', key: 'F', keyCode: 'KeyF'},
    {padName: 'TOM_MID', key: 'Z', keyCode: 'KeyZ'},
    {padName: 'TOM_FLOOR', key: 'X', keyCode: 'KeyX'},
    {padName: 'PERC_01', key: 'C', keyCode: 'KeyC'},
    {padName: 'PERC_02', key: 'V', keyCode: 'KeyV'},
    {padName: 'PAD_13', key: '1', keyCode: 'Digit1'},
    {padName: 'PAD_14', key: '2', keyCode: 'Digit2'},
    {padName: 'PAD_15', key: '3', keyCode: 'Digit3'},
    {padName: 'PAD_16', key: '4', keyCode: 'Digit4'}
  ], []);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!keyboardEnabled) return;

    const pad = padLayout.find(p => p.keyCode === e.code);
    if (!pad || pressedPads.has(pad.padName)) return;

    e.preventDefault();

    // Calculate velocity based on modifier keys
    let velocity = 100; // Default velocity
    if (e.shiftKey) velocity = 127; // High velocity
    if (e.ctrlKey || e.metaKey) velocity = 80; // Medium velocity
    if (e.altKey) velocity = 60; // Low velocity

    triggerPad(pad.padName, velocity);
    setPressedPads(prev => new Set([...prev, pad.padName]));
    setVelocities(prev => new Map([...prev, [pad.padName, velocity]]));
  }, [keyboardEnabled, pressedPads, triggerPad, padLayout]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const pad = padLayout.find(p => p.keyCode === e.code);
    if (!pad) return;

    setPressedPads(prev => {
      const newSet = new Set(prev);
      newSet.delete(pad.padName);
      return newSet;
    });

    // Clear velocity after a delay for visual feedback
    setTimeout(() => {
      setVelocities(prev => {
        const newMap = new Map(prev);
        newMap.delete(pad.padName);
        return newMap;
      });
    }, 150);
  }, [padLayout]);

  // Handle mouse/touch pad trigger
  const handlePadTrigger = useCallback((padName: PadName, velocity: number) => {
    triggerPad(padName, velocity);
    setPressedPads(prev => new Set([...prev, padName]));
    setVelocities(prev => new Map([...prev, [padName, velocity]]));

    // Clear visual state after trigger
    setTimeout(() => {
      setPressedPads(prev => {
        const newSet = new Set(prev);
        newSet.delete(padName);
        return newSet;
      });

      setTimeout(() => {
        setVelocities(prev => {
          const newMap = new Map(prev);
          newMap.delete(padName);
          return newMap;
        });
      }, 100);
    }, 50);
  }, [triggerPad]);

  // Handle pad volume change
  const handlePadVolumeChange = useCallback((padName: PadName, volume: number) => {
    const normalizedVolume = volume / 100; // Convert 0-100 to 0-1
    setPadVolumes(prev => new Map([...prev, [padName, volume]]));
    toneDrumService.setPadGain(padName, normalizedVolume);
  }, []);

  // Initialize default volumes when kit changes
  useEffect(() => {
    if (currentKit) {
      // Set default volume to 80% for all pads
      const defaultVolumes = new Map<PadName, number>();
      padLayout.forEach(({ padName }) => {
        if (hasPadSample(padName)) {
          defaultVolumes.set(padName, 80);
          toneDrumService.setPadGain(padName, 0.8);
        }
      });
      setPadVolumes(defaultVolumes);
    }
  }, [currentKit, padLayout, hasPadSample]);

  // Set up keyboard listeners
  useEffect(() => {
    if (!keyboardEnabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, keyboardEnabled]);

  // Enhanced pad component with velocity-based visuals and volume controls
  const EnhancedPad: React.FC<{
    padName: PadName;
    keyBinding: string;
    index: number;
  }> = ({ padName, keyBinding, index }) => {
    const isPressed = pressedPads.has(padName);
    const velocity = velocities.get(padName) || 0;
    const isLoaded = hasPadSample(padName);
    const volume = padVolumes.get(padName) || 80;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();

      // Calculate velocity based on click position and pressure
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Distance from center affects velocity (closer = harder hit)
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const velocityFactor = Math.max(0.4, 1 - (distanceFromCenter / maxDistance) * 0.6);
      const calculatedVelocity = Math.round(127 * velocityFactor);

      handlePadTrigger(padName, calculatedVelocity);
    }, [padName]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const velocityFactor = Math.max(0.4, 1 - (distanceFromCenter / maxDistance) * 0.6);
        const calculatedVelocity = Math.round(127 * velocityFactor);

        handlePadTrigger(padName, calculatedVelocity);
      }
    }, [padName]);

    // Color coding by pad type with clear empty/loaded distinction
    const getPadColor = (): string => {
      if (!isLoaded) {
        return 'bg-gray-800 border-2 border-dashed border-gray-500';
      }

      const baseClass = isPressed ? '' : 'border-2 border-solid';

      if (padName.includes('KICK')) return `bg-red-900 border-red-700 ${baseClass} ${isPressed ? 'bg-red-500' : ''}`;
      if (padName.includes('SNARE')) return `bg-orange-900 border-orange-700 ${baseClass} ${isPressed ? 'bg-orange-500' : ''}`;
      if (padName.includes('HIHAT')) return `bg-yellow-900 border-yellow-700 ${baseClass} ${isPressed ? 'bg-yellow-500' : ''}`;
      if (padName.includes('CLAP')) return `bg-purple-900 border-purple-700 ${baseClass} ${isPressed ? 'bg-purple-500' : ''}`;
      if (padName.includes('CRASH') || padName.includes('RIDE')) return `bg-blue-900 border-blue-700 ${baseClass} ${isPressed ? 'bg-blue-500' : ''}`;
      if (padName.includes('TOM')) return `bg-green-900 border-green-700 ${baseClass} ${isPressed ? 'bg-green-500' : ''}`;
      if (padName.includes('PERC')) return `bg-pink-900 border-pink-700 ${baseClass} ${isPressed ? 'bg-pink-500' : ''}`;

      return `bg-gray-700 border-gray-600 ${baseClass} ${isPressed ? 'bg-gray-500' : ''}`;
    };

    const formatPadName = (name: string): string => {
      return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    };

    return (
      <button
        className={`
          aspect-square rounded-lg flex flex-col items-center justify-center
          text-gray-300 font-medium transition-all duration-100
          select-none touch-manipulation relative overflow-hidden
          ${getPadColor()}
          ${isLoaded ? 'hover:brightness-125 active:scale-95 cursor-pointer' : 'hover:border-gray-400 cursor-pointer'}
          ${isPressed ? 'scale-95 shadow-inner' : 'shadow-lg'}
          min-h-[80px] md:min-h-[100px]
        `}
        onMouseDown={isLoaded ? handleMouseDown : undefined}
        onTouchStart={isLoaded ? handleTouchStart : undefined}
        onContextMenu={(e) => handlePadRightClick(e, padName)}
        onClick={!isLoaded ? (e) => handlePadRightClick(e, padName) : undefined}
        disabled={isLoading}
        aria-label={`Drum pad ${index + 1}: ${isLoaded ? formatPadName(padName) : 'Empty - click to assign'} (Key: ${keyBinding})`}
      >
        {/* Velocity glow effect */}
        {isPressed && velocity > 0 && (
          <div
            className="absolute inset-0 bg-white opacity-20 animate-pulse"
            style={{ opacity: (velocity / 127) * 0.3 }}
          />
        )}

        {/* Key binding */}
        <div className="absolute top-1 left-1 text-xs font-bold bg-black bg-opacity-50 px-1 rounded">
          {keyBinding}
        </div>

        {/* Empty pad indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-gray-500 font-light">+</div>
          </div>
        )}

        {/* Pad Name */}
        <span className={`text-xs font-bold mb-1 z-10 ${isPressed ? 'text-white' : isLoaded ? 'text-gray-300' : 'text-gray-500'}`}>
          {isLoaded ? formatPadName(padName) : 'EMPTY'}
        </span>

        {/* Pad Number */}
        <span className={`text-xs opacity-70 z-10 ${isPressed ? 'text-white' : isLoaded ? 'text-gray-400' : 'text-gray-500'}`}>
          PAD {index + 1}
        </span>

        {/* Velocity indicator */}
        {velocity > 0 && (
          <div className="absolute bottom-1 right-1 text-xs font-mono bg-black bg-opacity-70 px-1 rounded">
            {velocity}
          </div>
        )}

        {/* Status indicator - only show for loaded pads */}
        {isLoaded && !showVolumeControls && (
          <div className="mt-1 z-10">
            <div className={`w-2 h-2 rounded-full ${
              isPressed ? 'bg-white' : 'bg-green-500'
            }`}></div>
          </div>
        )}

        {/* Volume Control Overlay */}
        {isLoaded && showVolumeControls && (
          <div
            className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-white mb-2">VOL</div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handlePadVolumeChange(padName, parseInt(e.target.value))}
              className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #4b5563 ${volume}%, #4b5563 100%)`
              }}
            />
            <div className="text-xs text-white mt-1">{volume}%</div>
          </div>
        )}
      </button>
    );
  };

  // Handle AI-generated beats
  const handleAIGenerate = useCallback((type: 'beat' | 'melody', result: any) => {
    if (type === 'beat') {
      console.log('AI-generated beat:', result);
      // TODO: Convert AI output to project format and update current track
      // This would involve converting the DrumPatternOutput to the project's track format
      // and updating the current drum track in the project
    }
  }, []);

  // Handle pad right-click for sound assignment
  const handlePadRightClick = useCallback((e: React.MouseEvent, padName: PadName) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPadForAssignment(padName);
    setAssignmentModalOpen(true);
  }, []);

  // Handle sound assignment change
  const handleAssignmentChange = useCallback((padName: PadName, sampleUrl: string) => {
    console.log(`Assigned ${sampleUrl} to ${padName}`);
    // The assignment is handled in the PadAssignment component
    // We could add additional logic here if needed
  }, []);

  // Close assignment modal
  const closeAssignmentModal = useCallback(() => {
    setAssignmentModalOpen(false);
    setSelectedPadForAssignment(null);
  }, []);

  return (
    <div className="p-6 space-y-6" ref={containerRef}>
      {/* CSS for custom slider styling */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drum Pads</h2>
          <p className="text-gray-400 text-sm">Click loaded pads or use keyboard • Click empty pads to assign sounds • Right-click for sound browser • Hold Shift for high velocity</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="text-gray-400">Current Kit:</span>
            <span className="text-vibe-blue ml-2 font-medium">
              {currentKit || 'None loaded'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Active Voices:</span>
            <span className="text-vibe-purple ml-2 font-medium">{activeVoices.size}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Keyboard:</span>
              <button
                onClick={() => setKeyboardEnabled(!keyboardEnabled)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  keyboardEnabled
                    ? 'bg-vibe-blue text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {keyboardEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Volume:</span>
              <button
                onClick={() => setShowVolumeControls(!showVolumeControls)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  showVolumeControls
                    ? 'bg-vibe-purple text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {showVolumeControls ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kit Selector */}
        <div className="lg:col-span-1">
          <KitSelector
            selectedKit={currentKit}
            onKitChange={setKit}
            isLoading={isLoading}
          />
        </div>

        {/* Enhanced Pad Grid */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">4x4 Pad Grid</h3>
              <div className="text-sm text-gray-400">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  audioState.isRunning ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                Audio: {audioState.isRunning ? 'Ready' : 'Initializing'}
              </div>
            </div>

            {/* Keyboard Shortcuts Legend */}
            <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="text-gray-300"><kbd className="bg-gray-600 px-1 rounded">Q W E R</kbd></div>
                <div className="text-gray-300"><kbd className="bg-gray-600 px-1 rounded">A S D F</kbd></div>
                <div className="text-gray-300"><kbd className="bg-gray-600 px-1 rounded">Z X C V</kbd></div>
                <div className="text-gray-300"><kbd className="bg-gray-600 px-1 rounded">1 2 3 4</kbd></div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Velocity: <kbd className="bg-gray-600 px-1 rounded">Shift</kbd> = High •
                <kbd className="bg-gray-600 px-1 rounded">Ctrl</kbd> = Medium •
                <kbd className="bg-gray-600 px-1 rounded">Alt</kbd> = Low
              </p>
            </div>

            {/* 4x4 Drum Pad Grid */}
            <div className="relative">
              <div className="grid grid-cols-4 gap-3">
                {padLayout.map((pad, index) => (
                  <EnhancedPad
                    key={pad.padName}
                    padName={pad.padName}
                    keyBinding={pad.key}
                    index={index}
                  />
                ))}
              </div>

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue mx-auto mb-2"></div>
                    <div className="text-sm text-gray-300">Loading kit...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Transport and Playback Info */}
            {isPlaying && (
              <div className="mt-4 p-3 bg-gray-700 rounded">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-400">Playing:</span>
                    <span className="text-vibe-blue ml-2 font-mono">
                      {Math.floor(currentPosition.bar)}.{Math.floor(currentPosition.beat)}.{Math.floor(currentPosition.step)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Step:</span>
                    <span className="text-vibe-purple ml-2 font-mono">{currentPosition.step}/16</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Sequencer */}
      <div className="mt-6">
        <StepSequencer
          steps={[]}
          currentStep={0}
          onStepToggle={(step, pad) => console.log('Step toggle:', step, pad)}
        />
      </div>

      {/* Swing & Quantize Controls */}
      <div className="mt-6">
        <SwingQuantizeControls
          swing={0}
          quantize={100}
          onSwingChange={(value) => console.log('Swing change:', value)}
          onQuantizeChange={(value) => console.log('Quantize change:', value)}
        />
      </div>

      {/* AI Beat Generation */}
      <div className="mt-6">
        <AIControls
          view="pads"
          onGenerate={handleAIGenerate}
          // userId={currentUser?.id} // TODO: Get from auth context
        />
      </div>

      {/* Pad Assignment Modal */}
      {selectedPadForAssignment && (
        <PadAssignment
          padName={selectedPadForAssignment}
          currentKit={currentKit}
          isOpen={assignmentModalOpen}
          onClose={closeAssignmentModal}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  );
};
