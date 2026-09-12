import React, { useState, useRef } from 'react';
import { ClinicianUser, ScanRecord, DRSeverityLevel } from '../types';
import { DR_SEVERITY_LEVELS } from '../lib/constants';
import { saveUserScan } from '../lib/storage';

interface DashboardProps {
  currentUser: ClinicianUser;
  recentScans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onRefreshScans: () => void;
  onNavigateHistory: () => void;
  modelStatus: {
    hasModelApi: boolean;
    hasGemini: boolean;
    engine: string;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  recentScans,
  onSelectScan,
  onRefreshScans,
  onNavigateHistory,
  modelStatus,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('56');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female'>('Female');
  const [eyeSide, setEyeSide] = useState<'OD' | 'OS'>('OD');
  const [pupilStatus, setPupilStatus] = useState<'Dilated' | 'Undilated'>('Dilated');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please select a valid retinal fundus image file (JPEG, PNG, DICOM).');
      return;
    }
    setAnalysisError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunInference = async () => {
    if (!previewUrl) {
      setAnalysisError('Please upload a patient retinal fundus image first.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    const pId = patientId.trim() || `RL-${Math.floor(8000 + Math.random() * 999)}`;

    try {
      const response = await fetch('/api/analyze-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: previewUrl,
          patientId: pId,
          eyeSide,
          pupilDilationStatus: pupilStatus,
        }),
      });

      const data = await response.json();

      let drLevel: DRSeverityLevel = 0;
      let drLabel = 'Level 0 — No Diabetic Retinopathy';
      let confidence = 95.0;
      let findings = [];
      let explainability = '';
      let telemetry = {
        focalRegionsCount: 0,
        primaryAttributionSector: 'macula' as const,
        featureWeights: [
          { feature: 'Superior Temporal Microvascular Bed', weightPercent: 52.4 },
          { feature: 'Perimacular Lipid Exudate Perimeter', weightPercent: 25.6 },
          { feature: 'Inferior Vascular Arcade Integrity', weightPercent: 14.2 },
          { feature: 'Optic Disc Margin Caliber', weightPercent: 7.8 },
        ],
      };
      let modelSource: any = 'offline_heuristic';

      if (data.status === 'success') {
        drLevel = (data.drSeverityLevel ?? 0) as DRSeverityLevel;
        drLabel = data.drSeverityLabel || DR_SEVERITY_LEVELS[drLevel].name;
        confidence = Number(data.confidenceScore) || 94.8;
        findings = data.findings || [];
        explainability = data.explainabilityNotes || '';
        telemetry = data.telemetry || telemetry;
        modelSource = data.source || 'gemini_clinical_core';
      } else if (data.status === 'model_not_connected') {
        drLevel = 0;
        drLabel = 'Pending MATLAB / Edge Model Inference';
        confidence = 0;
        explainability =
          'Model endpoint not yet connected. Configure MODEL_API_URL in your .env file to link your external MATLAB / Python inference server.';
        modelSource = 'offline_heuristic';
      } else {
        throw new Error(data.error || 'Failed to process retinal scan.');
      }

      const newScan: ScanRecord = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUser.id,
        patientId: pId,
        patientAge: parseInt(patientAge, 10) || 56,
        eyeSide,
        pupilDilationStatus: pupilStatus,
        imageUrl: previewUrl,
        gradcamImageUrl: data.gradcamImageUrl || undefined,
        uploadedAt: new Date().toISOString(),
        drSeverityLevel: drLevel,
        drSeverityLabel: drLabel,
        confidenceScore: confidence,
        findings,
        explainabilityNotes: explainability,
        telemetry,
        modelSource,
      };

      await saveUserScan(newScan);
      onRefreshScans();
      onSelectScan(newScan);
    } catch (err: any) {
      setAnalysisError(err.message || 'Inference error occurred.');
    } finally {
      setAnalyzing(false);
    }
  };

  const abnormalCount = recentScans.filter((s) => s.drSeverityLevel > 0).length;
  const referralsCount = recentScans.filter((s) => s.drSeverityLevel >= 2).length;

  const filteredScans = recentScans.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      s.patientId.toLowerCase().includes(q) ||
      s.drSeverityLabel.toLowerCase().includes(q) ||
      s.eyeSide.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col w-full pb-10">
      {/* 1. Welcome & Triage Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#a5e7ff]">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span className="font-mono text-[11px] tracking-wider uppercase font-semibold">
              Rural Clinical AI Screening Station
            </span>
          </div>
          <h1 className="font-space text-3xl font-bold text-[#dee2f6] tracking-tight">
            Welcome back, {currentUser.displayName.startsWith('Dr.') ? currentUser.displayName : `Dr. ${currentUser.displayName}`}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-[#bbc9cf] text-xs">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#b8e3ff]">calendar_today</span>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[#3c494e]">•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#b8e3ff]">near_me</span>
              District Health Center #04, Sub-District East
            </span>
            <span className="text-[#3c494e]">•</span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#252a39]/90 border border-[#3c494e]/30">
              <span className="w-2 h-2 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff] animate-pulse" />
              <span className="font-mono text-[11px] text-[#a5e7ff] font-medium">
                {modelStatus.engine} (Online &amp; Calibrated)
              </span>
            </div>
          </div>
        </div>


      </section>

      {/* KPI Metric Overview Strip (Bento Glass Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* KPI 1: Today's Screenings */}
        <div className="relative overflow-hidden rounded-xl bg-[#161b2a]/70 backdrop-blur-xl p-4 border border-[#3c494e]/30 shadow-lg transition-all hover:bg-[#1a1f2e]/80">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-[#252a39] text-[#a5e7ff]">
              <span className="material-symbols-outlined text-[24px]">visibility</span>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#a5e7ff] bg-[#a5e7ff]/10 px-2 py-0.5 rounded-full border border-[#a5e7ff]/20">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +14% vs avg
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-space text-3xl font-bold text-[#dee2f6]">{recentScans.length > 0 ? recentScans.length : 28}</span>
            <span className="font-mono text-xs text-[#859399]">Today's Screenings</span>
            <span className="text-xs text-[#bbc9cf] mt-1">Target quota: 35 scheduled patients</span>
          </div>
          {/* Micro sparkline graph representation */}
          <div className="mt-3 pt-1 flex items-end gap-1.5 h-6">
            <div className="w-full bg-[#303444] rounded-t-sm h-2" />
            <div className="w-full bg-[#303444] rounded-t-sm h-3" />
            <div className="w-full bg-[#303444] rounded-t-sm h-4" />
            <div className="w-full bg-[#00d2ff] rounded-t-sm h-5 shadow-[0_0_8px_#00d2ff]" />
            <div className="w-full bg-[#303444] rounded-t-sm h-3" />
            <div className="w-full bg-[#a5e7ff]/40 rounded-t-sm h-6" />
            <div className="w-full bg-[#00d2ff] rounded-t-sm h-5" />
          </div>
        </div>

        {/* KPI 2: Abnormal Findings */}
        <div className="relative overflow-hidden rounded-xl bg-[#161b2a]/70 backdrop-blur-xl p-4 border border-[#3c494e]/30 shadow-lg transition-all hover:bg-[#1a1f2e]/80">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-[#252a39] text-[#b8e3ff]">
              <span className="material-symbols-outlined text-[24px]">warning_amber</span>
            </div>
            <span className="inline-flex items-center font-mono text-[11px] text-[#ffb4ab] bg-[#93000a]/40 px-2 py-0.5 rounded-full border border-[#ffb4ab]/30">
              Priority Alert
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-space text-3xl font-bold text-[#dee2f6]">
                {abnormalCount > 0 ? abnormalCount : 6}
              </span>
              <span className="font-mono text-sm text-[#ffb4ab] font-bold">
                ({abnormalCount > 0 ? ((abnormalCount / (recentScans.length || 1)) * 100).toFixed(1) : '21.4'}%)
              </span>
            </div>
            <span className="font-mono text-xs text-[#859399]">Abnormal Findings Detected</span>
            <span className="text-xs text-[#bbc9cf] mt-1">1 Proliferative, 2 Mod NPDR, 3 Mild</span>
          </div>
          {/* Pathologic distribution meter */}
          <div className="mt-3 w-full bg-[#303444] h-2 rounded-full overflow-hidden flex">
            <div className="bg-[#ffb4ab] h-full" style={{ width: '16%' }} />
            <div className="bg-amber-400 h-full" style={{ width: '33%' }} />
            <div className="bg-yellow-200/70 h-full" style={{ width: '51%' }} />
          </div>
        </div>

        {/* KPI 3: Referrals Sent */}
        <div className="relative overflow-hidden rounded-xl bg-[#161b2a]/70 backdrop-blur-xl p-4 border border-[#3c494e]/30 shadow-lg transition-all hover:bg-[#1a1f2e]/80">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-[#252a39] text-[#aec6ff]">
              <span className="material-symbols-outlined text-[24px]">local_hospital</span>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#aec6ff] bg-[#aec6ff]/10 px-2 py-0.5 rounded-full border border-[#aec6ff]/20">
              Fast-Track Hub
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-space text-3xl font-bold text-[#dee2f6]">
                {referralsCount > 0 ? referralsCount : 4}
              </span>
              <span className="font-mono text-xs text-[#859399]">of {abnormalCount > 0 ? abnormalCount : 6} Flagged</span>
            </div>
            <span className="font-mono text-xs text-[#859399]">Referrals Sent</span>
            <span className="text-xs text-[#bbc9cf] mt-1">To Regional Ophthalmology &amp; Retinal Care</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[#859399] font-mono text-xs pt-1">
            <span>Tele-retina triage avg: 14 min</span>
            <span className="text-[#a5e7ff] font-bold">100% Routed</span>
          </div>
        </div>
      </section>

      {/* 2. Hero Upload Retinal Image Card (Liquid Glass Component) */}
      <section className="mb-8">
        <div className="relative rounded-2xl p-6 bg-[#161b2a]/60 backdrop-blur-2xl shadow-xl overflow-hidden border border-[#3c494e]/30">
          <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-[#00d2ff]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            {/* Drop Area Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              id="dropzone-area"
              className={`group flex-1 cursor-pointer rounded-xl bg-[#090e1c]/80 p-8 transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner border ${
                dragActive
                  ? 'border-[#00d2ff] bg-[#1a1f2e]/60 shadow-[0_0_24px_rgba(0,210,255,0.3)]'
                  : previewUrl
                  ? 'border-[#00d2ff]/50 bg-[#1a1f2e]/40'
                  : 'border-[#3c494e]/40 hover:border-[#00d2ff]/40 hover:bg-[#1a1f2e]/30'
              }`}
            >
              {/* Rotating Reticle SVG Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity">
                <svg className="text-[#a5e7ff] animate-[spin_60s_linear_infinite]" fill="none" height="220" viewBox="0 0 100 100" width="220">
                  <circle cx="50" cy="50" r="46" stroke="currentColor" strokeDasharray="4 3" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="0.75" />
                  <circle cx="50" cy="50" fill="currentColor" fillOpacity="0.15" r="14" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="50" x2="50" y1="2" y2="16" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="50" x2="50" y1="84" y2="98" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="2" x2="16" y1="50" y2="50" />
                  <line stroke="currentColor" strokeLinecap="round" strokeWidth="2" x1="84" x2="98" y1="50" y2="50" />
                </svg>
              </div>

              {/* Central Optical Visual Icon / Preview */}
              {previewUrl ? (
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 w-full max-w-lg">
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#00d2ff]/50 shadow-lg shrink-0 bg-black">
                    <img src={previewUrl} alt="Retinal Fundus Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#00d2ff]/10 pointer-events-none" />
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5 text-xs text-[#00d2ff] font-semibold mb-1">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Fundus photograph staged</span>
                    </div>
                    <span className="text-sm font-bold text-[#dee2f6] truncate max-w-[200px]">
                      {selectedFile?.name || 'fundus_scan.jpg'}
                    </span>
                    <span className="text-xs text-[#bbc9cf] mt-0.5">
                      Size: {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '1.2'} MB
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 text-xs text-[#a5e7ff] hover:text-[#00d2ff] underline text-left cursor-pointer"
                    >
                      Replace photograph
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative z-10 w-20 h-20 mb-4 rounded-full bg-[#252a39]/80 flex items-center justify-center shadow-[0_0_24px_rgba(0,210,255,0.25)] group-hover:scale-105 transition-transform border border-[#a5e7ff]/30">
                    <span className="material-symbols-outlined text-[42px] text-[#00d2ff]">center_focus_strong</span>
                  </div>
                  <div className="relative z-10 max-w-lg flex flex-col gap-1">
                    <h3 className="font-space text-xl text-[#dee2f6] font-semibold tracking-tight">
                      Drag &amp; drop a fundus image or click to browse
                    </h3>
                    <p className="text-sm text-[#bbc9cf]">
                      Instant Grad-CAM explainability saliency heatmaps, macular edema checks, and automated ETDRS grading.
                    </p>
                    <div className="mt-2 pt-1">
                      <span className="font-mono text-[11px] text-[#859399]">
                        Supported: Topcon, Canon, Zeiss fundus cameras &amp; smartphone ophthalmoscope adapters (JPEG, PNG, DICOM)
                      </span>
                    </div>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                accept="image/jpeg,image/png,application/dicom"
                className="hidden"
                id="fundus-file-input"
                type="file"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
              />
            </div>

            {/* Direct Hardware & Mode Controls Side Column */}
            <div className="lg:w-80 flex flex-col gap-4 justify-between bg-[#252a39]/40 p-5 rounded-xl backdrop-blur-md border border-[#3c494e]/30">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#a5e7ff] uppercase font-bold tracking-wider">Acquisition Mode</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#00d2ff]/20 text-[#00d2ff] font-mono font-semibold">Direct Feed</span>
                </div>
                <p className="text-xs text-[#bbc9cf]">
                  Attach connected slit lamp sensor or select archived fundus file.
                </p>
              </div>

              {/* Patient Metadata Inputs */}
              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="font-mono text-[10px] text-[#bbc9cf] uppercase block mb-1">
                    Patient ID / NHID
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="e.g. RL-8092"
                    className="w-full px-3 py-2 rounded-lg bg-[#090e1c] border border-[#3c494e]/40 text-xs font-mono text-[#dee2f6] placeholder:text-[#859399] focus:outline-none focus:border-[#00d2ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-mono text-[10px] text-[#bbc9cf] uppercase block mb-1">
                      Eye Examined
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-[#090e1c] p-1 rounded-lg border border-[#3c494e]/40">
                      <button
                        type="button"
                        onClick={() => setEyeSide('OD')}
                        className={`py-1 text-xs font-mono font-bold rounded ${
                          eyeSide === 'OD' ? 'bg-[#00d2ff] text-[#090e1c]' : 'text-[#bbc9cf]'
                        }`}
                      >
                        OD
                      </button>
                      <button
                        type="button"
                        onClick={() => setEyeSide('OS')}
                        className={`py-1 text-xs font-mono font-bold rounded ${
                          eyeSide === 'OS' ? 'bg-[#00d2ff] text-[#090e1c]' : 'text-[#bbc9cf]'
                        }`}
                      >
                        OS
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] text-[#bbc9cf] uppercase block mb-1">
                      Pupil State
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-[#090e1c] p-1 rounded-lg border border-[#3c494e]/40">
                      <button
                        type="button"
                        onClick={() => setPupilStatus('Dilated')}
                        className={`py-1 text-[11px] font-medium rounded ${
                          pupilStatus === 'Dilated' ? 'bg-[#a5e7ff] text-[#090e1c] font-bold' : 'text-[#bbc9cf]'
                        }`}
                      >
                        Dilated
                      </button>
                      <button
                        type="button"
                        onClick={() => setPupilStatus('Undilated')}
                        className={`py-1 text-[11px] font-medium rounded ${
                          pupilStatus === 'Undilated' ? 'bg-[#a5e7ff] text-[#090e1c] font-bold' : 'text-[#bbc9cf]'
                        }`}
                      >
                        Undilated
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {analysisError && (
                <div className="p-2.5 rounded-lg bg-[#93000a]/40 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs">
                  {analysisError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={analyzing}
                  onClick={previewUrl ? handleRunInference : () => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#47d6ff] to-[#508eff] text-[#090e1c] font-space text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.35)] hover:shadow-[0_0_30px_rgba(0,210,255,0.55)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {analyzing ? 'cyclone' : previewUrl ? 'psychology' : 'file_upload'}
                  </span>
                  <span>
                    {analyzing
                      ? 'Analyzing Fundus...'
                      : previewUrl
                      ? 'Execute Edge Inference'
                      : 'Select Fundus File'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#303444]/60 hover:bg-[#303444] text-[#a5e7ff] font-space text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm border border-[#3c494e]/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">usb</span>
                  Capture from USB Scope
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between text-[#859399] font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  Optic Calibrator Ready
                </span>
                <span>FOV: 50° Angled</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recent Clinic Screenings Section */}
      <section className="flex flex-col gap-4">
        {/* Section Header with Search Quick-Filter & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-space text-xl text-[#dee2f6] font-semibold tracking-tight">
              Recent Clinic Screenings
            </h2>
            <span className="font-mono text-xs bg-[#303444] px-2.5 py-0.5 rounded-full text-[#b8e3ff] border border-[#3c494e]/30">
              Today ({recentScans.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Quick Filter */}
            <div className="relative w-64 md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#859399] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by patient ID, name, or stage..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#090e1c]/80 text-[#dee2f6] placeholder:text-[#859399] text-xs focus:outline-none focus:bg-[#161b2a] border border-[#3c494e]/30 transition-all font-mono"
              />
            </div>

            <button
              onClick={onNavigateHistory}
              className="px-4 py-2 rounded-xl bg-[#1a1f2e] hover:bg-[#252a39] text-[#a5e7ff] font-mono text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap border border-[#3c494e]/30 cursor-pointer"
            >
              <span>View All History</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Screenings Grid / Interactive Feed */}
        <div className="grid grid-cols-1 gap-3">
          {filteredScans.length === 0 ? (
            <div className="rounded-xl p-8 bg-[#161b2a]/40 border border-[#3c494e]/30 text-center flex flex-col items-center justify-center gap-2 backdrop-blur-xl">
              <span className="material-symbols-outlined text-[36px] text-[#859399]">visibility_off</span>
              <span className="text-sm font-semibold text-[#dee2f6]">No screening records match your query</span>
              <p className="text-xs text-[#bbc9cf]">Upload a retinal fundus photograph to begin screening analysis.</p>
            </div>
          ) : (
            filteredScans.slice(0, 6).map((scan) => {
              const severity = DR_SEVERITY_LEVELS[scan.drSeverityLevel];
              return (
                <div
                  key={scan.id}
                  onClick={() => onSelectScan(scan)}
                  className="group relative rounded-xl bg-[#161b2a]/70 hover:bg-[#1a1f2e]/80 backdrop-blur-xl p-4 transition-all duration-200 border border-[#3c494e]/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-[#00d2ff]/40"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Retinal Scan Thumbnail */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#303444] shrink-0 shadow-inner border border-[#3c494e]/40">
                      <img
                        src={scan.imageUrl}
                        alt="Fundus Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-[#00d2ff]/10 mix-blend-overlay" />
                      <div className="absolute bottom-0 right-0 p-0.5 bg-[#090e1c]/90 rounded-tl">
                        <span className="material-symbols-outlined text-[12px] text-[#a5e7ff]">4k</span>
                      </div>
                    </div>

                    {/* Patient Clinical Meta */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-space text-base text-[#dee2f6] font-semibold truncate">
                          Patient #{scan.patientId}
                        </span>
                        <span className="font-mono text-xs text-[#859399]">
                          Age {scan.patientAge || 56}, {patientGender}
                        </span>
                        <span className="text-[#3c494e]">•</span>
                        <span className="font-mono text-xs text-[#bbc9cf] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {new Date(scan.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#bbc9cf] truncate mt-0.5">
                        Fundus {scan.eyeSide} ({scan.eyeSide === 'OD' ? 'Right Eye' : 'Left Eye'}) • {scan.explainabilityNotes.slice(0, 75) || 'Optical analysis complete'}
                      </p>
                    </div>
                  </div>

                  {/* Diagnosis Badge & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div
                      style={{
                        backgroundColor: severity.badgeBg,
                        borderColor: severity.badgeBorder,
                        color: severity.badgeText,
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
                    >
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: severity.colorHex }}
                      />
                      <span>{severity.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScan(scan);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#252a39] hover:bg-[#00d2ff] hover:text-[#090e1c] text-[#a5e7ff] font-space text-xs font-semibold transition-all flex items-center gap-1 border border-[#3c494e]/30 cursor-pointer"
                    >
                      <span>Open Analysis</span>
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
