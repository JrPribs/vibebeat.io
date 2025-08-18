import React from 'react';
import { 
  Grid3X3, 
  Piano, 
  Scissors, 
  Mic, 
  Sliders, 
  Layers
} from 'lucide-react';
import { useUI, useStore } from '../core/store-context';

type ViewMode = 'pads' | 'keys' | 'sample' | 'record' | 'mixer' | 'arrange';

export function LeftNav(): JSX.Element {
  const { currentView } = useUI();
  const { actions } = useStore();
  
  const navItems = [
    { id: 'pads' as ViewMode, label: 'Pads', icon: Grid3X3 },
    { id: 'keys' as ViewMode, label: 'Keys', icon: Piano },
    { id: 'sample' as ViewMode, label: 'Sample', icon: Scissors },
    { id: 'record' as ViewMode, label: 'Record', icon: Mic },
    { id: 'mixer' as ViewMode, label: 'Mixer', icon: Sliders },
    { id: 'arrange' as ViewMode, label: 'Arrange', icon: Layers },
  ];
  
  return (
    <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col py-4">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => actions.setView(id)}
          className={`flex flex-col items-center justify-center p-3 mx-2 mb-2 rounded-lg transition-colors ${
            currentView === id
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Icon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}