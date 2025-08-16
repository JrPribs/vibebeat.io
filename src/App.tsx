import React, { useState, useEffect } from 'react';
import { StoreProvider, useProject } from './core/index';
import { Header } from './shared/ui/Header';
import { Nav } from './shared/ui/Nav';
import { MainContent } from './shared/ui/MainContent';
import { AudioProvider } from './shared/ui/AudioProvider';

const AppContent: React.FC = () => {
  const project = useProject();

  const handleExportClick = () => {
    console.log('Export clicked - modal will be implemented');
  };

  const handleProjectsClick = () => {
    console.log('Projects clicked - modal will be implemented');
  };

  const handleShareClick = () => {
    console.log('Share clicked - modal will be implemented');
  };

  const handleSaveToCloud = () => {
    console.log('Save to cloud clicked - will be implemented');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header 
        onExportClick={handleExportClick}
        onProjectsClick={handleProjectsClick}
        onShareClick={handleShareClick}
        onSaveToCloud={handleSaveToCloud}
      />
      <div className="flex flex-1">
        <Nav />
        <MainContent />
      </div>
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </StoreProvider>
  );
}

export default App;
