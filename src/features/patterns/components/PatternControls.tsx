// Pattern Controls Component
// UI for A/B pattern switching and duplication - Phase 9

import React from 'react';
import { Copy, Play, Volume2 } from 'lucide-react';
import { useStore, useProject } from '../../../core/index.js';
import type { Project } from '../../../shared/models/index.js';

export interface PatternControlsProps {
  /** Additional CSS classes */
  className?: string;
  /** Compact layout for smaller spaces */
  compact?: boolean;
}

export const PatternControls: React.FC<PatternControlsProps> = ({
  className = '',
  compact = false
}) => {
  const { actions } = useStore();
  const project = useProject();
  
  const { arrangement } = project;
  const { currentPattern, patterns } = arrangement;

  const handlePatternSwitch = (pattern: 'A' | 'B') => {
    actions.switchPattern(pattern);
  };

  const handleDuplicatePattern = (from: 'A' | 'B', to: 'A' | 'B') => {
    if (from === to) return;
    actions.duplicatePattern(from, to);
  };

  const hasPatternData = (pattern: 'A' | 'B'): boolean => {
    return patterns[pattern].data && Object.keys(patterns[pattern].data).length > 0;
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Compact A/B Toggle */}
        <div className="flex bg-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => handlePatternSwitch('A')}
            className={`px-3 py-2 text-sm font-semibold transition-colors ${
              currentPattern === 'A'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            aria-label="Switch to Pattern A"
          >
            A
          </button>
          <button
            onClick={() => handlePatternSwitch('B')}
            className={`px-3 py-2 text-sm font-semibold transition-colors ${
              currentPattern === 'B'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            aria-label="Switch to Pattern B"
          >
            B
          </button>
        </div>
        
        {/* Quick Duplicate Button */}
        <button
          onClick={() => handleDuplicatePattern(
            currentPattern, 
            currentPattern === 'A' ? 'B' : 'A'
          )}
          className="btn-secondary text-xs px-2 py-1"
          title={`Copy Pattern ${currentPattern} to ${currentPattern === 'A' ? 'B' : 'A'}`}
          aria-label={`Duplicate current pattern to ${currentPattern === 'A' ? 'B' : 'A'}`}
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pattern Selection Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pattern A */}
        <div className={`relative p-4 rounded-lg transition-all duration-200 cursor-pointer ${
          currentPattern === 'A'
            ? 'bg-blue-600 shadow-lg transform scale-105'
            : 'bg-gray-700 hover:bg-gray-600 border-2 border-dashed border-gray-600'
        }`}
          onClick={() => handlePatternSwitch('A')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePatternSwitch('A');
            }
          }}
          aria-label="Switch to Pattern A"
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2 flex items-center justify-center">
              A
              {currentPattern === 'A' && (
                <Volume2 className="h-4 w-4 ml-2 text-blue-200" aria-hidden="true" />
              )}
            </div>
            <div className={`text-sm mb-3 ${
              currentPattern === 'A' ? 'text-blue-100' : 'text-gray-400'
            }`}>
              {patterns.A.name}
            </div>
            
            {/* Pattern Status */}
            <div className={`text-xs ${
              currentPattern === 'A' ? 'text-blue-200' : 'text-gray-500'
            }`}>
              {hasPatternData('A') ? 'Has Data' : 'Empty'}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-3 space-y-1">
              {currentPattern === 'A' ? (
                <div className={`text-xs font-medium ${
                  currentPattern === 'A' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  <Play className="h-3 w-3 inline mr-1" aria-hidden="true" />
                  Active
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePatternSwitch('A');
                  }}
                  className="btn-secondary w-full text-xs py-1"
                  aria-label="Activate Pattern A"
                >
                  <Play className="h-3 w-3 mr-1" aria-hidden="true" />
                  Activate
                </button>
              )}
            </div>
          </div>
          
          {/* Duplicate to B Button */}
          {hasPatternData('A') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicatePattern('A', 'B');
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white opacity-80 hover:opacity-100 transition-opacity"
              title="Copy Pattern A to Pattern B"
              aria-label="Copy Pattern A to Pattern B"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
        
        {/* Pattern B */}
        <div className={`relative p-4 rounded-lg transition-all duration-200 cursor-pointer ${
          currentPattern === 'B'
            ? 'bg-purple-600 shadow-lg transform scale-105'
            : 'bg-gray-700 hover:bg-gray-600 border-2 border-dashed border-gray-600'
        }`}
          onClick={() => handlePatternSwitch('B')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePatternSwitch('B');
            }
          }}
          aria-label="Switch to Pattern B"
        >
          <div className="text-center">
            <div className="text-2xl font-bold mb-2 flex items-center justify-center">
              B
              {currentPattern === 'B' && (
                <Volume2 className="h-4 w-4 ml-2 text-purple-200" aria-hidden="true" />
              )}
            </div>
            <div className={`text-sm mb-3 ${
              currentPattern === 'B' ? 'text-purple-100' : 'text-gray-400'
            }`}>
              {patterns.B.name}
            </div>
            
            {/* Pattern Status */}
            <div className={`text-xs ${
              currentPattern === 'B' ? 'text-purple-200' : 'text-gray-500'
            }`}>
              {hasPatternData('B') ? 'Has Data' : 'Empty'}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-3 space-y-1">
              {currentPattern === 'B' ? (
                <div className={`text-xs font-medium ${
                  currentPattern === 'B' ? 'text-purple-200' : 'text-gray-400'
                }`}>
                  <Play className="h-3 w-3 inline mr-1" aria-hidden="true" />
                  Active
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePatternSwitch('B');
                  }}
                  className="btn-secondary w-full text-xs py-1"
                  aria-label="Activate Pattern B"
                >
                  <Play className="h-3 w-3 mr-1" aria-hidden="true" />
                  Activate
                </button>
              )}
              
              {/* Copy from A Button - only show if A has data and B is empty */}
              {!hasPatternData('B') && hasPatternData('A') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicatePattern('A', 'B');
                  }}
                  className="btn-secondary w-full text-xs py-1"
                  aria-label="Copy Pattern A to Pattern B"
                >
                  <Copy className="h-3 w-3 mr-1" aria-hidden="true" />
                  Copy A
                </button>
              )}
            </div>
          </div>
          
          {/* Duplicate to A Button */}
          {hasPatternData('B') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicatePattern('B', 'A');
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white opacity-80 hover:opacity-100 transition-opacity"
              title="Copy Pattern B to Pattern A"
              aria-label="Copy Pattern B to Pattern A"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      
      {/* Current Pattern Indicator */}
      <div className="text-center text-sm text-gray-400">
        Currently editing: 
        <span className={`font-semibold ml-1 ${
          currentPattern === 'A' ? 'text-blue-400' : 'text-purple-400'
        }`}>
          Pattern {currentPattern}
        </span>
      </div>
    </div>
  );
};