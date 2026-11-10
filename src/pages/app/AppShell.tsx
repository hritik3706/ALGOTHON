import { FC, useState } from 'react';
import { AppNav, AppScreenId } from '../../components/app/AppNav';
import { TodayScreen } from './TodayScreen';
import { LogScreen } from './LogScreen';
import { TopicsScreen } from './TopicsScreen';
import { GraphScreen } from './GraphScreen';
import { RevisionsScreen } from './RevisionsScreen';
import { InsightsScreen } from './InsightsScreen';

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

  const handleNavigateToLog = (title?: string, topicId?: string) => {
    setLogPrefill({ title, topicId });
    setCurrentScreen('log');
  };

  const handleLogSuccess = () => {
    setCurrentScreen('today');
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col lg:flex-row">
      {/* Sidebar / Mobile Nav */}
      <AppNav
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        onBackToLanding={onBackToLanding}
      />

      {/* Main Screen Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
        {currentScreen === 'today' && (
          <TodayScreen onNavigateToLog={handleNavigateToLog} />
        )}
        {currentScreen === 'log' && (
          <LogScreen
            initialTitle={logPrefill.title}
            initialTopicId={logPrefill.topicId}
            onSuccess={handleLogSuccess}
          />
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
      </main>
    </div>
  );
};

