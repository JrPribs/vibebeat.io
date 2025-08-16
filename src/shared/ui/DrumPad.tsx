// Drum Pad Component
// Interactive drum pad with visual feedback and touch support

import React, { useCallback, useState } from 'react';
import type { PadName } from '../../shared/models/index';

interface DrumPadProps {
  padName: PadName;
  padNumber: number;
  isLoaded: boolean;
  onTrigger: (padName: PadName, velocity: number) => void;
  disabled?: boolean;
}

export const DrumPad: React.FC<DrumPadProps> = ({ 
  padName, 
  padNumber, 
  isLoaded, 
  onTrigger, 
  disabled = false 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [lastTriggerTime, setLastTriggerTime] = useState(0);

  const handleTrigger = useCallback((velocity: number = 100) => {
    if (disabled || !isLoaded) return;

    const now = Date.now();
    // Prevent rapid double-triggers
    if (now - lastTriggerTime < 50) return;
    
    setLastTriggerTime(now);
    setIsPressed(true);
    
    onTrigger(padName, velocity);
    
    // Reset visual state
    setTimeout(() => setIsPressed(false), 150);
  }, [padName, onTrigger, disabled, isLoaded, lastTriggerTime]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Calculate velocity based on click position (simple approximation)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Distance from center affects velocity
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const velocityFactor = 1 - (distanceFromCenter / maxDistance) * 0.3; // 30% velocity range
    const velocity = Math.round(127 * velocityFactor);
    
    handleTrigger(velocity);
  }, [handleTrigger]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      handleTrigger(100);
    }
  }, [handleTrigger]);

  // Touch support
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
      const velocityFactor = 1 - (distanceFromCenter / maxDistance) * 0.3;
      const velocity = Math.round(127 * velocityFactor);
      
      handleTrigger(velocity);
    }
  }, [handleTrigger]);

  const getPadColor = (): string => {
    if (disabled) return 'bg-gray-800 border-gray-700';
    if (!isLoaded) return 'bg-gray-700 border-gray-600';
    
    // Color coding by pad type
    if (padName.includes('KICK')) return 'bg-red-900 border-red-700';
    if (padName.includes('SNARE')) return 'bg-orange-900 border-orange-700';
    if (padName.includes('HIHAT')) return 'bg-yellow-900 border-yellow-700';
    if (padName.includes('CLAP')) return 'bg-purple-900 border-purple-700';
    if (padName.includes('CRASH') || padName.includes('RIDE')) return 'bg-blue-900 border-blue-700';
    if (padName.includes('TOM')) return 'bg-green-900 border-green-700';
    if (padName.includes('PERC')) return 'bg-pink-900 border-pink-700';
    
    return 'bg-gray-700 border-gray-600'; // Default for PAD_13-16
  };

  const getActiveColor = (): string => {
    if (disabled || !isLoaded) return '';
    
    if (padName.includes('KICK')) return 'bg-red-500 border-red-300';
    if (padName.includes('SNARE')) return 'bg-orange-500 border-orange-300';
    if (padName.includes('HIHAT')) return 'bg-yellow-500 border-yellow-300';
    if (padName.includes('CLAP')) return 'bg-purple-500 border-purple-300';
    if (padName.includes('CRASH') || padName.includes('RIDE')) return 'bg-blue-500 border-blue-300';
    if (padName.includes('TOM')) return 'bg-green-500 border-green-300';
    if (padName.includes('PERC')) return 'bg-pink-500 border-pink-300';
    
    return 'bg-gray-500 border-gray-300';
  };

  const formatPadName = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <button
      className={`
        aspect-square rounded-lg flex flex-col items-center justify-center
        text-gray-300 font-medium transition-all duration-150 border-2
        select-none touch-manipulation
        ${isPressed ? getActiveColor() : getPadColor()}
        ${!disabled && isLoaded ? 'hover:brightness-125 active:scale-95' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${isPressed ? 'scale-95 shadow-inner' : 'shadow-lg'}
      `}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      aria-label={`Drum pad ${padNumber}: ${formatPadName(padName)}`}
    >
      {/* Pad Name */}
      <span className={`text-xs font-bold mb-1 ${
        isPressed ? 'text-white' : 'text-gray-300'
      }`}>
        {formatPadName(padName)}
      </span>
      
      {/* Pad Number */}
      <span className={`text-xs opacity-70 ${
        isPressed ? 'text-white' : 'text-gray-400'
      }`}>
        PAD {padNumber}
      </span>
      
      {/* Status Indicator */}
      <div className="mt-1">
        {!isLoaded ? (
          <div className="w-2 h-2 rounded-full bg-red-500 opacity-60"></div>
        ) : (
          <div className={`w-2 h-2 rounded-full ${
            isPressed ? 'bg-white' : 'bg-green-500'
          }`}></div>
        )}
      </div>
    </button>
  );
};