// Enhanced Keys Feature - Phase 3
// Piano keyboard interface with scale lock and recording capabilities

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore, useScheduler, useAudioService } from '../../core/index.js';
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
    
    // Play the note (integrate with audio engine)
    console.log(`Playing note: ${notes.find(n => n.midiNumber === midiNumber)?.note} (${midiNumber}) velocity: ${velocity}`);
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
    
    console.log(`Released note: ${notes.find(n => n.midiNumber === midiNumber)?.note}`);
  }, [notes, isRecording, recordingStartTime]);
  
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
      
      {/* Piano Keyboard UI */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Piano Keyboard</h3>
          <div className="text-sm text-gray-400">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              audioState.isRunning ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            Audio: {audioState.isRunning ? 'Ready' : 'Initializing'}
          </div>
        </div>
        
        {/* Keyboard layout would be implemented here */}
        <div className="bg-gray-100 p-4 rounded-lg text-gray-800 text-center">
          Virtual Piano Keyboard Interface
          <br />
          <span className="text-sm">({notes.length} keys from {notes[0]?.note} to {notes[notes.length - 1]?.note})</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scale Lock */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Scale Lock</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scaleLock.enabled}
                onChange={(e) => setScaleLock(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span>Enable Scale Lock</span>
            </label>
            
            {scaleLock.enabled && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Key</label>
                  <select
                    value={scaleLock.key}
                    onChange={(e) => setScaleLock(prev => ({ ...prev, key: e.target.value }))}
                    className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
                  >
                    {KEYS.map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Scale</label>
                  <select
                    value={scaleLock.scale}
                    onChange={(e) => setScaleLock(prev => ({ ...prev, scale: e.target.value }))}
                    className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
                  >
                    {Object.keys(SCALES).map(scale => (
                      <option key={scale} value={scale}>{scale}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Recording */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Recording</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={recording.enabled}
                onChange={(e) => setRecording(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span>Enable Recording</span>
            </label>
            
            {recording.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Loop Length</label>
                  <select
                    value={recording.loopLength}
                    onChange={(e) => setRecording(prev => ({ ...prev, loopLength: Number(e.target.value) }))}
                    className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
                  >
                    <option value={1}>1 Bar</option>
                    <option value={2}>2 Bars</option>
                    <option value={4}>4 Bars</option>
                    <option value={8}>8 Bars</option>
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    if (isRecording) {
                      setIsRecording(false);
                      setRecordingStartTime(null);
                    } else {
                      setIsRecording(true);
                      setRecordingStartTime(Date.now());
                      setRecordedNotes([]);
                    }
                  }}
                  className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                
                {recordedNotes.length > 0 && (
                  <div className="text-xs text-gray-400">
                    {recordedNotes.length} notes recorded
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Controls */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">AI Assistant</h3>
        <AIControls />
      </div>
    </div>
  );
};

export default KeysView;