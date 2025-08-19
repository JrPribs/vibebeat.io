// Enhanced Keys Feature - Phase 3
// Piano keyboard interface with scale lock and recording capabilities

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore, useScheduler, useAudioService, tonePianoService } from '../../core/index.js';
import * as Tone from 'tone';
import { AIControls } from '../../components/AIControls';

interface Note {
  note: string;
  octave: number;
  midiNumber: number;
  isBlack: boolean;
}

interface RecordedNote {
  note: string;
  velocity: number;
  startTime: number;
  duration: number;
  midiNumber: number;
}

interface ScaleLockSettings {
  enabled: boolean;
  key: string;
  scale: string;
  highlightOnly: boolean; // true = highlight only, false = block out-of-scale
}

interface RecordingSettings {
  enabled: boolean;
  overdub: boolean;
  countIn: number; // bars
  loopLength: number; // bars
  metronomeSync: boolean;
}

const SCALES = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10]
};

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const KeysView: React.FC = () => {
  const { actions } = useStore();
  const { isPlaying, currentPosition } = useScheduler();
  const { audioState } = useAudioService();
  
  const [octaveRange, setOctaveRange] = useState({ start: 3, end: 5 }); // C3 to B5 (3 octaves)
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
  const [velocities, setVelocities] = useState<Map<number, number>>(new Map());
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  
  const [scaleLock, setScaleLock] = useState<ScaleLockSettings>({
    enabled: false,
    key: 'C',
    scale: 'Major',
    highlightOnly: true
  });
  
  const [recording, setRecording] = useState<RecordingSettings>({
    enabled: false,
    overdub: false,
    countIn: 1,
    loopLength: 4,
    metronomeSync: true
  });
  
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sustainPedalRef = useRef(false);
  
  // Generate notes for the current octave range
  const generateNotes = useCallback((): Note[] => {
    const notes: Note[] = [];
    
    for (let octave = octaveRange.start; octave <= octaveRange.end; octave++) {
      KEYS.forEach((key, index) => {
        const midiNumber = (octave + 1) * 12 + index;
        if (midiNumber >= 0 && midiNumber <= 127) {
          notes.push({
            note: `${key}${octave}`,
            octave,
            midiNumber,
            isBlack: key.includes('#')
          });
        }
      });
    }
    
    return notes;
  }, [octaveRange]);
  
  const notes = generateNotes();
  
  // Check if note is in scale
  const isNoteInScale = useCallback((midiNumber: number): boolean => {
    if (!scaleLock.enabled) return true;
    
    const keyIndex = KEYS.indexOf(scaleLock.key);
    const scaleIntervals = SCALES[scaleLock.scale as keyof typeof SCALES];
    
    // Calculate the note's position relative to the key
    const noteInOctave = (midiNumber % 12);
    const relativeNote = (noteInOctave - keyIndex + 12) % 12;
    
    return scaleIntervals.includes(relativeNote);
  }, [scaleLock]);
  
  // Handle note trigger
  const triggerNote = useCallback((midiNumber: number, velocity: number = 100) => {
    if (scaleLock.enabled && !scaleLock.highlightOnly && !isNoteInScale(midiNumber)) {
      return; // Block out-of-scale notes
    }
    
    setPressedKeys(prev => new Set([...prev, midiNumber]));
    setVelocities(prev => new Map([...prev, [midiNumber, velocity]]));
    
    // Record note if recording
    if (isRecording && recordingStartTime !== null) {
      const note = notes.find(n => n.midiNumber === midiNumber);
      if (note) {
        const recordedNote: RecordedNote = {
          note: note.note,
          velocity,
          startTime: Date.now() - recordingStartTime,
          duration: 0, // Will be set on note release
          midiNumber
        };
        
        setRecordedNotes(prev => [...prev, recordedNote]);
      }
    }
    
    // Play the note with Tone.js piano synthesis
    const note = notes.find(n => n.midiNumber === midiNumber);
    if (note) {
      // note.note already contains the full note name like "C4"
      const noteName = note.note;
      
      // Start Tone.js if needed and trigger note
      const playNote = async () => {
        try {
          if (Tone.context.state !== 'running') {
            await Tone.start();
          }
          await tonePianoService.triggerNote(noteName, velocity);
          console.log(`Playing note: ${noteName} (${midiNumber}) velocity: ${velocity}`);
        } catch (error) {
          console.error('Failed to play note:', error);
        }
      };
      
      playNote();
    }
  }, [scaleLock, isNoteInScale, notes, isRecording, recordingStartTime]);
  
  // Handle note release
  const releaseNote = useCallback((midiNumber: number) => {
    if (!sustainPedalRef.current) {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(midiNumber);
        return newSet;
      });
      
      setTimeout(() => {
        setVelocities(prev => {
          const newMap = new Map(prev);
          newMap.delete(midiNumber);
          return newMap;
        });
      }, 100);
    }
    
    // Update recorded note duration
    if (isRecording && recordingStartTime !== null) {
      setRecordedNotes(prev => {
        const newNotes = [...prev];
        // Find the last note with the same MIDI number and zero duration (for note-off)
    let lastNoteIndex = -1;
    for (let i = newNotes.length - 1; i >= 0; i--) {
      if (newNotes[i].midiNumber === midiNumber && newNotes[i].duration === 0) {
        lastNoteIndex = i;
        break;
      }
    }
        
        if (lastNoteIndex !== -1) {
          newNotes[lastNoteIndex].duration = Date.now() - recordingStartTime - newNotes[lastNoteIndex].startTime;
        }
        
        return newNotes;
      });
    }
    
    // Release the note with Tone.js piano synthesis
    const note = notes.find(n => n.midiNumber === midiNumber);
    if (note) {
      // note.note already contains the full note name like "C4"
      const noteName = note.note;
      try {
        tonePianoService.releaseNote(noteName);
        console.log(`Released note: ${noteName}`);
      } catch (error) {
        console.error('Failed to release note:', error);
      }
    }
  }, [notes, isRecording, recordingStartTime]);
  
  // Computer keyboard mappings
  const keyboardMappings: Record<string, number> = {
    // White keys: QWERTYU (C D E F G A B)
    'KeyQ': notes.find(n => n.note.startsWith('C') && !n.isBlack)?.midiNumber || 60,
    'KeyW': notes.find(n => n.note.startsWith('D') && !n.isBlack)?.midiNumber || 62,
    'KeyE': notes.find(n => n.note.startsWith('E') && !n.isBlack)?.midiNumber || 64,
    'KeyR': notes.find(n => n.note.startsWith('F') && !n.isBlack)?.midiNumber || 65,
    'KeyT': notes.find(n => n.note.startsWith('G') && !n.isBlack)?.midiNumber || 67,
    'KeyY': notes.find(n => n.note.startsWith('A') && !n.isBlack)?.midiNumber || 69,
    'KeyU': notes.find(n => n.note.startsWith('B') && !n.isBlack)?.midiNumber || 71,
    
    // Black keys: 234567 (C# D# F# G# A#)
    'Digit2': notes.find(n => n.note.startsWith('C#'))?.midiNumber || 61,
    'Digit3': notes.find(n => n.note.startsWith('D#'))?.midiNumber || 63,
    'Digit5': notes.find(n => n.note.startsWith('F#'))?.midiNumber || 66,
    'Digit6': notes.find(n => n.note.startsWith('G#'))?.midiNumber || 68,
    'Digit7': notes.find(n => n.note.startsWith('A#'))?.midiNumber || 70,
  };
  
  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!keyboardEnabled) return;
    
    // Octave controls
    if (e.code === 'KeyZ' && !e.repeat) {
      setOctaveRange(prev => ({
        start: Math.max(0, prev.start - 1),
        end: Math.max(1, prev.end - 1)
      }));
      return;
    }
    
    if (e.code === 'KeyX' && !e.repeat) {
      setOctaveRange(prev => ({
        start: Math.min(7, prev.start + 1),
        end: Math.min(8, prev.end + 1)
      }));
      return;
    }
    
    // Sustain pedal
    if (e.code === 'Space') {
      e.preventDefault();
      sustainPedalRef.current = true;
      return;
    }
    
    // Note triggers
    const midiNumber = keyboardMappings[e.code];
    if (midiNumber && !pressedKeys.has(midiNumber) && !e.repeat) {
      e.preventDefault();
      const velocity = e.shiftKey ? 127 : e.ctrlKey ? 80 : 100;
      triggerNote(midiNumber, velocity);
    }
  }, [keyboardEnabled, keyboardMappings, pressedKeys, triggerNote]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!keyboardEnabled) return;
    
    // Sustain pedal release
    if (e.code === 'Space') {
      sustainPedalRef.current = false;
      // Release all currently pressed keys
      pressedKeys.forEach(midiNumber => {
        releaseNote(midiNumber);
      });
      return;
    }
    
    // Note releases
    const midiNumber = keyboardMappings[e.code];
    if (midiNumber) {
      releaseNote(midiNumber);
    }
  }, [keyboardEnabled, keyboardMappings, pressedKeys, releaseNote]);
  
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
  
  // Recording controls
  const startRecording = useCallback(() => {
    if (!recording.enabled) return;
    
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setRecordedNotes([]);
    
    console.log(`Started recording: ${recording.loopLength} bars, count-in: ${recording.countIn}`);
  }, [recording]);
  
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingStartTime(null);
    
    console.log(`Stopped recording: ${recordedNotes.length} notes recorded`);
  }, [recordedNotes.length]);
  
  const clearRecording = useCallback(() => {
    setRecordedNotes([]);
    setIsRecording(false);
    setRecordingStartTime(null);
    
    console.log('Recording cleared');
  }, []);
  
  // Key component
  const PianoKey: React.FC<{
    note: Note;
    isPressed: boolean;
    velocity: number;
    inScale: boolean;
  }> = ({ note, isPressed, velocity, inScale }) => {
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      
      // Calculate velocity based on vertical position
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const relativeY = y / rect.height;
      const calculatedVelocity = Math.round(127 * (1 - relativeY * 0.5 + 0.3)); // 30% to 127 range
      
      triggerNote(note.midiNumber, calculatedVelocity);
    }, [note.midiNumber]);
    
    const handleMouseUp = useCallback(() => {
      releaseNote(note.midiNumber);
    }, [note.midiNumber]);
    
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const y = touch.clientY - rect.top;
        const relativeY = y / rect.height;
        const calculatedVelocity = Math.round(127 * (1 - relativeY * 0.5 + 0.3));
        
        triggerNote(note.midiNumber, calculatedVelocity);
      }
    }, [note.midiNumber]);
    
    const handleTouchEnd = useCallback(() => {
      releaseNote(note.midiNumber);
    }, [note.midiNumber]);
    
    const getKeyColor = (): string => {
      const baseClass = note.isBlack 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-300';
      
      const pressedClass = note.isBlack
        ? 'bg-gray-700'
        : 'bg-gray-200';
      
      const scaleClass = scaleLock.enabled
        ? inScale
          ? scaleLock.highlightOnly
            ? note.isBlack ? 'bg-vibe-blue bg-opacity-20' : 'bg-vibe-blue bg-opacity-10'
            : ''
          : scaleLock.highlightOnly
            ? ''
            : 'opacity-30 cursor-not-allowed'
        : '';
      
      if (isPressed) {
        return `${pressedClass} ${scaleClass} scale-95 shadow-inner`;
      }
      
      return `${baseClass} ${scaleClass} hover:brightness-95`;
    };
    
    const keyHeight = note.isBlack ? 'h-24' : 'h-40';
    const keyWidth = note.isBlack ? 'w-6' : 'w-8';
    const keyPosition = note.isBlack ? 'absolute z-20' : 'relative z-0';
    
    return (
      <button
        className={`
          ${keyHeight} ${keyWidth} ${keyPosition}
          border-2 transition-all duration-75 text-xs font-mono
          select-none touch-manipulation flex flex-col justify-end items-center pb-2
          ${getKeyColor()}
          ${note.isBlack ? 'text-white cursor-pointer' : 'text-gray-800'}
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={note.isBlack ? {
          left: note.note.includes('C#') ? '20px' :
                note.note.includes('D#') ? '44px' :
                note.note.includes('F#') ? '92px' :
                note.note.includes('G#') ? '116px' :
                note.note.includes('A#') ? '140px' : '0px',
          pointerEvents: 'auto'
        } : {}}
        disabled={scaleLock.enabled && !scaleLock.highlightOnly && !inScale}
        aria-label={`${note.note} (MIDI ${note.midiNumber})`}
      >
        {velocity > 0 && (
          <div className="text-xs opacity-70 mb-1">{velocity}</div>
        )}
        <span className="opacity-80">{note.note}</span>
      </button>
    );
  };

  // Handle AI-generated melodies
  const handleAIGenerate = useCallback((type: 'beat' | 'melody', result: any) => {
    if (type === 'melody') {
      console.log('AI-generated melody:', result);
      // TODO: Convert AI output to project format and update current track
      // This would involve converting the MelodyOutput to recorded notes
      // and updating the current keys track in the project
    }
  }, []);
  
  return (
    <div className="p-6 space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Piano Keys</h2>
          <p className="text-gray-400 text-sm">
            Play with mouse/touch or keyboard • Z/X for octave • Space for sustain
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div>
            <span className="text-gray-400">Range:</span>
            <span className="text-vibe-blue ml-2 font-mono">
              {notes[0]?.note} - {notes[notes.length - 1]?.note}
            </span>
          </div>
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
        </div>
      </div>
      
      {/* Piano Keyboard */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Piano Keyboard</h3>
          <div className="text-sm text-gray-400">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              audioState.isInitialized ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            Audio: {audioState.isInitialized ? 'Ready' : 'Initializing'}
          </div>
        </div>
        
        {/* Keyboard Layout */}
        <div className="bg-gray-100 p-4 rounded-lg relative overflow-x-auto">
          <div className="flex relative min-w-max">
            {/* White keys */}
            <div className="flex relative z-0">
              {notes.filter(note => !note.isBlack).map((note) => (
                <PianoKey
                  key={note.midiNumber}
                  note={note}
                  isPressed={pressedKeys.has(note.midiNumber)}
                  velocity={velocities.get(note.midiNumber) || 0}
                  inScale={isNoteInScale(note.midiNumber)}
                />
              ))}
            </div>
            
            {/* Black keys overlay */}
            <div className="absolute top-0 left-4 z-10">
              {notes.filter(note => note.isBlack).map((note) => (
                <PianoKey
                  key={note.midiNumber}
                  note={note}
                  isPressed={pressedKeys.has(note.midiNumber)}
                  velocity={velocities.get(note.midiNumber) || 0}
                  inScale={isNoteInScale(note.midiNumber)}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Octave Controls */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <button
            onClick={() => setOctaveRange(prev => ({
              start: Math.max(0, prev.start - 1),
              end: Math.max(1, prev.end - 1)
            }))}
            disabled={octaveRange.start <= 0}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Lower Octave (Z)
          </button>
          
          <div className="text-sm text-gray-400">
            Octaves: {octaveRange.start} - {octaveRange.end}
          </div>
          
          <button
            onClick={() => setOctaveRange(prev => ({
              start: Math.min(7, prev.start + 1),
              end: Math.min(8, prev.end + 1)
            }))}
            disabled={octaveRange.end >= 8}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Higher Octave (X) →
          </button>
        </div>
      </div>
      
      {/* Scale Lock System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Scale Lock</h3>
            <button
              onClick={() => setScaleLock(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                scaleLock.enabled 
                  ? 'bg-vibe-blue text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {scaleLock.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Key Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Key</label>
              <div className="grid grid-cols-6 gap-2">
                {KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setScaleLock(prev => ({ ...prev, key }))}
                    disabled={!scaleLock.enabled}
                    className={`px-2 py-1 rounded text-sm transition-colors ${
                      scaleLock.key === key && scaleLock.enabled
                        ? 'bg-vibe-blue text-white'
                        : scaleLock.enabled
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Scale Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Scale</label>
              <select
                value={scaleLock.scale}
                onChange={(e) => setScaleLock(prev => ({ ...prev, scale: e.target.value }))}
                disabled={!scaleLock.enabled}
                className={`w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 ${
                  scaleLock.enabled ? '' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {Object.keys(SCALES).map((scale) => (
                  <option key={scale} value={scale}>{scale}</option>
                ))}
              </select>
            </div>
            
            {/* Scale Mode */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Mode</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={scaleLock.highlightOnly}
                    onChange={() => setScaleLock(prev => ({ ...prev, highlightOnly: true }))}
                    disabled={!scaleLock.enabled}
                    className="mr-2"
                  />
                  <span className={scaleLock.enabled ? 'text-white' : 'text-gray-500'}>
                    Highlight scale notes
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!scaleLock.highlightOnly}
                    onChange={() => setScaleLock(prev => ({ ...prev, highlightOnly: false }))}
                    disabled={!scaleLock.enabled}
                    className="mr-2"
                  />
                  <span className={scaleLock.enabled ? 'text-white' : 'text-gray-500'}>
                    Block out-of-scale notes
                  </span>
                </label>
              </div>
            </div>
            
            {/* Scale Info */}
            {scaleLock.enabled && (
              <div className="p-3 bg-gray-700 rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Current Scale:</span>
                  <span className="text-white font-medium">
                    {scaleLock.key} {scaleLock.scale}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Notes: {SCALES[scaleLock.scale as keyof typeof SCALES].map(interval => {
                    const noteIndex = (KEYS.indexOf(scaleLock.key) + interval) % 12;
                    return KEYS[noteIndex];
                  }).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recording Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recording</h3>
            <div className="flex items-center space-x-2">
              {isRecording && (
                <div className="flex items-center space-x-2 text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">REC</span>
                </div>
              )}
              <button
                onClick={() => setRecording(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  recording.enabled 
                    ? 'bg-vibe-blue text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {recording.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Recording Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Count-in</label>
                <select
                  value={recording.countIn}
                  onChange={(e) => setRecording(prev => ({ ...prev, countIn: Number(e.target.value) }))}
                  disabled={!recording.enabled}
                  className={`w-full bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 ${
                    recording.enabled ? '' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <option value={0}>None</option>
                  <option value={1}>1 bar</option>
                  <option value={2}>2 bars</option>
                  <option value={4}>4 bars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Loop Length</label>
                <select
                  value={recording.loopLength}
                  onChange={(e) => setRecording(prev => ({ ...prev, loopLength: Number(e.target.value) }))}
                  disabled={!recording.enabled}
                  className={`w-full bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 ${
                    recording.enabled ? '' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <option value={1}>1 bar</option>
                  <option value={2}>2 bars</option>
                  <option value={4}>4 bars</option>
                  <option value={8}>8 bars</option>
                </select>
              </div>
            </div>
            
            {/* Recording Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={recording.overdub}
                  onChange={(e) => setRecording(prev => ({ ...prev, overdub: e.target.checked }))}
                  disabled={!recording.enabled}
                  className="mr-2"
                />
                <span className={recording.enabled ? 'text-white' : 'text-gray-500'}>
                  Overdub mode
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={recording.metronomeSync}
                  onChange={(e) => setRecording(prev => ({ ...prev, metronomeSync: e.target.checked }))}
                  disabled={!recording.enabled}
                  className="mr-2"
                />
                <span className={recording.enabled ? 'text-white' : 'text-gray-500'}>
                  Metronome sync
                </span>
              </label>
            </div>
            
            {/* Recording Controls */}
            <div className="flex space-x-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!recording.enabled}
                  className={`flex-1 py-2 rounded font-medium transition-colors ${
                    recording.enabled
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ● Record
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 py-2 bg-red-700 text-white rounded font-medium hover:bg-red-800"
                >
                  ■ Stop
                </button>
              )}
              
              <button
                onClick={clearRecording}
                disabled={!recording.enabled || recordedNotes.length === 0}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  recording.enabled && recordedNotes.length > 0
                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Clear
              </button>
            </div>
            
            {/* Recording Status */}
            {recording.enabled && (
              <div className="p-3 bg-gray-700 rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Recorded Notes:</span>
                  <span className="text-white font-mono">{recordedNotes.length}</span>
                </div>
                {isPlaying && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-vibe-purple font-mono">
                      {Math.floor(currentPosition.bar)}.{Math.floor(currentPosition.beat)}.{Math.floor(currentPosition.step)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Melody Generation */}
      <div className="mt-6">
        <AIControls 
          view="keys"
          onGenerate={handleAIGenerate}
          // userId={currentUser?.id} // TODO: Get from auth context
        />
      </div>
      
      {/* Instructions */}
      <div className="p-3 bg-gray-700 rounded text-sm text-gray-400">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="mb-1"><strong>Keyboard Shortcuts:</strong></p>
            <ul className="text-xs space-y-1">
              <li>• <kbd className="bg-gray-600 px-1 rounded">Q W E R T Y U</kbd> - White keys</li>
              <li>• <kbd className="bg-gray-600 px-1 rounded">2 3 5 6 7</kbd> - Black keys</li>
              <li>• <kbd className="bg-gray-600 px-1 rounded">Z / X</kbd> - Octave down/up</li>
              <li>• <kbd className="bg-gray-600 px-1 rounded">Space</kbd> - Sustain pedal</li>
            </ul>
          </div>
          <div>
            <p className="mb-1"><strong>Features:</strong></p>
            <ul className="text-xs space-y-1">
              <li>• Scale lock highlights or blocks out-of-scale notes</li>
              <li>• Recording captures note timing and velocity</li>
              <li>• Velocity based on vertical click/touch position</li>
              <li>• Multi-octave support with smooth scrolling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};