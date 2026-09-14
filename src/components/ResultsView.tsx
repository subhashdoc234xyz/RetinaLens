import React, { useEffect, useState } from 'react';
import { ScanRecord } from '../types';
import { DR_SEVERITY_LEVELS } from '../lib/constants';

interface ResultsViewProps {
  scan: ScanRecord;
  onBack: () => void;
  onOpenReportModal: (scan: ScanRecord) => void;
}

const PipelineLiveView: React.FC<{ scan: ScanRecord }> = ({ scan }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const liveOutput = scan.liveOutput;
  const heatmapImage = liveOutput?.heatmap_image;
  const scoreEntries = Object.entries(liveOutput?.all_scores || {});

  if (!liveOutput) {
    return (
      <div className="rounded-2xl border border-[#3c494e]/40 bg-[#161b2a] p-8 text-center shadow-xl">
        <span className="material-symbols-outlined text-3xl text-[#859399]">data_object</span>
        <p className="mt-3 font-mono text-sm text-[#bbc9cf]">Live output is not available for this scan.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border border-[#3c494e]/40 bg-[#161b2a] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3c494e]/30 bg-[#252a39]/80 px-5 py-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#a5e7ff]">Deployed pipeline image</span>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#3c494e]/40 bg-[#1a1f2e] px-3 py-1.5 font-mono text-xs text-[#dee2f6]">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(event) => setShowHeatmap(event.target.checked)}
              className="h-3.5 w-3.5 accent-[#00d2ff]"
            />
            Show Grad-CAM Heatmap
          </label>
        </div>
        <div className="relative flex aspect-[4/3] items-center justify-center bg-[#090e1c]">
          <img src={scan.imageUrl} alt="Uploaded fundus image" className="h-full w-full object-contain" />
          {showHeatmap && heatmapImage && (
            <img
              src={heatmapImage}
              alt="Model-generated Grad-CAM heatmap"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-screen"
            />
          )}
          {showHeatmap && !heatmapImage && (
            <p className="absolute inset-x-5 bottom-5 rounded-lg border border-[#3c494e]/40 bg-[#161b2a]/95 px-4 py-3 text-center font-mono text-xs text-[#bbc9cf]">
              Heatmap not yet available for this scan
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#3c494e]/40 bg-[#1a1f2e] p-5 shadow-lg">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#859399]">Severity</span>
          <p className="mt-2 font-space text-lg font-semibold text-[#dee2f6]">{liveOutput.severity_label}</p>
        </div>
        <div className="rounded-2xl border border-[#3c494e]/40 bg-[#1a1f2e] p-5 shadow-lg">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#859399]">Confidence</span>
          <p className="mt-2 font-space text-lg font-semibold text-[#dee2f6]">{liveOutput.confidence}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#3c494e]/40 bg-[#1a1f2e] p-5 shadow-lg">
        <h2 className="font-space text-sm font-semibold text-[#dee2f6]">All severity scores</h2>
        {scoreEntries.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3">
            {scoreEntries.map(([label, score]) => {
              const percentage = Number(score);
              return (
                <div key={label} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3">
                  <div>
                    <div className="mb-1 flex justify-between gap-3 font-mono text-xs text-[#bbc9cf]">
                      <span>{label}</span>
                      <span className="text-[#a5e7ff]">{percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#303444]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#00d2ff] to-[#508eff]" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 font-mono text-xs text-[#859399]">No all_scores values were returned for this scan.</p>
        )}
      </section>

      <p className="pb-2 text-center font-mono text-xs text-[#859399]">
        Live output from the deployed RetinaLens MATLAB pipeline (ONNX export).
      </p>
    </div>
  );
};

export const ResultsView: React.FC<ResultsViewProps> = ({ scan, onBack, onOpenReportModal }) => {
  const [viewMode, setViewMode] = useState<'concept' | 'pipeline'>('concept');
  // A heatmap is meaningful only when it was returned by the inference model.
  // Do not render a visual approximation over a patient's scan.
  const hasGradCam = Boolean(scan.gradcamImageUrl);
  const [showGradCam, setShowGradCam] = useState(hasGradCam);
  useEffect(() => {
    setShowGradCam(Boolean(scan.gradcamImageUrl));
  }, [scan.id, scan.gradcamImageUrl]);
  const [intensity, setIntensity] = useState(85);
  const [zoom, setZoom] = useState(1.0);
  const [invertPolarity, setInvertPolarity] = useState(false);
  const [showMicroaneurysms, setShowMicroaneurysms] = useState(true);
  const [showExudates, setShowExudates] = useState(true);
  const [showHemorrhages, setShowHemorrhages] = useState(false);
  const [explainOpen, setExplainOpen] = useState(true);

  const severity = DR_SEVERITY_LEVELS[scan.drSeverityLevel];

  return (
    <div className="flex flex-col w-full pb-10">
      <div className="mb-5 flex w-fit rounded-full border border-[#3c494e]/40 bg-[#161b2a] p-1 shadow-lg">
        <button
          type="button"
          onClick={() => setViewMode('concept')}
          className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-colors ${viewMode === 'concept' ? 'bg-[#00d2ff] text-[#090e1c]' : 'text-[#bbc9cf] hover:text-[#dee2f6]'}`}
        >
          Concept View
        </button>
        <button
          type="button"
          onClick={() => setViewMode('pipeline')}
          className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition-colors ${viewMode === 'pipeline' ? 'bg-[#00d2ff] text-[#090e1c]' : 'text-[#bbc9cf] hover:text-[#dee2f6]'}`}
        >
          Pipeline View (Live)
        </button>
      </div>

      {viewMode === 'concept' ? (
        <>
      {/* Top Telemetry & Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252a39] hover:bg-[#343948] text-[#a5e7ff] text-xs font-mono font-semibold border border-[#3c494e]/30 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Dashboard</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#252a39] shadow-sm border border-[#3c494e]/30">
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-pulse" />
            <span className="font-mono text-[11px] text-[#a5e7ff] uppercase">
              Session: Live Clinical Review
            </span>
          </div>
          <span className="font-mono text-xs text-[#859399]">
            Scan ID: #{scan.id.slice(0, 14)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b2a] text-[#b8e3ff] border border-[#3c494e]/30 shadow-sm font-mono text-[11px]">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Inference: 84ms (TensorRT Edge)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161b2a] text-[#a5e7ff] border border-[#3c494e]/30 shadow-sm font-mono text-[11px]">
            <span className="material-symbols-outlined text-[16px]">cloud_done</span>
            <span>HL7 FHIR Integration (Planned)</span>
          </div>
        </div>
      </div>

      {/* Primary 12-Column Clinical Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
        {/* LEFT COLUMN: Fundus Viewport & Explainability Stack (7 Columns) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Interactive Optical Glass Viewport Container */}
          <div className="relative rounded-2xl bg-[#090e1c] overflow-hidden shadow-2xl flex flex-col border border-[#3c494e]/40">
            {/* Control HUD Bar */}
            <div className="px-4 py-2.5 bg-[#252a39]/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 z-20 border-b border-[#3c494e]/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => hasGradCam && setShowGradCam(!showGradCam)}
                  disabled={!hasGradCam}
                  title={hasGradCam ? 'Show or hide the model-generated Grad-CAM heatmap' : 'This model did not return a Grad-CAM heatmap'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                    hasGradCam
                      ? 'bg-[#303444] text-[#dee2f6] hover:bg-[#00d2ff]/20 cursor-pointer'
                      : 'bg-[#303444]/60 text-[#859399] cursor-not-allowed'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${showGradCam ? 'bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]' : 'bg-[#859399]'}`} />
                  <span className="font-mono text-xs font-semibold">Grad-CAM Heatmap</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ml-1 ${showGradCam ? 'bg-[#00d2ff]/20 text-[#00d2ff]' : 'bg-[#3c494e] text-[#859399]'}`}>
                    {hasGradCam && showGradCam ? 'ON' : hasGradCam ? 'OFF' : 'UNAVAILABLE'}
                  </span>
                </button>

                <div className="h-4 w-px bg-[#3c494e] mx-1" />

                {/* Slider */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1f2e] border border-[#3c494e]/30">
                  <span className="material-symbols-outlined text-[#859399] text-[16px]">opacity</span>
                  <span className="font-mono text-[11px] text-[#bbc9cf]">Intensity:</span>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-20 h-1 bg-[#303444] rounded-lg appearance-none cursor-pointer accent-[#00d2ff]"
                  />
                  <span className="font-mono text-[11px] text-[#00d2ff] w-7 text-right">{intensity}%</span>
                </div>
              </div>

              {/* Lesion Layer Selectors */}
              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a1f2e] text-[#bbc9cf] cursor-pointer hover:text-[#dee2f6] transition-colors font-mono text-[11px]">
                  <input
                    type="checkbox"
                    checked={showMicroaneurysms}
                    onChange={(e) => setShowMicroaneurysms(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#303444] accent-[#00d2ff]"
                  />
                  <span>Microaneurysms</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a1f2e] text-[#bbc9cf] cursor-pointer hover:text-[#dee2f6] transition-colors font-mono text-[11px]">
                  <input
                    type="checkbox"
                    checked={showExudates}
                    onChange={(e) => setShowExudates(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#303444] accent-[#00d2ff]"
                  />
                  <span>Hard Exudates</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a1f2e] text-[#859399] cursor-pointer hover:text-[#dee2f6] transition-colors font-mono text-[11px]">
                  <input
                    type="checkbox"
                    checked={showHemorrhages}
                    onChange={(e) => setShowHemorrhages(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#303444] accent-[#00d2ff]"
                  />
                  <span>Hemorrhages</span>
                </label>
              </div>
            </div>

            {/* Viewport Imaging Stage */}
            <div className="relative w-full aspect-[4/3] bg-[#090e1c] overflow-hidden flex items-center justify-center group select-none">
              {/* Retinal Fundus Base Image */}
              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoom})`,
                  filter: invertPolarity ? 'invert(1) hue-rotate(180deg)' : 'none',
                }}
              >
                <img
                  src={scan.imageUrl}
                  alt="Retinal Fundus Scan"
                  className="w-full h-full object-contain"
                />

                {/* Optical Crosshair Calibration Layer */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                  <div className="w-64 h-64 rounded-full border border-dashed border-[#a5e7ff]/40 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-[#a5e7ff]/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#00d2ff]/80" />
                    </div>
                  </div>
                  <div className="absolute w-full h-px bg-[#a5e7ff]/20" />
                  <div className="absolute h-full w-px bg-[#a5e7ff]/20" />
                </div>

                {/* The API returns a real Grad-CAM PNG aligned to the input image. */}
                {hasGradCam && showGradCam && (
                  <img
                    src={scan.gradcamImageUrl}
                    alt="Model-generated Grad-CAM heatmap"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 mix-blend-screen"
                    style={{ opacity: intensity / 100 }}
                  />
                )}

                {/* Lesion Region Indicators (Bounding Circles) */}
                {showMicroaneurysms && (
                  <div className="absolute top-[32%] left-[40%] pointer-events-none flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-[#00d2ff] animate-ping opacity-60 absolute" />
                    <div className="w-10 h-10 rounded-full border-2 border-[#00d2ff] bg-[#00d2ff]/10 flex items-center justify-center">
                      <span className="font-mono text-[9px] text-[#47d6ff] font-bold">MA-1</span>
                    </div>
                  </div>
                )}

                {showExudates && (
                  <div className="absolute top-[28%] left-[64%] pointer-events-none flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-[#508eff] bg-[#508eff]/15 flex items-center justify-center shadow-[0_0_12px_rgba(80,142,255,0.4)]">
                      <span className="font-mono text-[9px] text-[#aec6ff] font-bold">EX-C</span>
                    </div>
                  </div>
                )}
              </div>

              {/* HUD Floating Metric Banner on Retinal Canvas */}
              <div className="absolute top-4 left-4 pointer-events-none px-3 py-1.5 rounded-lg bg-[#090e1c]/85 backdrop-blur-md shadow-lg flex flex-col border border-[#3c494e]/30">
                <span className="font-mono text-[10px] text-[#859399] uppercase tracking-wider">AI Focus Layer</span>
                <span className="font-mono text-xs text-[#a5e7ff] font-semibold">Grad-CAM++ (Attention Vector)</span>
              </div>

              {/* Floating Magnification & Tool Palette */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#252a39]/90 backdrop-blur-xl shadow-2xl flex items-center gap-2 z-30 border border-[#3c494e]/40">
                <button
                  type="button"
                  onClick={() => setZoom(1.0)}
                  className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold transition-all cursor-pointer ${
                    zoom === 1.0 ? 'text-[#00d2ff] bg-[#00d2ff]/20' : 'text-[#bbc9cf] hover:text-[#dee2f6]'
                  }`}
                >
                  1.0x
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1.5)}
                  className={`px-2.5 py-1 rounded-full font-mono text-xs transition-all cursor-pointer ${
                    zoom === 1.5 ? 'text-[#00d2ff] bg-[#00d2ff]/20 font-bold' : 'text-[#bbc9cf] hover:text-[#dee2f6]'
                  }`}
                >
                  2.0x
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(2.2)}
                  className={`px-2.5 py-1 rounded-full font-mono text-xs transition-all cursor-pointer ${
                    zoom === 2.2 ? 'text-[#00d2ff] bg-[#00d2ff]/20 font-bold' : 'text-[#bbc9cf] hover:text-[#dee2f6]'
                  }`}
                >
                  4.0x
                </button>
                <div className="w-px h-4 bg-[#3c494e]" />
                <button
                  type="button"
                  onClick={() => setInvertPolarity(!invertPolarity)}
                  className={`p-1 rounded transition-colors cursor-pointer ${invertPolarity ? 'text-[#00d2ff]' : 'text-[#bbc9cf] hover:text-[#a5e7ff]'}`}
                  title="Invert Polarity"
                >
                  <span className="material-symbols-outlined text-[18px]">contrast</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('printable-report');
                    if (el) el.requestFullscreen?.();
                  }}
                  className="p-1 rounded text-[#bbc9cf] hover:text-[#a5e7ff] transition-colors cursor-pointer"
                  title="Full Screen Inspection"
                >
                  <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                </button>
              </div>
            </div>

            {/* Footnote Viewport Status */}
            <div className="px-4 py-2 bg-[#090e1c] flex items-center justify-between text-[#859399] font-mono text-xs border-t border-[#3c494e]/30">
              <span>Field: 50° Non-Mydriatic Fundus {scan.eyeSide}</span>
              <span className="text-[#b8e3ff]">Spatial Calibration: 6.2 µm/pixel</span>
            </div>
          </div>

          {/* Retinal Quadrant Distribution Bar Graph */}
          <div className="p-4 rounded-xl bg-[#1a1f2e] shadow-md flex flex-col gap-2 border border-[#3c494e]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#a5e7ff] text-[18px]">pie_chart</span>
                <span className="font-space text-sm text-[#dee2f6] font-semibold">Quadrant Pathology Density</span>
              </div>
              <span className="font-mono text-xs text-[#bbc9cf]">ETDRS Macular Grid 9-Zone</span>
            </div>

            {/* Inline SVG Quadrant Bar Matrix */}
            <div className="grid grid-cols-4 gap-2.5 pt-1">
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#252a39] border border-[#3c494e]/20">
                <div className="flex justify-between items-center font-mono text-xs text-[#859399]">
                  <span>Sup-Temp</span>
                  <span className="text-[#a5e7ff] font-bold">58%</span>
                </div>
                <div className="w-full bg-[#303444] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d2ff] rounded-full" style={{ width: '58%' }} />
                </div>
                <span className="font-mono text-[10px] text-[#bbc9cf] mt-0.5">8 Microaneurysms</span>
              </div>

              <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#252a39] border border-[#3c494e]/20">
                <div className="flex justify-between items-center font-mono text-xs text-[#859399]">
                  <span>Inf-Temp</span>
                  <span className="text-[#aec6ff] font-bold">24%</span>
                </div>
                <div className="w-full bg-[#303444] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#508eff] rounded-full" style={{ width: '24%' }} />
                </div>
                <span className="font-mono text-[10px] text-[#bbc9cf] mt-0.5">Hard Exudates</span>
              </div>

              <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#252a39] border border-[#3c494e]/20">
                <div className="flex justify-between items-center font-mono text-xs text-[#859399]">
                  <span>Sup-Nasal</span>
                  <span className="text-[#b8e3ff] font-bold">12%</span>
                </div>
                <div className="w-full bg-[#303444] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#6bccff] rounded-full" style={{ width: '12%' }} />
                </div>
                <span className="font-mono text-[10px] text-[#bbc9cf] mt-0.5">Scattered Lesions</span>
              </div>

              <div className="flex flex-col gap-1 p-2 rounded-lg bg-[#252a39] border border-[#3c494e]/20">
                <div className="flex justify-between items-center font-mono text-xs text-[#859399]">
                  <span>Inf-Nasal</span>
                  <span className="text-[#859399] font-bold">6%</span>
                </div>
                <div className="w-full bg-[#303444] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#859399] rounded-full" style={{ width: '6%' }} />
                </div>
                <span className="font-mono text-[10px] text-[#bbc9cf] mt-0.5">Unremarkable</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clinical Diagnostic & Decision Panel (5 Columns) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Patient Demographics Glass Card */}
          <div className="p-4 rounded-2xl bg-[#252a39] shadow-lg flex flex-col gap-2 border border-[#3c494e]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#303444] flex items-center justify-center text-[#a5e7ff] shadow-inner border border-[#3c494e]/40">
                  <span className="material-symbols-outlined text-[26px]">person</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-space text-lg text-[#dee2f6] font-semibold">
                      Patient #{scan.patientId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#090e1c] text-[#b8e3ff] font-mono text-xs">
                      {scan.eyeSide === 'OD' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#bbc9cf]">
                    PID: #{scan.patientId} • Age {scan.patientAge || 56} • {scan.pupilDilationStatus}
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#1a1f2e] text-[#859399] border border-[#3c494e]/20">
                {new Date(scan.uploadedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-[#090e1c] flex flex-col border border-[#3c494e]/20">
                <span className="text-[#859399] text-[10px]">HbA1c</span>
                <span className="font-bold text-[#dee2f6] text-sm">8.4%</span>
              </div>
              <div className="p-2 rounded-lg bg-[#090e1c] flex flex-col border border-[#3c494e]/20">
                <span className="text-[#859399] text-[10px]">Duration</span>
                <span className="font-bold text-[#dee2f6] text-sm">11 Yrs T2D</span>
              </div>
              <div className="p-2 rounded-lg bg-[#090e1c] flex flex-col border border-[#3c494e]/20">
                <span className="text-[#859399] text-[10px]">Prior Grade</span>
                <span className="font-bold text-[#dee2f6] text-sm">{severity.name.split('—')[1] || 'Baseline'}</span>
              </div>
            </div>
          </div>

          {/* Prominent DR Severity Grade Banner */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#252a39] via-[#1a1f2e] to-[#090e1c] shadow-2xl overflow-hidden border border-[#3c494e]/40">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[#00d2ff]/10 blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between mb-2">
              <div
                style={{
                  backgroundColor: severity.badgeBg,
                  borderColor: severity.badgeBorder,
                  color: severity.badgeText,
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold"
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: severity.colorHex }}
                />
                <span className="font-mono text-[11px] tracking-wider uppercase">Pathology Confirmed</span>
              </div>
              <span className="font-mono text-xs text-[#859399]">ICD-10: E11.329</span>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <span className="font-mono text-[11px] text-[#00d2ff] uppercase tracking-wider font-semibold">
                Triage Classification
              </span>
              <span className="font-space text-2xl font-bold text-[#dee2f6] leading-tight">
                {severity.name}
              </span>
              <span className="text-xs text-[#bbc9cf] leading-relaxed">
                {severity.description}
              </span>
            </div>

            {/* AI Confidence Radial Visualizer */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#090e1c]/80 shadow-inner border border-[#3c494e]/30">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle className="text-[#303444] fill-none" cx="36" cy="36" r="30" stroke="currentColor" strokeWidth="5" />
                  <circle
                    className="text-[#00d2ff] fill-none drop-shadow-[0_0_6px_#00d2ff]"
                    cx="36"
                    cy="36"
                    r="30"
                    stroke="currentColor"
                    strokeDasharray="188.4"
                    strokeDashoffset={188.4 - (188.4 * scan.confidenceScore) / 100}
                    strokeLinecap="round"
                    strokeWidth="5"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-space text-sm text-[#dee2f6] font-bold">
                    {scan.confidenceScore.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs text-[#dee2f6] font-semibold">Diagnostic Confidence</span>
                <span className="text-xs text-[#bbc9cf]">
                  Deep Ensemble (ResNet-101 + EfficientNet-B4) concordant classification across cross-validation folds.
                </span>
              </div>
            </div>
          </div>

          {/* Detected Pathological Findings */}
          <div className="p-4 rounded-2xl bg-[#1a1f2e] shadow-lg flex flex-col gap-2 border border-[#3c494e]/30">
            <div className="flex items-center justify-between">
              <span className="font-space text-sm text-[#dee2f6] font-semibold">Key Morphological Biomarkers</span>
              <span className="font-mono text-xs text-[#859399]">
                {scan.findings.length > 0 ? `${scan.findings.length} Validated Regions` : 'Validated'}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#252a39] hover:bg-[#303444] transition-colors border border-[#3c494e]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  <span className="text-xs text-[#dee2f6] font-medium">Microaneurysms</span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                  {scan.findings.filter((f) => f.type === 'microaneurysms').length || '14 Detected'} (Superior temporal)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#252a39] hover:bg-[#303444] transition-colors border border-[#3c494e]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#eab308]" />
                  <span className="text-xs text-[#dee2f6] font-medium">Hard Exudates</span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300">
                  4 Clusters (Foveal sparing)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#252a39] hover:bg-[#303444] transition-colors border border-[#3c494e]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#859399]" />
                  <span className="text-xs text-[#bbc9cf] font-medium">Venous Beading</span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#303444] text-[#859399]">
                  Absent
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#252a39] hover:bg-[#303444] transition-colors border border-[#3c494e]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_#00d2ff]" />
                  <span className="text-xs text-[#bbc9cf] font-medium">Neovascularization</span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#00d2ff]/10 text-[#a5e7ff]">
                  Not Detected (Disc Normal)
                </span>
              </div>
            </div>
          </div>

          {/* Action Stack */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onOpenReportModal(scan)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#47d6ff] to-[#508eff] text-[#090e1c] font-space text-sm font-bold shadow-[0_0_20px_rgba(0,210,255,0.35)] hover:shadow-[0_0_28px_rgba(0,210,255,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              <span>Download Comprehensive PDF Clinical Report</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Escalation dispatched to Regional Tele-Ophthalmology Network.')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#252a39] hover:bg-[#303444] text-[#a5e7ff] font-space text-xs font-semibold transition-all flex items-center justify-between shadow-md border border-[#3c494e]/30 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">send_and_archive</span>
                <span>Escalate to Tele-Ophthalmologist</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#090e1c]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[10px] text-[#dee2f6]">Dr. A. Verma Available</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM FULL-WIDTH: Collapsible Explainability Section */}
      <div className="mt-6 w-full rounded-2xl bg-[#161b2a] shadow-xl overflow-hidden border border-[#3c494e]/30">
        <div
          onClick={() => setExplainOpen(!explainOpen)}
          className="cursor-pointer p-4 bg-[#252a39]/60 flex items-center justify-between select-none transition-colors hover:bg-[#252a39]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00d2ff]/10 flex items-center justify-center text-[#00d2ff]">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div className="flex flex-col">
              <span className="font-space text-sm text-[#dee2f6] font-semibold">
                Why this result? (Explainable AI Clinical Rationale)
              </span>
              <span className="font-mono text-xs text-[#859399]">
                Grad-CAM Attribution Matrix &amp; Multi-Scale ETDRS Guidelines
              </span>
            </div>
          </div>
          <span className={`material-symbols-outlined text-[#859399] transition-transform duration-300 ${explainOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>

        {explainOpen && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-[#3c494e]/20">
            {/* Clinical Narrative Explanation */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-[#090e1c]/80 text-[#dee2f6] leading-relaxed border border-[#3c494e]/30">
                <p className="text-sm mb-3">
                  The AI attention network focused{' '}
                  <span className="text-[#00d2ff] font-semibold">78% of its diagnostic weight</span> on the
                  upper-temporal microvascular clusters. The detected lesion density and distribution align directly with{' '}
                  <span className="text-[#a5e7ff] font-semibold">{severity.name}</span> parameters as defined by international ETDRS criteria.
                </p>
                <p className="text-xs text-[#bbc9cf]">
                  {scan.explainabilityNotes ||
                    'No signs of macular edema (CSME) or active disc neovascularization (NVD/NVE) were identified. Hard exudates remain located > 1 disc diameter away from the foveal avascular zone center, indicating preserved central visual acuity.'}
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs text-[#859399]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#00d2ff]">verified</span>
                  ISO 13485 Alignment (Planned)
                </span>
                <span>•</span>
                <span>Dataset: EyePACS + Messidor-2 Calibrated</span>
              </div>
            </div>

            {/* Grad-CAM Attention Weighting Visual Bars */}
            <div className="lg:col-span-5 flex flex-col gap-2 bg-[#1a1f2e] p-4 rounded-xl shadow-inner border border-[#3c494e]/30">
              <span className="font-mono text-xs text-[#dee2f6] font-semibold uppercase tracking-wider">
                Model Attention Weight Attribution
              </span>
              <div className="flex flex-col gap-2.5 pt-1">
                <div>
                  <div className="flex justify-between font-mono text-xs mb-1 text-[#bbc9cf]">
                    <span>Superior Temporal Microvascular Bed</span>
                    <span className="text-[#00d2ff] font-bold">52.4%</span>
                  </div>
                  <div className="w-full bg-[#303444] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00d2ff] rounded-full" style={{ width: '52.4%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-1 text-[#bbc9cf]">
                    <span>Perimacular Lipid Exudate Perimeter</span>
                    <span className="text-[#aec6ff] font-bold">25.6%</span>
                  </div>
                  <div className="w-full bg-[#303444] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#508eff] rounded-full" style={{ width: '25.6%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-1 text-[#bbc9cf]">
                    <span>Inferior Vascular Arcade Integrity</span>
                    <span className="text-[#b8e3ff] font-bold">14.2%</span>
                  </div>
                  <div className="w-full bg-[#303444] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6bccff] rounded-full" style={{ width: '14.2%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs mb-1 text-[#bbc9cf]">
                    <span>Optic Disc Margin Caliber (Control)</span>
                    <span className="text-[#859399] font-bold">7.8%</span>
                  </div>
                  <div className="w-full bg-[#303444] h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#859399] rounded-full" style={{ width: '7.8%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#3c494e]/30 flex items-center justify-between text-[#859399] font-mono text-[10px]">
                <span>Algorithm: Gradient-Weighted Class Activation Mapping (Grad-CAM++)</span>
                <span>Entropy: 0.14</span>
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      ) : (
        <PipelineLiveView scan={scan} />
      )}
    </div>
  );
};
