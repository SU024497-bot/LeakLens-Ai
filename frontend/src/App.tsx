import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Sidebar, DashboardTab } from './components/Sidebar';
import { DashboardView } from './pages/dashboard/DashboardView';
import { UploadView } from './pages/dashboard/UploadView';
import { DataAnalysisView } from './pages/dashboard/DataAnalysisView';
import { LeakageDetectionView } from './pages/dashboard/LeakageDetectionView';
import { ResultsView } from './pages/dashboard/ResultsView';
import { ReportsView } from './pages/dashboard/ReportsView';
import { SettingsView } from './pages/dashboard/SettingsView';
import { HelpView } from './pages/dashboard/HelpView';
import { AuditResponse } from './types/audit';
import { checkBackendHealth, uploadAndAudit, auditSample } from './services/api';
import { 
  Database, UploadCloud, CheckCircle2, AlertTriangle, 
  RefreshCw, Menu, Home, ExternalLink 
} from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState<DashboardTab>('dashboard');
  const [activeAudit, setActiveAudit] = useState<AuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);

  useEffect(() => {
    checkBackendHealth().then(setBackendHealthy);
  }, []);

  const handleStartAuditing = () => {
    setView('app');
    // If no audit active, direct to upload tab
    if (!activeAudit) {
      setCurrentTab('upload');
    }
  };

  const handleAuditUpload = async (
    file: File,
    target?: string,
    sheet?: string,
    testFile?: File
  ) => {
    setIsLoading(true);
    try {
      const res = await uploadAndAudit(file, target, sheet, testFile);
      setActiveAudit(res);
      setCurrentTab('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditSample = async (sampleId: string, target?: string) => {
    setIsLoading(true);
    try {
      const res = await auditSample(sampleId, target);
      setActiveAudit(res);
      setCurrentTab('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'landing') {
    return <LandingPage onStartAuditing={handleStartAuditing} />;
  }

  const pageTitles: Record<DashboardTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Audit Dashboard',
      subtitle: activeAudit ? `Live analysis of ${activeAudit.summary.filename}` : 'Dataset overview and metrics',
    },
    upload: {
      title: 'Dataset Ingestion',
      subtitle: 'Upload CSV or Excel workbooks to execute automated audits',
    },
    analysis: {
      title: 'Data Profiling & Semantics',
      subtitle: 'Matrix dimensions, inferred types, missingness, and correlation matrix',
    },
    leakage: {
      title: 'Potential Data Leakage',
      subtitle: 'Target duplication, correlation anomalies, and post-outcome lookahead',
    },
    results: {
      title: 'Audit Findings Catalog',
      subtitle: 'Categorized evidence, recommendations, and rule boundaries',
    },
    reports: {
      title: 'Reports & Governance Deliverables',
      subtitle: 'Downloadable HTML, CSV, and JSON audit artifacts',
    },
    settings: {
      title: 'System & Privacy Settings',
      subtitle: 'Local privacy guarantees, limits, and cleanup lifecycles',
    },
    help: {
      title: 'Help & Heuristic Encyclopedia',
      subtitle: 'Rule descriptions, mathematical limitations, and FAQs',
    },
  };

  const currentMeta = pageTitles[currentTab];

  return (
    <div className="min-h-screen bg-[#EEEBDA] text-[#282B4A] flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onExitToLanding={() => setView('landing')}
        activeAudit={activeAudit}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top App Header */}
        <header className="sticky top-0 z-30 bg-[#EEEBDA]/95 backdrop-blur-md border-b border-vanilla-border/70 h-18 px-6 flex items-center justify-between">
          <div className="truncate">
            <h1 className="text-xl font-extrabold text-indigo-brand tracking-tight truncate">
              {currentMeta.title}
            </h1>
            <p className="text-xs text-indigo-brand/60 truncate">
              {currentMeta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Upload shortcut */}
            <button
              onClick={() => setCurrentTab('upload')}
              className="px-3.5 py-2 rounded-xl border border-vanilla-border bg-vanilla-card hover:bg-white text-indigo-brand text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload New File</span>
            </button>

            {/* Return to Landing shortcut */}
            <button
              onClick={() => setView('landing')}
              className="px-3 py-2 rounded-xl text-indigo-brand/70 hover:text-indigo-brand hover:bg-vanilla-card text-xs font-semibold transition-colors flex items-center gap-1"
              title="Return to Landing Page"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Home</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Views Container */}
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView audit={activeAudit} onNavigate={setCurrentTab} />
          )}

          {currentTab === 'upload' && (
            <UploadView
              onAuditStart={() => setIsLoading(true)}
              onAuditUpload={handleAuditUpload}
              onAuditSample={handleAuditSample}
              isLoading={isLoading}
              activeAudit={activeAudit}
            />
          )}

          {currentTab === 'analysis' && (
            <DataAnalysisView
              audit={activeAudit}
              onNavigateUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'leakage' && (
            <LeakageDetectionView
              audit={activeAudit}
              onNavigateUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'results' && (
            <ResultsView
              audit={activeAudit}
              onNavigateUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              audit={activeAudit}
              onNavigateUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}

          {currentTab === 'help' && <HelpView />}
        </main>
      </div>
    </div>
  );
};

export default App;
