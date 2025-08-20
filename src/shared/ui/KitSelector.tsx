import React, { useState, useEffect, useMemo } from 'react';
import { musicRadarKitLoader, type MusicRadarKit } from '../../core/musicradar-kit-loader';

interface KitSelectorProps {
  selectedKit: string;
  onKitChange: (kitId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function KitSelector({ selectedKit, onKitChange, disabled, isLoading }: KitSelectorProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [kitCoverage, setKitCoverage] = useState<Map<string, number>>(new Map());
  
  // Get all available kits grouped by category - memoized to prevent infinite loops
  const kitsByCategory = useMemo(() => musicRadarKitLoader.getKitsGroupedByCategory(), []);
  const allKits = useMemo(() => musicRadarKitLoader.getAvailableKits(), []);
  
  // Filter kits based on search and category - memoized to prevent infinite loops
  const filteredKits = useMemo(() => 
    allKits.filter(kit => {
      const matchesSearch = searchQuery === '' || 
        kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || kit.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    }), [searchQuery, selectedCategory, allKits]
  );

  const selectedKitInfo = allKits.find(kit => kit.id === selectedKit);

  // Load coverage information for visible kits
  useEffect(() => {
    const loadCoverageInfo = async () => {
      const newCoverage = new Map<string, number>();
      
      // For performance, we'll use estimated coverage for now
      // In a production app, you might want to cache actual coverage results
      for (const kit of filteredKits.slice(0, 20)) { // Limit to first 20 for performance
        const estimated = musicRadarKitLoader.getEstimatedKitCoverage(kit.id);
        newCoverage.set(kit.id, estimated);
      }
      
      setKitCoverage(newCoverage);
    };

    loadCoverageInfo();
  }, [filteredKits]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Kit Selection</h3>
        <div className="text-sm text-gray-400">
          {allKits.length} kits available
        </div>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search kits..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-vibe-blue"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'acoustic', 'electronic', 'vinyl', 'kurzweil'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            disabled={disabled}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-vibe-blue text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            {category !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({kitsByCategory[category]?.length || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Kit List */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filteredKits.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            No kits match your search criteria
          </div>
        ) : (
          filteredKits.map((kit) => {
            const coverage = kitCoverage.get(kit.id) || 0;
            const coveragePercentage = Math.round((coverage / 16) * 100);
            
            return (
              <button
                key={kit.id}
                onClick={() => onKitChange(kit.id)}
                disabled={disabled}
                className={`w-full text-left p-3 rounded transition-colors ${
                  selectedKit === kit.id
                    ? 'bg-vibe-blue text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{kit.name}</div>
                    <div className="text-xs opacity-70 mt-1">{kit.description}</div>
                    {coverage > 0 && (
                      <div className="text-xs mt-1 flex items-center">
                        <span className="text-gray-400">Coverage:</span>
                        <span className="ml-1 text-green-400">{coverage}/16 pads</span>
                        <span className="ml-1 text-gray-500">({coveragePercentage}%)</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="text-xs bg-gray-600 px-2 py-1 rounded">
                      {kit.category}
                    </div>
                    {coverage > 0 && (
                      <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${coveragePercentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Current Kit Info */}
      {selectedKitInfo && (
        <div className="border-t border-gray-700 pt-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">Current Kit:</div>
            {isLoading && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-vibe-blue"></div>
            )}
          </div>
          <div className="text-white font-medium">{selectedKitInfo.name}</div>
          <div className="text-xs text-gray-400 mt-1">{selectedKitInfo.description}</div>
          
          {/* Coverage info for current kit */}
          {kitCoverage.has(selectedKitInfo.id) && (
            <div className="mt-2 p-2 bg-gray-700 rounded">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Pad Coverage:</span>
                <span className="text-green-400">
                  {kitCoverage.get(selectedKitInfo.id)}/16 pads
                </span>
              </div>
              <div className="mt-1 w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ 
                    width: `${Math.round(((kitCoverage.get(selectedKitInfo.id) || 0) / 16) * 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
              {selectedKitInfo.category}
            </span>
            <span className="text-xs text-gray-400">
              ID: {selectedKitInfo.id}
            </span>
            {isLoading && (
              <span className="text-xs text-vibe-blue animate-pulse">
                Loading...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}