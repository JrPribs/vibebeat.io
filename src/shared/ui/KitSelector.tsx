import React from 'react';

interface KitSelectorProps {
  selectedKit: string;
  onKitChange: (kitId: string) => void;
  disabled?: boolean;
}

export function KitSelector({ selectedKit, onKitChange, disabled }: KitSelectorProps): JSX.Element {
  const kits = [
    { id: 'factory-kit-01', name: 'Factory Kit 01' },
    { id: 'factory-kit-02', name: 'Factory Kit 02' }
  ];

  return (
    <div className="kit-selector">
      <label className="text-sm font-medium text-gray-300">
        Kit:
        <select 
          value={selectedKit}
          onChange={(e) => onKitChange(e.target.value)}
          disabled={disabled}
          className="ml-2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
        >
          {kits.map(kit => (
            <option key={kit.id} value={kit.id}>{kit.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}