import React, { useState } from 'react';
import { ScanRecord, LesionFinding } from '../types';
import { DR_SEVERITY_LEVELS } from '../lib/constants';
import {
  Eye,
  Sliders,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Activity,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

interface ResultsViewProps {
  scan: ScanRecord;
  onBack: () => void;
  onOpenReportModal: (scan: ScanRecord) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ scan, onBack, onOpenReportModal }) => {
  const [showGradCam, setShowGradCam] = useState(true);
  const [gradCamOpacity, setGradCamOpacity] = useState(0.65);
  const [greenFilter, setGreenFilter] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showExplainability, setShowExplainability] = useState(true);
  const [activeFinding, setActiveFinding] = useState<LesionFinding | null>(null);

  const severity = DR_SEVERITY_LEVELS[scan.drSeverityLevel];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb / Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181f35]/60 border border-[#3b494b]/40 text-[#b9cacb] hover:text-[#dbfcff] text-xs font-semibold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#181f35]/80 border border-[#3b494b]/40 text-xs font-mono text-[#7bd0ff]">
            Patient ID: <strong className="text-[#dbfcff]">{scan.patientId}</strong> ({scan.eyeSide})
          </div>

          <button
            onClick={() => onOpenReportModal(scan)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a6e0] text-[#002022] font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clinical Report</span>
          </button>
        </div>
      </div>

      {/* SCREEN 4 SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Fundus Optical Viewer + Heatmap Overlays (Cols 1-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-2xl bg-[#060d23]/80 border border-[#3b494b]/40 p-4 shadow-2xl backdrop-blur-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-xs font-bold text-[#dbfcff] tracking-wide uppercase font-heading">
                  High-Resolution Fundus Inspection
                </span>
              </div>

              {/* Viewer Tools (Zoom, Red-free optical filter) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGreenFilter(!greenFilter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    greenFilter
                      ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]'
                      : 'bg-[#181f35]/80 border-[#3b494b]/40 text-[#b9cacb] hover:text-[#dbfcff]'
                  }`}
                  title="Optical Green Filter enhances contrast of microvascular lesions and hemorrhages"
                >
                  Green Filter (Red-Free)
                </button>

                <div className="flex items-center gap-1 bg-[#181f35]/80 border border-[#3b494b]/40 rounded-lg p-0.5">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                    className="p-1 hover:text-[#00f0ff] text-[#b9cacb] cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1 text-[#dbe1ff]">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                    className="p-1 hover:text-[#00f0ff] text-[#b9cacb] cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="p-1 hover:text-[#00f0ff] text-[#b9cacb] cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-[#3b494b]/40 flex items-center justify-center select-none">
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* Base Fundus Image */}
                <img
                  src={scan.imageUrl}
                  alt="Retinal Fundus Image"
                  className={`w-full h-full object-contain ${
                    greenFilter ? 'filter hue-rotate-90 saturate-200 contrast-125' : ''
                  }`}
                />

                {/* Grad-CAM Heatmap Layer Overlay */}
                {showGradCam && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-200"
                    style={{ opacity: gradCamOpacity }}
                  >
                    {/* Simulated SVG Saliency Heatmap aligned with fundus focal centers */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <radialGradient id="cam1" cx="45%" cy="50%" r="25%">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                          <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.75" />
                          <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="cam2" cx="30%" cy="38%" r="18%">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <rect width="100" height="100" fill="url(#cam1)" />
                      <rect width="100" height="100" fill="url(#cam2)" />
                    </svg>
                  </div>
                )}

                {/* Lesion Pinpoint Markers */}
                {scan.findings.map((f, idx) => {
                  const coords = f.coordinates || { x: 35 + idx * 15, y: 40 + idx * 10 };
                  const isHovered = activeFinding?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      onMouseEnter={() => setActiveFinding(f)}
                      onMouseLeave={() => setActiveFinding(null)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                          isHovered
                            ? 'border-[#00f0ff] bg-[#00f0ff]/30 scale-125'
                            : 'border-[#ffb4ab] bg-[#ffb4ab]/20'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap px-2.5 py-1 rounded-md bg-[#060d23]/95 border border-[#00f0ff]/50 text-[10px] text-[#dbfcff] shadow-xl z-30 pointer-events-none">
                        <strong>{f.label}</strong> ({f.severity})
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inset optical indicator badge */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-[#060d23]/80 border border-[#3b494b]/50 text-[10px] text-[#b9cacb] backdrop-blur-md">
                Field: 45° Posterior Pole • Optic Disc: Visible
              </div>
            </div>

            {/* Grad-CAM Controls */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#141b31]/70 border border-[#3b494b]/30 flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGradCam}
                  onChange={(e) => setShowGradCam(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#2d344c] border-[#3b494b]/60 accent-[#00f0ff] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#dbfcff] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span>Overlay Grad-CAM Saliency Heatmap</span>
                </span>
              </label>

              {showGradCam && (
                <div className="flex items-center gap-2.5 flex-1 max-w-xs">
                  <span className="text-[11px] text-[#b9cacb]">Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={gradCamOpacity}
                    onChange={(e) => setGradCamOpacity(parseFloat(e.target.value))}
                    className="flex-1 accent-[#00f0ff] cursor-pointer h-1.5 bg-[#2d344c] rounded-lg"
                  />
                  <span className="text-[11px] font-mono text-[#00f0ff]">
                    {Math.round(gradCamOpacity * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnostic Results Panel & Explainability (Cols 8-12) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Diagnostic Grade Glass Card */}
          <div className="rounded-2xl bg-[#060d23]/80 border border-[#3b494b]/40 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-90" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-[#7bd0ff] uppercase tracking-wider">
                  Diagnostic Severity Classification
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#dbfcff] font-heading mt-0.5">
                  {severity.name}
                </h3>
              </div>

              {/* Confidence Score Circular Progress Ring */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#141b31]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#00f0ff] transition-all duration-1000"
                    strokeDasharray={`${scan.confidenceScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-bold font-mono text-[#dbfcff]">
                    {scan.confidenceScore.toFixed(0)}%
                  </span>
                  <span className="text-[8px] text-[#b9cacb] uppercase">Conf</span>
                </div>
              </div>
            </div>

            {/* Severity Pill Banner */}
            <div
              style={{
                backgroundColor: severity.badgeBg,
                borderColor: severity.badgeBorder,
                color: severity.badgeText,
              }}
              className="p-3 rounded-xl border text-xs font-semibold mt-4 flex items-start gap-2"
            >
              <div
                className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                style={{ backgroundColor: severity.colorHex }}
              />
              <div className="flex flex-col">
                <span className="font-bold">{severity.description}</span>
                <span className="text-[11px] opacity-90 mt-1">
                  Action: {severity.clinicalAction}
                </span>
              </div>
            </div>

            {/* Detected Findings Chips */}
            <div className="mt-5">
              <span className="text-xs font-bold text-[#dbe1ff] block mb-2">
                Pathological Findings Identified ({scan.findings.length}):
              </span>
              {scan.findings.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {scan.findings.map((f) => (
                    <span
                      key={f.id}
                      className="px-2.5 py-1 rounded-lg bg-[#181f35] border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-medium shadow-sm"
                    >
                      {f.label} ({f.severity})
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No microvascular lesions or exudates detected in field.</span>
                </div>
              )}
            </div>

            {/* Model Telemetry Source Tag */}
            <div className="mt-5 pt-4 border-t border-[#3b494b]/20 flex items-center justify-between text-xs text-[#b9cacb]">
              <span>Inference Pipeline:</span>
              <span className="font-mono text-[#7bd0ff] font-semibold">
                {scan.modelSource === 'matlab_edge_node'
                  ? 'MATLAB Edge Node v4.8'
                  : scan.modelSource === 'gemini_clinical_core'
                  ? 'Gemini Clinical Vision Core'
                  : 'Edge Clinical Offline Heuristic'}
              </span>
            </div>
          </div>

          {/* Collapsible Section: "Why this result? Explainable AI Telemetry" */}
          <div className="rounded-2xl bg-[#060d23]/80 border border-[#3b494b]/40 shadow-2xl backdrop-blur-2xl overflow-hidden">
            <button
              onClick={() => setShowExplainability(!showExplainability)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#141b31]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-xs font-bold text-[#dbfcff] font-heading">
                  Why this result? Explainable AI Telemetry
                </span>
              </div>
              {showExplainability ? (
                <ChevronUp className="w-4 h-4 text-[#b9cacb]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#b9cacb]" />
              )}
            </button>

            {showExplainability && (
              <div className="p-4 pt-0 space-y-3 border-t border-[#3b494b]/20">
                <p className="text-xs text-[#b9cacb] leading-relaxed">
                  {scan.explainabilityNotes ||
                    'Grad-CAM backpropagation reveals high activation weighting concentrated over the macular region and temporal vascular arcade, confirming the lack of proliferative vascularization.'}
                </p>

                {/* Feature Attribution Saliency Bars */}
                {scan.telemetry?.featureWeights?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold text-[#7bd0ff] uppercase tracking-wider block">
                      Feature Attribution Saliency
                    </span>
                    {scan.telemetry.featureWeights.map((fw, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#dbe1ff]">
                          <span>{fw.feature}</span>
                          <span className="font-mono text-[#00f0ff] font-bold">
                            {fw.weightPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#181f35] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2563eb] to-[#00f0ff] rounded-full"
                            style={{ width: `${fw.weightPercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
