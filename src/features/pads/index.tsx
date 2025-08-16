// Enhanced Pads Feature - Phase 3
// 4x4 drum pads with keyboard mappings, velocity control, and step sequencer

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useStore, usePadTrigger, useScheduler, useAudioService } from '../../core/index.js';
import { KitSelector } from '../../shared/ui/KitSelector.js';
import { StepSequencer } from '../../shared/ui/StepSequencer.js';
import { SwingQuantizeControls } from '../../shared/ui/SwingQuantizeControls.js';
import { AIControls } from '../../components/AIControls';
import type { PadName } from '../../shared/models/index.js';

export const PadsView: React.FC = () => {
  const { actions } = useStore();
  const { triggerPad, hasPadSample, activeVoices, currentKit } = usePadTrigger();
  const { isPlaying, currentPosition } = useScheduler();
  const { audioState } = useAudioService();
  
  const [pressedPads, setPressedPads] = useState<Set<PadName>>(new Set());
  const [velocities, setVelocities] = useState<Map<PadName, number>>(new Map());
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pad layout with keyboard mappings
  const padLayout: Array<{padName: PadName, key: string, keyCode: string}> = [
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
  ];

  // Trigger pad with velocity
  const handlePadPress = useCallback(async (padName: PadName, velocity: number = 0.8) => {
    if (!hasPadSample(padName)) return;
    
    try {
      await triggerPad(padName, velocity);
      setPressedPads(prev => new Set(prev).add(padName));
      setVelocities(prev => new Map(prev).set(padName, velocity));
      
      // Visual feedback timeout
      setTimeout(() => {
        setPressedPads(prev => {
          const next = new Set(prev);
          next.delete(padName);
          return next;
        });
      }, 150);
    } catch (error) {
      console.error('Pad trigger failed:', error);
    }
  }, [triggerPad, hasPadSample]);

  // Keyboard event handlers
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!keyboardEnabled || event.repeat) return;
    
    const padConfig = padLayout.find(p => p.keyCode === event.code);
    if (!padConfig) return;
    
    event.preventDefault();
    
    // Calculate velocity based on modifier keys
    let velocity = 0.8;
    if (event.shiftKey) velocity = 1.0; // Hard hit
    if (event.ctrlKey) velocity = 0.4;  // Soft hit
    
    handlePadPress(padConfig.padName, velocity);
  }, [handlePadPress, keyboardEnabled, padLayout]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!keyboardEnabled) return;
    
    const padConfig = padLayout.find(p => p.keyCode === event.code);
    if (!padConfig) return;
    
    event.preventDefault();
  }, [keyboardEnabled, padLayout]);

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Mouse/touch handlers for pads
  const handleMouseDown = (padName: PadName) => {
    handlePadPress(padName, 0.8);
  };

  // Focus management for accessibility
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="pads-view p-6 focus:outline-none"
      tabIndex={0}
      role="application"
      aria-label="Drum Pads Interface"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Pads</h2>
        <p className="text-gray-400 text-sm">
          Click pads or use keyboard shortcuts. Hold Shift for harder hits, Ctrl for softer hits.
        </p>
      </div>

      {/* Kit Selector */}
      <div className="mb-6">
        <KitSelector />
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Keyboard Toggle */}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={keyboardEnabled}
            onChange={(e) => setKeyboardEnabled(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Keyboard Control</span>
        </label>

        {/* AI Controls */}
        <AIControls />
      </div>

      {/* 4x4 Pad Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-4 max-w-2xl">
          {padLayout.map((pad) => {
            const isPressed = pressedPads.has(pad.padName);
            const hasVoices = activeVoices.get(pad.padName) || 0;
            const hasSample = hasPadSample(pad.padName);
            const velocity = velocities.get(pad.padName) || 0;
            
            return (
              <button
                key={pad.padName}
                className={`
                  relative aspect-square rounded-lg border-2 transition-all duration-150
                  flex flex-col items-center justify-center p-4
                  ${
                    hasSample
                      ? isPressed
                        ? 'bg-blue-600 border-blue-400 shadow-lg transform scale-95'
                        : hasVoices > 0
                        ? 'bg-blue-500/20 border-blue-400 shadow-md'
                        : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                      : 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed'
                  }
                `}
                onMouseDown={() => hasSample && handleMouseDown(pad.padName)}
                disabled={!hasSample}
                aria-label={`${pad.padName} drum pad, keyboard shortcut ${pad.key}`}
              >
                {/* Pad Name */}
                <div className="text-sm font-semibold text-center leading-tight">
                  {pad.padName.replace('_', ' ')}
                </div>
                
                {/* Keyboard Shortcut */}
                <div className="text-xs opacity-60 mt-1">
                  {pad.key}
                </div>
                
                {/* Sample Indicator */}
                {hasSample && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
                
                {/* Velocity Indicator */}
                {isPressed && velocity > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 h-1 bg-white rounded overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 transition-all duration-75"
                      style={{ width: `${velocity * 100}%` }}
                    />
                  </div>
                )}
                
                {/* Active Voices Indicator */}
                {hasVoices > 0 && (
                  <div className="absolute top-1 left-1 text-xs bg-blue-500 text-white px-1 rounded">
                    {hasVoices}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swing and Quantize Controls */}
      <div className="mb-8">
        <SwingQuantizeControls />
      </div>

      {/* Step Sequencer */}
      <div className="mb-8">
        <StepSequencer />
      </div>

      {/* Performance Stats */}
      {audioState.initialized && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Active Voices:</span>
              <span className="ml-2 font-mono">
                {Array.from(activeVoices.values()).reduce((a, b) => a + b, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Current Kit:</span>
              <span className="ml-2 font-mono">{currentKit || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-400">Position:</span>
              <span className="ml-2 font-mono">
                {currentPosition ? `${currentPosition.bar}.${currentPosition.beat}` : '0.0'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Playing:</span>
              <span className="ml-2 font-mono">{isPlaying ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-xs text-gray-500">
        <p>Keyboard shortcuts: Q, W, E, R (top row), A, S, D, F (middle row), Z, X, C, V (bottom row), 1-4 (numbers)</p>
        <p>Hold Shift for maximum velocity, Ctrl for minimum velocity</p>
      </div>
    </div>
  );
};

export default PadsView;
