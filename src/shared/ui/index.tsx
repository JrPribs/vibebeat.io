// Shared UI Components
// Reusable components for the application

import React from 'react';
import { LucideIcon } from 'lucide-react';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  loading, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps): JSX.Element {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={`${
        baseClasses
      } ${
        variantClasses[variant]
      } ${
        sizeClasses[size]
      } ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
      ) : Icon ? (
        <Icon className="h-4 w-4 mr-2" />
      ) : null}
      {children}
    </button>
  );
}

// Slider Component
export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export function Slider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  label, 
  unit = '',
  className = '' 
}: SliderProps): JSX.Element {
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{label}</label>
          <span className="text-xs text-gray-400">{value}{unit}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}

// Level Meter Component
export interface LevelMeterProps {
  level: number; // 0-1
  peaks?: number[]; // Array of peak levels for stereo
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function LevelMeter({ 
  level, 
  peaks = [], 
  orientation = 'horizontal', 
  className = '' 
}: LevelMeterProps): JSX.Element {
  const isVertical = orientation === 'vertical';
  
  return (
    <div className={`${
      isVertical ? 'h-32 w-4' : 'h-4 w-full'
    } bg-gray-700 rounded-lg overflow-hidden ${className}`}>
      <div 
        className={`${
          isVertical ? 'w-full' : 'h-full'
        } bg-gradient-to-${isVertical ? 't' : 'r'} from-green-500 via-yellow-500 to-red-500 transition-all duration-100`}
        style={{
          [isVertical ? 'height' : 'width']: `${level * 100}%`,
          [isVertical ? 'marginTop' : 'marginLeft']: isVertical ? 'auto' : '0'
        }}
      />
    </div>
  );
}

// Transport Controls
export interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onRecord?: () => void;
  isRecording?: boolean;
  className?: string;
}

export function TransportControls({ 
  isPlaying, 
  onPlay, 
  onStop, 
  onRecord, 
  isRecording, 
  className = '' 
}: TransportControlsProps): JSX.Element {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button 
        onClick={onPlay}
        className={`transport-btn ${
          isPlaying ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'
        }`}
        disabled={isPlaying}
      >
        ▶
      </button>
      
      <button 
        onClick={onStop}
        className="transport-btn bg-gray-600 hover:bg-gray-700"
      >
        ⏹
      </button>
      
      {onRecord && (
        <button 
          onClick={onRecord}
          className={`transport-btn ${
            isRecording 
              ? 'bg-red-700 animate-pulse' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          ●
        </button>
      )}
    </div>
  );
}