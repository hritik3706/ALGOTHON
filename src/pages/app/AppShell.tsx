import { FC, useState, useEffect } from 'react';
import { AppNav, AppScreenId } from '../../components/app/AppNav';
import { TodayScreen } from './TodayScreen';
import { ReviewScreen } from './ReviewScreen';
import { LogScreen } from './LogScreen';
import { ProblemsScreen } from './ProblemsScreen';
import { MistakesScreen } from './MistakesScreen';
import { TopicsScreen } from './TopicsScreen';
import { GraphScreen } from './GraphScreen';
import { RevisionsScreen } from './RevisionsScreen';
import { InsightsScreen } from './InsightsScreen';
import { SettingsScreen } from './SettingsScreen';
import { CoachDrawer } from '../../components/coach/CoachDrawer';
import { CommandPalette } from '../../components/common/CommandPalette';
import { Bot } from 'lucide-react';

interface AppShellProps {
  initialScreen?: AppScreenId;
  onBackToLanding: () => void;
}

export const AppShell: FC<AppShellProps> = ({
  initialScreen = 'today',
  onBackToLanding,
}) => {
  const [currentScreen, setCurrentScreen] = useState<AppScreenId>(initialScreen);
  const [logPrefill, setLogPrefill] = useState<{ title?: string; topicId?: string }>({});
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsCoachOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const handleNavigateToLog = (title?: string, topicId?: string) => {
    setLogPrefill({ title, topicId });
    setCurrentScreen('log');
  };

  const handleLogSuccess = () => {
    setCurrentScreen('today');
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col lg:flex-row relative">
      {/* Sidebar / Mobile Nav */}
      <AppNav
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        onBackToLanding={onBackToLanding}
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Screen Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto pb-24 lg:pb-10">
        {currentScreen === 'today' && (
          <TodayScreen
            onNavigateToLog={handleNavigateToLog}
            onStartReview={() => setCurrentScreen('review')}
          />
        )}
        {currentScreen === 'review' && (
          <ReviewScreen onExit={() => setCurrentScreen('today')} />
        )}
        {currentScreen === 'log' && (
          <LogScreen
            initialTitle={logPrefill.title}
            initialTopicId={logPrefill.topicId}
            onSuccess={handleLogSuccess}
          />
        )}
        {currentScreen === 'problems' && (
          <ProblemsScreen onLogProblem={handleNavigateToLog} />
        )}
        {currentScreen === 'mistakes' && (
          <MistakesScreen onLogProblem={handleNavigateToLog} />
        )}
        {currentScreen === 'topics' && (
          <TopicsScreen onLogTopic={(tid) => handleNavigateToLog(undefined, tid)} />
        )}
        {currentScreen === 'graph' && (
          <GraphScreen onLogTopic={(tid) => handleNavigateToLog(undefined, tid)} />
        )}
        {currentScreen === 'revisions' && (
          <RevisionsScreen onLogProblem={handleNavigateToLog} />
        )}
        {currentScreen === 'insights' && <InsightsScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
      </main>

      {/* Floating Bottom-Right Coach Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCoachOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent text-accent-ink font-ui font-semibold shadow-glow hover:bg-accent-hover transition-all select-none hover:scale-105"
          title="Ask Coach (Ctrl+J)"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Coach</span>
        </button>
      </div>

      {/* Coach Slide-Over Drawer */}
      <CoachDrawer isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenCoach={() => {
          setIsCommandPaletteOpen(false);
          setIsCoachOpen(true);
        }}
      />
    </div>
  );
};

