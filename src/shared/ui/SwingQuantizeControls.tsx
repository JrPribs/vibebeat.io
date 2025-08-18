import React from 'react';

interface SwingQuantizeControlsProps {
  swing: number;
  quantize: number;
  onSwingChange: (value: number) => void;
  onQuantizeChange: (value: number) => void;
  disabled?: boolean;
}

export function SwingQuantizeControls({ 
  swing, 
  quantize, 
  onSwingChange, 
  onQuantizeChange, 
  disabled 
}: SwingQuantizeControlsProps): JSX.Element {
  const quantizeOptions = [
    { value: 100, label: '100%' },
    { value: 75, label: '75%' },
    { value: 50, label: '50%' },
    { value: 25, label: '25%' },
    { value: 0, label: 'Off' }
  ];

  return (
    <div className="swing-quantize-controls flex gap-4">
      <div>
        <label className="text-sm font-medium text-gray-300">
          Swing: {swing}%
          <input
            type="range"
            min="0"
            max="60"
            value={swing}
            onChange={(e) => onSwingChange(Number(e.target.value))}
            disabled={disabled}
            className="block mt-1 w-full"
          />
        </label>
      </div>
      
      <div>
        <label className="text-sm font-medium text-gray-300">
          Quantize:
          <select
            value={quantize}
            onChange={(e) => onQuantizeChange(Number(e.target.value))}
            disabled={disabled}
            className="ml-2 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            {quantizeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}