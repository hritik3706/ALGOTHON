import { FC, useState, useRef } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import {
  exportDataJSON,
  exportNotesMarkdown,
  importDataJSON,
  clearAllData,
  loadDemoData,
} from '../../api';
import {
  Download,
  Upload,
  Trash2,
  Database,
  Sliders,
  Bot,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const SettingsScreen: FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State (stored in localStorage)
  const [minAttempts, setMinAttempts] = useState(() => {
    return parseInt(localStorage.getItem('algothon_setting_min_attempts') || '5', 10);
  });
  const [minSuccessRate, setMinSuccessRate] = useState(() => {
    return parseInt(localStorage.getItem('algothon_setting_min_success') || '60', 10);
  });
  const [planSize, setPlanSize] = useState(() => {
    return parseInt(localStorage.getItem('algothon_setting_plan_size') || '4', 10);
  });
  const [intervalScheme, setIntervalScheme] = useState<'sm2' | 'fixed'>(() => {
    return (localStorage.getItem('algothon_setting_interval_scheme') as 'sm2' | 'fixed') || 'sm2';
  });
  const [coachMode, setCoachMode] = useState<'offline' | 'local' | 'cloud'>(() => {
    return (localStorage.getItem('algothon_setting_coach_mode') as any) || 'offline';
  });
  const [ollamaEndpoint, setOllamaEndpoint] = useState(() => {
    return localStorage.getItem('algothon_setting_ollama_ep') || 'http://localhost:11434';
  });
  const [cloudApiKey, setCloudApiKey] = useState(() => {
    return sessionStorage.getItem('algothon_coach_key') || '';
  });

  const savePreferences = () => {
    localStorage.setItem('algothon_setting_min_attempts', minAttempts.toString());
    localStorage.setItem('algothon_setting_min_success', minSuccessRate.toString());
    localStorage.setItem('algothon_setting_plan_size', planSize.toString());
    localStorage.setItem('algothon_setting_interval_scheme', intervalScheme);
    localStorage.setItem('algothon_setting_coach_mode', coachMode);
    localStorage.setItem('algothon_setting_ollama_ep', ollamaEndpoint);
    if (cloudApiKey) {
      sessionStorage.setItem('algothon_coach_key', cloudApiKey);
    }
    showToast('Preferences saved successfully.');
  };

  const handleExportJSON = () => {
    try {
      const json = exportDataJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `algothon_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported complete JSON backup.');
    } catch (err) {
      showToast('Error exporting backup', 'danger');
    }
  };

  const handleExportMarkdown = () => {
    try {
      const md = exportNotesMarkdown();
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `algothon_notes_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported formatted study notes.');
    } catch (err) {
      showToast('Error exporting notes', 'danger');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = importDataJSON(content);
        showToast(`Imported ${res.importedProblems} problems & ${res.importedAttempts} attempts.`);
      } catch (err: any) {
        showToast(err.message || 'Invalid backup file', 'danger');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all problems and history? A safety backup will be created in your browser storage.')) {
      clearAllData();
      showToast('All practice history cleared.');
    }
  };

  const handleReloadDemo = async () => {
    await loadDemoData();
    showToast('Loaded demo practice dataset.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-4xl text-fg font-normal tracking-tight">
          System <em className="italic text-accent">Preferences & Data</em>
        </h1>
        <p className="font-mono text-xs sm:text-sm text-fg-muted mt-1">
          Customize algorithm thresholds, revision intervals, data backups, and Coach modes.
        </p>
      </div>

      {/* Practice Algorithm Settings */}
      <Card className="p-6 bg-surface space-y-6">
        <div className="flex items-center gap-2 text-accent border-b border-border pb-3">
          <Sliders className="w-5 h-5" />
          <h2 className="font-ui text-base font-semibold text-fg">Practice & Scheduler Tuning</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          {/* Unlock threshold */}
          <div className="space-y-2">
            <label className="text-fg font-medium">Topic Prerequisite Unlock Minimum Attempts</label>
            <input
              type="number"
              min="1"
              max="20"
              value={minAttempts}
              onChange={(e) => setMinAttempts(parseInt(e.target.value, 10) || 5)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-fg"
            />
            <p className="text-[10px] text-fg-faint">Standard threshold: 5 attempts</p>
          </div>

          {/* Success rate threshold */}
          <div className="space-y-2">
            <label className="text-fg font-medium">Topic Prerequisite Unlock Min Success Rate (%)</label>
            <input
              type="number"
              min="10"
              max="100"
              value={minSuccessRate}
              onChange={(e) => setMinSuccessRate(parseInt(e.target.value, 10) || 60)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-fg"
            />
            <p className="text-[10px] text-fg-faint">Standard threshold: 60%</p>
          </div>

          {/* Daily plan size */}
          <div className="space-y-2">
            <label className="text-fg font-medium">Daily Plan Problem Count</label>
            <select
              value={planSize}
              onChange={(e) => setPlanSize(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-fg"
            >
              <option value="3">3 problems (Focused)</option>
              <option value="4">4 problems (Standard)</option>
              <option value="5">5 problems (Intensive)</option>
              <option value="7">7 problems (Full Marathon)</option>
            </select>
          </div>

          {/* Interval scheme */}
          <div className="space-y-2">
            <label className="text-fg font-medium">Revision Scheduler Algorithm</label>
            <select
              value={intervalScheme}
              onChange={(e) => setIntervalScheme(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-fg"
            >
              <option value="sm2">SuperMemo-2 (Adaptive Ease Factor)</option>
              <option value="fixed">Fixed Spaced Intervals (1d → 3d → 7d → 14d → 30d)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={savePreferences}>
            Save algorithm preferences
          </Button>
        </div>
      </Card>

      {/* Coach Chatbot Configuration */}
      <Card className="p-6 bg-surface space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-accent">
            <Bot className="w-5 h-5" />
            <h2 className="font-ui text-base font-semibold text-fg">Coach Chatbot Mode</h2>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent/15 text-accent">
            Offline Safe Default
          </span>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className="space-y-2">
            <label className="text-fg font-medium">Coach Operational Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'offline', title: 'Offline Coach', desc: '100% Client-side • Zero network' },
                { id: 'local', title: 'Local Model (Ollama)', desc: 'Runs on localhost:11434' },
                { id: 'cloud', title: 'Cloud BYOK', desc: 'Bring your own API Key' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setCoachMode(m.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    coachMode === m.id
                      ? 'border-accent bg-accent/10 text-fg'
                      : 'border-border bg-surface-2/40 text-fg-muted hover:border-white/20'
                  }`}
                >
                  <div className="font-bold">{m.title}</div>
                  <div className="text-[10px] text-fg-faint mt-1">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {coachMode === 'local' && (
            <div className="space-y-2 pt-2">
              <label className="text-fg font-medium">Local Ollama Endpoint</label>
              <input
                type="text"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-fg"
                placeholder="http://localhost:11434"
              />
            </div>
          )}

          {coachMode === 'cloud' && (
            <div className="space-y-2 pt-2">
              <label className="text-fg font-medium">Cloud API Key (Stored in Session Only)</label>
              <input
                type="password"
                value={cloudApiKey}
                onChange={(e) => setCloudApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-fg"
                placeholder="sk-..."
              />
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Never stored on disk or server. Memory only.</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <Button variant="secondary" size="sm" onClick={savePreferences}>
            Save Coach settings
          </Button>
        </div>
      </Card>

      {/* Data Management & Portability */}
      <Card className="p-6 bg-surface space-y-6">
        <div className="flex items-center gap-2 text-accent border-b border-border pb-3">
          <Database className="w-5 h-5" />
          <h2 className="font-ui text-base font-semibold text-fg">Data Portability & Backups</h2>
        </div>

        <p className="font-mono text-xs text-fg-muted">
          All data is stored purely locally in your browser. Export regular backups to prevent accidental loss when clearing browser cache.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportJSON}
            className="justify-center"
          >
            Export JSON Backup
          </Button>

          <Button
            variant="secondary"
            icon={<FileText className="w-4 h-4" />}
            onClick={handleExportMarkdown}
            className="justify-center"
          >
            Export Study Notes (Markdown)
          </Button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-center"
            >
              Import JSON Backup
            </Button>
          </div>

          <Button
            variant="secondary"
            icon={<Database className="w-4 h-4" />}
            onClick={handleReloadDemo}
            className="justify-center"
          >
            Reload Sample Demo Data
          </Button>
        </div>

        <div className="pt-4 border-t border-border flex justify-between items-center">
          <span className="font-mono text-xs text-danger font-medium">Danger Zone</span>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleClearData}
          >
            Clear all store data
          </Button>
        </div>
      </Card>
    </div>
  );
};
