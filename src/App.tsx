import React, { useState, useEffect } from 'react';
import { StoreProvider, useProject, useStore } from './core/index';
import { Header } from './shared/ui/Header';
import { Nav } from './shared/ui/Nav';
import { MainContent } from './shared/ui/MainContent';
import { AudioProvider } from './shared/ui/AudioProvider';
import { OnboardingManager } from './features/onboarding/index';
import { HelpModal, useHotkeys } from './features/help/index';
import { AudioErrorBoundary, ErrorBoundary } from './components/ErrorBoundary';
import { ExportModal } from './components/ExportModal';

const AppContent: React.FC = () => {
  const project = useProject();
  const { actions, state } = useStore();
  const { showHelp } = state.ui;
  const [showExportModal, setShowExportModal] = React.useState(false);
  
  // Initialize global hotkeys
  useHotkeys();

  const handleExportClick = () => {
    setShowExportModal(true);
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
      
      {/* Phase 9: Onboarding System */}
      <OnboardingManager />
      
      {/* Phase 9: Help System */}
      {showHelp && <HelpModal onClose={() => actions.toggleHelp()} />}
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AudioErrorBoundary>
          <AudioProvider>
            <AppContent />
          </AudioProvider>
        </AudioErrorBoundary>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;