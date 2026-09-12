import React, { useState, useEffect, useCallback } from 'react';
import { ClinicianUser, ScanRecord, ActiveView } from './types';
import {
  getCurrentUser,
  setCurrentUser,
  getUserScans,
  deleteUserScan,
} from './lib/storage';
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
    if (!selectedScan && scans.length > 0) {
      setSelectedScan(scans[0]);
    }
  }, [currentUser, selectedScan]);

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

  // 1. Full Screen Landing Page (Matches Stitch retinalens_landing_page)
  if (activeView === 'landing') {
    return <LandingHero onGetStarted={() => setActiveView(currentUser ? 'dashboard' : 'auth')} />;
  }

  // 2. Full Screen Clinical Authentication (Matches Stitch retinalens_clinical_authentication)
  if (activeView === 'auth') {
    return (
      <AuthView
        onSuccess={handleLoginSuccess}
        onBackToLanding={() => setActiveView('landing')}
      />
    );
  }

  // Fallback scan for Results view if no scan uploaded yet
  const currentScanOrFallback: ScanRecord = selectedScan || (userScans.length > 0 ? userScans[0] : {
    id: 'SCN-2024-8092-OD',
    userId: currentUser?.id || 'demo',
    patientId: 'RL-8092',
    patientAge: 56,
    eyeSide: 'OD',
    pupilDilationStatus: 'Dilated',
    imageUrl: '/assets/fundus_sample.png',
    uploadedAt: new Date().toISOString(),
    drSeverityLevel: 2,
    drSeverityLabel: 'Level 2 — Moderate NPDR',
    confidenceScore: 94.8,
    findings: [
      { id: '1', type: 'microaneurysms', label: 'Microaneurysms', severity: 'moderate', description: '14 detected in superior temporal quadrant' },
      { id: '2', type: 'hard_exudates', label: 'Hard Exudates', severity: 'moderate', description: 'Clusters in foveal sparing region' },
    ],
    explainabilityNotes: 'Grad-CAM attention network concentrated 78% weight on upper-temporal microvascular clusters. Concordant with Moderate NPDR.',
    telemetry: {
      focalRegionsCount: 4,
      primaryAttributionSector: 'superior_temporal',
      featureWeights: [
        { feature: 'Superior Temporal Microvascular Bed', weightPercent: 52.4 },
        { feature: 'Perimacular Lipid Exudate Perimeter', weightPercent: 25.6 },
        { feature: 'Inferior Vascular Arcade Integrity', weightPercent: 14.2 },
        { feature: 'Optic Disc Margin Caliber', weightPercent: 7.8 },
      ],
    },
    modelSource: 'gemini_clinical_core',
  });

  // 3. Clinical Application Portal (Dashboard, Scan Results, History Registry)
  return (
    <div className="relative min-h-screen w-full bg-[#0e1321] text-[#dee2f6] selection:bg-[#00d2ff] selection:text-[#090e1c]">
      {/* Fixed Left Clinical Navigation Sidebar */}
      {currentUser && (
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
          onLogout={handleLogout}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Viewport Container with responsive sidebar offset */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-72'}`}>
        {/* Top Clinical Header (St. Jude Clinic / Node Status / Clinician Avatar) */}
        <header className="sticky top-0 z-40 h-20 bg-[#090e1c]/80 backdrop-blur-xl border-b border-[#3c494e]/30 flex items-center justify-between px-6 sm:px-8 shadow-md">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#252a39]/60 backdrop-blur-md border border-[#3c494e]/30">
            <span className="material-symbols-outlined text-[#00d2ff] text-[18px]">home_health</span>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-[#dee2f6] font-semibold">
                {currentUser?.clinicName || 'Rural Health Unit 04 — St. Jude Clinic'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff] animate-pulse" />
                <span className="font-mono text-[10px] text-[#a5e7ff]">Edge AI Node: Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-right">
              <span className="text-xs sm:text-sm font-semibold text-[#dee2f6]">
                {currentUser?.displayName || 'Dr. Priya Sharma, MD'}
              </span>
              <span className="font-mono text-[11px] text-[#bbc9cf]">
                {currentUser?.isGuest ? 'Guest Field Officer' : 'Rural Health Officer'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#a5e7ff]/40 shadow-md shrink-0 bg-[#252a39]">
              <img
                src="/assets/doctor_avatar.png"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 relative w-full">
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

          {activeView === 'results' && (
            <ResultsView
              scan={currentScanOrFallback}
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
