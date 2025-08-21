import React from 'react';
import { useUI, useStore } from '../core/store-context';
import { PadsView } from '../features/pads';
import { KeysView } from '../features/keys';
import { MixerView } from '../features/mixer';
import { SampleView } from '../features/sample';
import { RecordView } from '../features/record';
import { ArrangeView } from '../features/arrange';

export function MainContent(): JSX.Element {
  const { currentView } = useUI();
  const { state, actions } = useStore();

  const renderView = () => {
    switch (currentView) {
      case 'pads':
        return <PadsView />;
      
      case 'keys':
        return <KeysView />;
      
      case 'mixer':
        return (
          <MixerView 
            tracks={state.project.tracks} 
            onTrackUpdate={actions.updateTrack}
          />
        );
      
      case 'sample':
        return <SampleView />;
      
      case 'record':
        return <RecordView />;
      
      case 'arrange':
        return <ArrangeView />;
      
      default:
        return (
          <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-300 mb-2">
                Welcome to vibebeat.io
              </h2>
              <p className="text-gray-400 mb-6">
                Select a mode from the left navigation to start creating music
              </p>
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 rounded-lg">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 bg-white/20 rounded border-2 border-white/30 backdrop-blur-sm"
                    />
                  ))}
                </div>
                <div className="text-white text-sm font-medium">
                  🎵 Your beats start here
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-900">
      {renderView()}
    </div>
  );
}