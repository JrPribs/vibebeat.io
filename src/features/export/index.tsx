// Export Feature
// Audio and project export functionality

import React, { useState } from 'react';
import { Download, FileAudio, FileText } from 'lucide-react';
import type { ExportOptions } from '../../shared/models';

export function ExportView(): JSX.Element {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'mp3',
    quality: 'medium',
    includeProject: false,
    includeAssets: false
  });
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    
    try {
      // Export implementation will be added here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      // Download the file
      console.log('Export completed:', options);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Export</h2>
      
      {/* Format Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Export Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setOptions({ ...options, format: 'mp3' })}
            className={`p-4 rounded-lg border-2 transition-colors ${
              options.format === 'mp3' 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <FileAudio className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">MP3</div>
            <div className="text-xs text-gray-400">Compressed audio</div>
            <div className="text-xs text-gray-500">Best for sharing</div>
          </button>
          
          <button 
            onClick={() => setOptions({ ...options, format: 'wav' })}
            className={`p-4 rounded-lg border-2 transition-colors ${
              options.format === 'wav' 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <FileAudio className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">WAV</div>
            <div className="text-xs text-gray-400">Uncompressed audio</div>
            <div className="text-xs text-gray-500">44.1kHz/16-bit</div>
          </button>
          
          <button 
            onClick={() => setOptions({ ...options, format: 'project' })}
            className={`p-4 rounded-lg border-2 transition-colors ${
              options.format === 'project' 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <div className="font-semibold">Project</div>
            <div className="text-xs text-gray-400">vibebeat.io file</div>
            <div className="text-xs text-gray-500">.vibe.json</div>
          </button>
        </div>
      </div>
      
      {/* Quality Settings */}
      {(options.format === 'mp3' || options.format === 'wav') && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Quality</h3>
          <div className="flex space-x-4">
            {['low', 'medium', 'high'].map((quality) => (
              <button
                key={quality}
                onClick={() => setOptions({ ...options, quality: quality as any })}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  options.quality === quality
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {quality}
                <div className="text-xs opacity-75">
                  {quality === 'low' && options.format === 'mp3' && '128 kbps'}
                  {quality === 'medium' && options.format === 'mp3' && '192 kbps'}
                  {quality === 'high' && options.format === 'mp3' && '320 kbps'}
                  {options.format === 'wav' && '44.1kHz/16-bit'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Additional Options */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Options</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={options.includeProject}
              onChange={(e) => setOptions({ ...options, includeProject: e.target.checked })}
              className="h-4 w-4"
            />
            <span>Include project file with audio export</span>
          </label>
        </div>
      </div>
      
      {/* Export Preview */}
      <div className="mb-8 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Export Preview</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Format:</div>
            <div className="font-medium">{options.format.toUpperCase()}</div>
          </div>
          <div>
            <div className="text-gray-400">Quality:</div>
            <div className="font-medium capitalize">{options.quality}</div>
          </div>
          <div>
            <div className="text-gray-400">Duration:</div>
            <div className="font-medium">32 bars (64 seconds)</div>
          </div>
          <div>
            <div className="text-gray-400">Est. Size:</div>
            <div className="font-medium">
              {options.format === 'mp3' ? '1.2 MB' : options.format === 'wav' ? '11.2 MB' : '12 KB'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Button */}
      <div className="text-center">
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className={`btn-primary px-8 py-3 text-lg ${
            isExporting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Download className="h-5 w-5 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
        
        {isExporting && (
          <div className="mt-4">
            <div className="w-48 mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-sm text-gray-400 mt-2">Processing audio...</p>
          </div>
        )}
      </div>
    </div>
  );
}