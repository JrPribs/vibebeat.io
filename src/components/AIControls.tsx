/**
 * AI Generation Controls
 * UI component for AI-powered beat and melody generation
 */

import { useState, useEffect } from 'react';
import { aiService } from '../core/ai/AIService';
import type {
  DrumPatternInput,
  MelodyInput,
  AIProvider
} from '../core/ai/types';

interface AIControlsProps {
  view: 'pads' | 'keys';
  onGenerate: (type: 'beat' | 'melody', result: any) => void;
  userId?: string;
  disabled?: boolean;
}

export const AIControls: React.FC<AIControlsProps> = ({
  view,
  onGenerate,
  userId,
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [quota, setQuota] = useState(0);
  const [rateLimitStatus, setRateLimitStatus] = useState({ remaining: 0, resetTime: 0, isBlocked: false });
  const [error, setError] = useState<string | null>(null);

  // Drum pattern form state
  const [drumConfig, setDrumConfig] = useState<DrumPatternInput>({
    tempo: 120,
    style: 'electronic',
    bars: 4,
    grid: 16,
    kitMap: {
      'kick': 'Kick',
      'snare': 'Snare',
      'hihat': 'Hi-hat',
      'openhat': 'Open Hat'
    },
    density: 'medium',
    swing: 0,
    humanize: true
  });

  // Melody form state
  const [melodyConfig, setMelodyConfig] = useState<MelodyInput>({
    tempo: 120,
    style: 'melodic',
    bars: 4,
    key: 'C',
    scale: 'major',
    contour: 'wave',
    density: 'medium',
    complexity: 'medium',
    octaveRange: [3, 5]
  });

  // Check availability and quota on mount
  useEffect(() => {
    const checkStatus = async () => {
      const available = await aiService.isAvailable();
      const remainingQuota = await aiService.getRemainingQuota();
      const rateLimits = aiService.getRateLimitStatus();
      
      setIsAvailable(available);
      setQuota(remainingQuota);
      setRateLimitStatus(rateLimits);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleGenerateBeat = async () => {
    if (!userId && !isAvailable) {
      // Allow AI generation without login for demo purposes, but show a note
      console.log('AI generation running in demo mode - enhanced mock patterns');
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await aiService.generateDrumPattern(drumConfig, userId);
      
      // Transform the result to match the expected format for the audio engine
      const transformedResult = {
        type: 'beat',
        pattern: result.pattern,
        metadata: result.metadata,
        message: result.metadata ? `Generated ${result.metadata.style} beat at ${result.metadata.tempo} BPM` : 'Beat generated successfully'
      };
      
      onGenerate('beat', transformedResult);
      
      // Update quota after successful generation
      const newQuota = await aiService.getRemainingQuota();
      const newRateLimit = aiService.getRateLimitStatus();
      setQuota(newQuota);
      setRateLimitStatus(newRateLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate beat');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMelody = async () => {
    if (!userId && !isAvailable) {
      // Allow AI generation without login for demo purposes, but show a note
      console.log('AI generation running in demo mode - enhanced mock patterns');
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await aiService.generateMelody(melodyConfig, userId);
      
      // Transform the result to match the expected format for the audio engine
      const transformedResult = {
        type: 'melody',
        notes: result.notes,
        metadata: result.metadata,
        message: result.metadata ? `Generated melody in ${result.metadata.key} ${result.metadata.scale}` : 'Melody generated successfully'
      };
      
      onGenerate('melody', transformedResult);
      
      // Update quota after successful generation
      const newQuota = await aiService.getRemainingQuota();
      const newRateLimit = aiService.getRateLimitStatus();
      setQuota(newQuota);
      setRateLimitStatus(newRateLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate melody');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || isGenerating; // Remove the login requirement for now

  const drumStyles = ['hip-hop', 'electronic', 'house', 'trap', 'rock', 'techno', 'ambient'];
  const melodyContours = ['rising', 'falling', 'wave', 'random'];
  const musicalKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const scales = ['major', 'minor', 'dorian', 'pentatonic'];
  const densityOptions = ['sparse', 'medium', 'dense'] as const;
  const complexityOptions = ['simple', 'medium', 'complex'] as const;

  if (view === 'pads') {
    return (
      <div className="ai-controls">
        <div className="ai-header">
          <h3>🤖 AI Beat Generator</h3>
          <div className="ai-status">
            <span className={`status-indicator ${isAvailable ? 'online' : 'offline'}`}>
              {isAvailable ? 'Online' : 'Offline'}
            </span>
            <span className="quota">Quota: {quota}</span>
            {rateLimitStatus.isBlocked && (
              <span className="rate-limit">Rate limited until {new Date(rateLimitStatus.resetTime).toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="ai-error">
            {error}
          </div>
        )}

        <div className="ai-form">
          <div className="form-row">
            <label>
              Style:
              <select 
                value={drumConfig.style} 
                onChange={(e) => setDrumConfig(prev => ({ ...prev, style: e.target.value }))}
                disabled={isDisabled}
              >
                {drumStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </label>
            
            <label>
              Tempo:
              <input 
                type="number" 
                min="60" 
                max="200" 
                value={drumConfig.tempo}
                onChange={(e) => setDrumConfig(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
                disabled={isDisabled}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Bars:
              <input 
                type="number" 
                min="1" 
                max="32" 
                value={drumConfig.bars}
                onChange={(e) => setDrumConfig(prev => ({ ...prev, bars: parseInt(e.target.value) }))}
                disabled={isDisabled}
              />
            </label>

            <label>
              Density:
              <select 
                value={drumConfig.density}
                onChange={(e) => setDrumConfig(prev => ({ ...prev, density: e.target.value as 'sparse' | 'medium' | 'dense' }))}
                disabled={isDisabled}
              >
                {densityOptions.map(density => (
                  <option key={density} value={density}>{density}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Swing:
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={drumConfig.swing}
                onChange={(e) => setDrumConfig(prev => ({ ...prev, swing: parseInt(e.target.value) }))}
                disabled={isDisabled}
              />
              <span className="range-value">{drumConfig.swing}%</span>
            </label>

            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={drumConfig.humanize}
                onChange={(e) => setDrumConfig(prev => ({ ...prev, humanize: e.target.checked }))}
                disabled={isDisabled}
              />
              Humanize
            </label>
          </div>

          <button 
            className="ai-generate-btn"
            onClick={handleGenerateBeat}
            disabled={isDisabled}
          >
            {isGenerating ? (
              <span className="generating">🔄 Generating...</span>
            ) : (
              <span>🎵 Generate Beat</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Keys view (melody generation)
  return (
    <div className="ai-controls">
      <div className="ai-header">
        <h3>🎹 AI Melody Generator</h3>
        <div className="ai-status">
          <span className={`status-indicator ${isAvailable ? 'online' : 'offline'}`}>
            {isAvailable ? 'Online' : 'Offline'}
          </span>
          <span className="quota">Quota: {quota}</span>
          {rateLimitStatus.isBlocked && (
            <span className="rate-limit">Rate limited until {new Date(rateLimitStatus.resetTime).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}

      <div className="ai-form">
        <div className="form-row">
          <label>
            Key:
            <select 
              value={melodyConfig.key} 
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, key: e.target.value }))}
              disabled={isDisabled}
            >
              {musicalKeys.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </label>
          
          <label>
            Scale:
            <select 
              value={melodyConfig.scale} 
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, scale: e.target.value }))}
              disabled={isDisabled}
            >
              {scales.map(scale => (
                <option key={scale} value={scale}>{scale}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Tempo:
            <input 
              type="number" 
              min="60" 
              max="200" 
              value={melodyConfig.tempo}
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
              disabled={isDisabled}
            />
          </label>

          <label>
            Bars:
            <input 
              type="number" 
              min="1" 
              max="32" 
              value={melodyConfig.bars}
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, bars: parseInt(e.target.value) }))}
              disabled={isDisabled}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Contour:
            <select 
              value={melodyConfig.contour} 
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, contour: e.target.value as 'rising' | 'falling' | 'wave' | 'random' }))}
              disabled={isDisabled}
            >
              {melodyContours.map(contour => (
                <option key={contour} value={contour}>{contour}</option>
              ))}
            </select>
          </label>

          <label>
            Density:
            <select 
              value={melodyConfig.density}
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, density: e.target.value as 'sparse' | 'medium' | 'dense' }))}
              disabled={isDisabled}
            >
              {densityOptions.map(density => (
                <option key={density} value={density}>{density}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Complexity:
            <select 
              value={melodyConfig.complexity}
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, complexity: e.target.value as 'simple' | 'medium' | 'complex' }))}
              disabled={isDisabled}
            >
              {complexityOptions.map(complexity => (
                <option key={complexity} value={complexity}>{complexity}</option>
              ))}
            </select>
          </label>

          <label>
            Octave Range:
            <div className="octave-range">
              <input 
                type="number" 
                min="2" 
                max="6" 
                value={melodyConfig.octaveRange[0]}
                onChange={(e) => setMelodyConfig(prev => ({
                  ...prev,
                  octaveRange: [parseInt(e.target.value), prev.octaveRange[1]]
                }))}
                disabled={isDisabled}
              />
              <span>to</span>
              <input 
                type="number" 
                min="2" 
                max="6" 
                value={melodyConfig.octaveRange[1]}
                onChange={(e) => setMelodyConfig(prev => ({
                  ...prev,
                  octaveRange: [prev.octaveRange[0], parseInt(e.target.value)]
                }))}
                disabled={isDisabled}
              />
            </div>
          </label>
        </div>

        <div className="form-row">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={melodyConfig.humanize}
              onChange={(e) => setMelodyConfig(prev => ({ ...prev, humanize: e.target.checked }))}
              disabled={isDisabled}
            />
            Humanize
          </label>
        </div>

        <button 
          className="ai-generate-btn"
          onClick={handleGenerateMelody}
          disabled={isDisabled}
        >
          {isGenerating ? (
            <span className="generating">🔄 Generating...</span>
          ) : (
            <span>🎵 Generate Melody</span>
          )}
        </button>
      </div>
    </div>
  );
};