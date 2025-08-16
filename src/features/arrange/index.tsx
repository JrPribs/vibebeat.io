// Arrange Feature
// A/B patterns and song arrangement

import React from 'react';
import { Copy, Play, Plus, Trash2 } from 'lucide-react';

export function ArrangeView(): JSX.Element {
  const arrangement = ['A', 'A', 'B', 'B'];
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Arrange</h2>
      
      {/* Pattern Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Patterns</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-blue-600 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold mb-2">A</div>
            <div className="text-sm opacity-80">Main Pattern</div>
            <button className="btn-secondary mt-2 w-full text-xs">
              <Play className="h-3 w-3 mr-1" />
              Play
            </button>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg text-center border-2 border-dashed border-gray-600">
            <div className="text-2xl font-bold mb-2 text-gray-400">B</div>
            <div className="text-sm text-gray-400">Variation</div>
            <button className="btn-secondary mt-2 w-full text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Copy A
            </button>
          </div>
        </div>
      </div>
      
      {/* Arrangement Chain */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Song Arrangement</h3>
          <button className="btn-primary text-sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Section
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex space-x-2 mb-4">
            {arrangement.map((pattern, index) => (
              <div key={index} className="relative group">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer transition-colors ${
                  pattern === 'A' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}>
                  {pattern}
                </div>
                <button className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex">
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="text-xs text-center mt-1 text-gray-400">
                  {index * 8 + 1}-{(index + 1) * 8}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-400">
            Total: {arrangement.length * 8} bars ({Math.round(arrangement.length * 8 * 2)} seconds at 120 BPM)
          </div>
        </div>
      </div>
      
      {/* Pattern Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Pattern Tools</h4>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-sm">Duplicate Pattern</button>
            <button className="btn-secondary w-full text-sm">Clear Pattern</button>
            <button className="btn-secondary w-full text-sm">Randomize</button>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Song Tools</h4>
          <div className="space-y-2">
            <button className="btn-primary w-full text-sm">Play Arrangement</button>
            <button className="btn-secondary w-full text-sm">Export Song</button>
            <button className="btn-secondary w-full text-sm">Save Template</button>
          </div>
        </div>
      </div>
    </div>
  );
}