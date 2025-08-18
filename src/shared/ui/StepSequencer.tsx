import React from 'react';

interface Step {
  step: number;
  pad: string;
  velocity: number;
}

interface StepSequencerProps {
  steps: Step[];
  currentStep: number;
  onStepToggle: (step: number, pad: string) => void;
  disabled?: boolean;
}

export function StepSequencer({ steps, currentStep, onStepToggle, disabled }: StepSequencerProps): JSX.Element {
  const totalSteps = 16; // 16th note grid
  const pads = ['KICK', 'SNARE', 'HIHAT_CLOSED', 'HIHAT_OPEN'];

  const isStepActive = (stepNumber: number, padName: string) => {
    return steps.some(step => step.step === stepNumber && step.pad === padName);
  };

  return (
    <div className="step-sequencer">
      <div className="grid grid-cols-16 gap-1 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded ${
              i === currentStep ? 'bg-green-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      
      {pads.map(pad => (
        <div key={pad} className="flex items-center gap-1 mb-2">
          <div className="w-16 text-xs text-gray-300">{pad}</div>
          {Array.from({ length: totalSteps }).map((_, step) => (
            <button
              key={step}
              onClick={() => onStepToggle(step, pad)}
              disabled={disabled}
              className={`w-6 h-6 rounded border ${
                isStepActive(step, pad)
                  ? 'bg-blue-500 border-blue-400'
                  : 'bg-gray-700 border-gray-600'
              } hover:bg-blue-400 transition-colors`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}