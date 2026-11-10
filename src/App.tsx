import { FC, useState } from 'react';
import { ToastProvider } from './components/common/Toast';
import { LandingPage } from './pages/LandingPage';
import { AppShell } from './pages/app/AppShell';
import { StyleGuidePage } from './pages/StyleGuidePage';
import { AppScreenId } from './components/app/AppNav';

export const App: FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'styleguide'>('landing');
  const [targetAppScreen, setTargetAppScreen] = useState<AppScreenId>('today');

  const handleNavigateToApp = (screen?: string) => {
    if (screen && ['today', 'log', 'topics', 'graph', 'revisions', 'insights'].includes(screen)) {
      setTargetAppScreen(screen as AppScreenId);
    } else {
      setTargetAppScreen('today');
    }
    setCurrentView('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bg text-fg">
        {currentView === 'landing' && (
          <LandingPage onNavigateToApp={handleNavigateToApp} />
        )}
        {currentView === 'app' && (
          <AppShell
            initialScreen={targetAppScreen}
            onBackToLanding={handleBackToLanding}
          />
        )}
        {currentView === 'styleguide' && (
          <div>
            <div className="p-4 bg-surface-2 border-b border-border flex justify-between items-center">
              <span className="font-mono text-xs text-accent">Design Token Styleguide</span>
              <button
                onClick={handleBackToLanding}
                className="font-mono text-xs text-fg-muted hover:text-fg"
              >
                ← Back to Landing
              </button>
            </div>
            <StyleGuidePage />
          </div>
        )}

        {/* Global Floating Switcher for Styleguide & Quick Jump */}
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() =>
              setCurrentView((prev) =>
                prev === 'styleguide' ? 'landing' : 'styleguide'
              )
            }
            className="px-3 py-1.5 rounded-pill bg-surface/90 border border-border text-[11px] font-mono text-fg-muted hover:text-accent hover:border-accent/40 shadow-xl backdrop-blur-md transition-all select-none"
            title="Toggle Styleguide"
          >
            {currentView === 'styleguide' ? 'Exit Styleguide' : 'Styleguide'}
          </button>
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;
