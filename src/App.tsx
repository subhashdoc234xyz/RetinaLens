import React, { useState, useEffect, useCallback } from 'react';
import { ClinicianUser, ScanRecord, ActiveView } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getUserScans,
  deleteUserScan,
} from './lib/storage';
import { IrisBackground } from './components/IrisBackground';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { AuthView } from './components/AuthView';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ResultsView } from './components/ResultsView';
import { HistoryView } from './components/HistoryView';
import { ReportModal } from './components/ReportModal';

export default function App() {
  const [currentUser, setUser] = useState<ClinicianUser | null>(() => getCurrentUser());
  const [activeView, setActiveView] = useState<ActiveView>('landing');
  const [userScans, setUserScans] = useState<ScanRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [reportScan, setReportScan] = useState<ScanRecord | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modelStatus, setModelStatus] = useState({
    hasModelApi: false,
    hasGemini: false,
    engine: 'Clinical Edge Standby',
  });

  // Fetch scans for current authenticated clinician / guest
  const loadScans = useCallback(async () => {
    if (!currentUser) {
      setUserScans([]);
      return;
    }
    const scans = await getUserScans(currentUser.id);
    setUserScans(scans);
  }, [currentUser]);

  // Load config status from backend
  useEffect(() => {
    fetch('/api/config-status')
      .then((res) => res.json())
      .then((data) => {
        setModelStatus({
          hasModelApi: data.hasModelApi,
          hasGemini: data.hasGemini,
          engine: data.engine || 'Clinical Edge Standby',
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // Set initial view based on whether user is logged in
  useEffect(() => {
    if (currentUser && activeView === 'landing') {
      setActiveView('dashboard');
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: ClinicianUser) => {
    setUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    setUserScans([]);
    setSelectedScan(null);
    setActiveView('landing');
  };

  const handleSelectScan = (scan: ScanRecord) => {
    setSelectedScan(scan);
    setActiveView('results');
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!currentUser) return;
    await deleteUserScan(currentUser.id, scanId);
    await loadScans();
    if (selectedScan?.id === scanId) {
      setSelectedScan(null);
      setActiveView('dashboard');
    }
  };

  const isDimmedBackground = activeView !== 'landing';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-[#dbe1ff] selection:bg-[#00f0ff] selection:text-[#060d23]">
      {/* 1. Macro Human Eye Iris Visual Background from Google Stitch */}
      <IrisBackground dimmed={isDimmedBackground} />

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onLogout={handleLogout}
        edgeNodesOnline={true}
      />

      {/* 3. Main Screen View Area */}
      <div className="relative z-10 flex-1 flex flex-row overflow-hidden">
        {/* If logged in and on an application screen, render the left collapsible sidebar */}
        {currentUser && activeView !== 'landing' && activeView !== 'auth' && (
          <Sidebar
            currentUser={currentUser}
            activeView={activeView}
            onNavigate={(view) => setActiveView(view)}
            onLogout={handleLogout}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* View Switcher */}
        <main className="flex-1 flex flex-col overflow-y-auto relative w-full">
          {activeView === 'landing' && (
            <LandingHero onGetStarted={() => setActiveView(currentUser ? 'dashboard' : 'auth')} />
          )}

          {activeView === 'auth' && (
            <AuthView
              onSuccess={handleLoginSuccess}
              onBackToLanding={() => setActiveView('landing')}
            />
          )}

          {activeView === 'dashboard' && currentUser && (
            <Dashboard
              currentUser={currentUser}
              recentScans={userScans}
              onSelectScan={handleSelectScan}
              onRefreshScans={loadScans}
              onNavigateHistory={() => setActiveView('history')}
              modelStatus={modelStatus}
            />
          )}

          {activeView === 'results' && selectedScan && (
            <ResultsView
              scan={selectedScan}
              onBack={() => setActiveView('dashboard')}
              onOpenReportModal={(s) => setReportScan(s)}
            />
          )}

          {activeView === 'history' && currentUser && (
            <HistoryView
              userId={currentUser.id}
              scans={userScans}
              onSelectScan={handleSelectScan}
              onDeleteScan={handleDeleteScan}
              onOpenReportModal={(s) => setReportScan(s)}
              onNewScan={() => setActiveView('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Printable Clinical Diagnostic Report Modal */}
      {reportScan && currentUser && (
        <ReportModal
          scan={reportScan}
          currentUser={currentUser}
          onClose={() => setReportScan(null)}
        />
      )}
    </div>
  );
}
