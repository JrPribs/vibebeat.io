import React, { useState } from 'react';
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
  
  // Get all available kits grouped by category
  const kitsByCategory = musicRadarKitLoader.getKitsGroupedByCategory();
  const allKits = musicRadarKitLoader.getAvailableKits();
  
  // Filter kits based on search and category
  const filteredKits = allKits.filter(kit => {
    const matchesSearch = searchQuery === '' || 
      kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || kit.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const selectedKitInfo = allKits.find(kit => kit.id === selectedKit);

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
          filteredKits.map((kit) => (
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
                </div>
                <div className="text-xs bg-gray-600 px-2 py-1 rounded ml-2">
                  {kit.category}
                </div>
              </div>
            </button>
          ))
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