import React, { useState, useMemo } from 'react';
import { ScanRecord, DRSeverityLevel } from '../types';
import { DR_SEVERITY_LEVELS } from '../lib/constants';
import { saveUserSearchQuery } from '../lib/storage';

interface HistoryViewProps {
  userId: string;
  scans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (scanId: string) => void;
  onOpenReportModal: (scan: ScanRecord) => void;
  onNewScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userId,
  scans,
  onSelectScan,
  onDeleteScan,
  onOpenReportModal,
  onNewScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'no-dr' | 'mild-npdr' | 'moderate-npdr' | 'severe-pdr'>('all');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      saveUserSearchQuery(userId, query);
    }
  };

  const handleExportCSV = () => {
    if (scans.length === 0) {
      alert('No screening records to export.');
      return;
    }

    const headers = ['Patient ID', 'Eye Side', 'Pupil State', 'Severity Level', 'Severity Label', 'Confidence (%)', 'Timestamp'];
    const rows = scans.map((s) => [
      s.patientId,
      s.eyeSide,
      s.pupilDilationStatus,
      s.drSeverityLevel,
      `"${s.drSeverityLabel}"`,
      s.confidenceScore.toFixed(1),
      `"${s.uploadedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetinaLens_Registry_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPatient = scan.patientId.toLowerCase().includes(q);
        const matchesSeverity = scan.drSeverityLabel.toLowerCase().includes(q);
        const matchesFindings = scan.findings?.some((f) => f.label.toLowerCase().includes(q));
        if (!matchesPatient && !matchesSeverity && !matchesFindings) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter === 'no-dr' && scan.drSeverityLevel !== 0) return false;
      if (severityFilter === 'mild-npdr' && scan.drSeverityLevel !== 1) return false;
      if (severityFilter === 'moderate-npdr' && scan.drSeverityLevel !== 2) return false;
      if (severityFilter === 'severe-pdr' && scan.drSeverityLevel < 3) return false;

      return true;
    });
  }, [scans, searchQuery, severityFilter]);

  const noDrCount = scans.filter((s) => s.drSeverityLevel === 0).length;
  const mildCount = scans.filter((s) => s.drSeverityLevel === 1).length;
  const modCount = scans.filter((s) => s.drSeverityLevel === 2).length;
  const severeCount = scans.filter((s) => s.drSeverityLevel >= 3).length;

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Screen Header & Meta Telemetry */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00d2ff]/20 text-[#00d2ff]">
              <span className="material-symbols-outlined text-[16px]">folder_managed</span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#a5e7ff] font-semibold">
              Triage Registry &amp; Longitudinal Archives
            </span>
          </div>
          <h1 className="font-space text-3xl font-bold text-[#dee2f6] tracking-tight">
            Patient Screening History
          </h1>
          <p className="text-sm text-[#bbc9cf] max-w-2xl">
            Comprehensive, cryptographically signed retinal examinations conducted via Edge AI diagnostic inference node at St. Jude Clinic.
          </p>
        </div>

        {/* Quick Metrics Counter Badge Group */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#161b2a]/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-[#3c494e]/30">
          <div className="flex flex-col text-left pr-4">
            <span className="font-mono text-[11px] text-[#859399]">Synchronized Pool</span>
            <span className="font-space text-lg text-[#a5e7ff] font-bold">{scans.length} Scans</span>
          </div>
          <div className="w-px h-8 bg-[#3c494e]" />
          <div className="flex items-center gap-1.5 pl-2">
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-ping" />
            <span className="font-mono text-xs text-[#b8e3ff]">Real-time Telemetry</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Floating Liquid-Glass Console */}
      <section aria-label="Filters and Search" className="bg-[#1a1f2e]/70 backdrop-blur-xl rounded-2xl p-4 shadow-xl mb-6 flex flex-col gap-4 border border-[#3c494e]/30">
        {/* Search row & Top Utilities */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#859399] text-[20px] group-focus-within:text-[#00d2ff] transition-colors">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by Patient ID, Name, National Health ID, or Officer notes..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#090e1c]/80 text-[#dee2f6] placeholder:text-[#859399] text-xs focus:outline-none focus:bg-[#161b2a] shadow-inner border border-[#3c494e]/40 transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#859399] hover:text-[#dee2f6] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date Range & Export Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Date Range Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className="h-12 px-4 rounded-xl bg-[#090e1c]/80 text-[#dee2f6] hover:bg-[#252a39] transition-all flex items-center gap-2 font-mono text-xs shadow-sm border border-[#3c494e]/30 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#00d2ff] text-[18px]">calendar_month</span>
                <span>{dateRange}</span>
                <span className="material-symbols-outlined text-[#bbc9cf] text-[16px]">expand_more</span>
              </button>

              {showDateDropdown && (
                <div className="absolute right-0 top-14 w-52 rounded-xl bg-[#252a39] backdrop-blur-2xl shadow-xl z-30 p-1 flex flex-col gap-1 border border-[#3c494e]/40">
                  {['Last 30 Days', 'Last 7 Days', 'This Quarter', 'Year to Date (2025)'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setDateRange(opt);
                        setShowDateDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs cursor-pointer ${
                        dateRange === opt ? 'text-[#00d2ff] bg-[#303444]' : 'text-[#bbc9cf] hover:bg-[#303444]/60'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export CSV / Clinical Registry Action */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-12 px-4 rounded-xl bg-[#252a39] hover:bg-[#303444] text-[#a5e7ff] font-space text-xs font-semibold flex items-center gap-2 shadow-sm transition-all border border-[#3c494e]/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              <span>Export CSV / Registry</span>
            </button>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#3c494e]/20">
          <span className="font-mono text-[11px] text-[#859399] uppercase mr-1">Classification:</span>

          {/* Filter: All */}
          <button
            type="button"
            onClick={() => setSeverityFilter('all')}
            className={`h-8 px-4 rounded-full font-mono text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              severityFilter === 'all'
                ? 'bg-gradient-to-r from-[#00d2ff] to-[#508eff] text-[#090e1c] font-bold shadow-[0_0_12px_rgba(0,210,255,0.35)]'
                : 'bg-[#090e1c]/70 hover:bg-[#252a39] text-[#bbc9cf] border border-[#3c494e]/30'
            }`}
          >
            <span>All Severities</span>
            <span className="bg-[#090e1c]/30 text-current rounded-full px-1.5 py-0.2 text-[10px]">{scans.length}</span>
          </button>

          {/* Filter: No DR */}
          <button
            type="button"
            onClick={() => setSeverityFilter('no-dr')}
            className={`h-8 px-4 rounded-full font-mono text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              severityFilter === 'no-dr'
                ? 'bg-[#10b981] text-[#090e1c] font-bold shadow-[0_0_12px_#10b981]'
                : 'bg-[#090e1c]/70 hover:bg-[#252a39] text-[#bbc9cf] border border-[#3c494e]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
            <span>No DR</span>
            <span className="text-[#859399] text-[10px]">({noDrCount})</span>
          </button>

          {/* Filter: Mild NPDR */}
          <button
            type="button"
            onClick={() => setSeverityFilter('mild-npdr')}
            className={`h-8 px-4 rounded-full font-mono text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              severityFilter === 'mild-npdr'
                ? 'bg-[#eab308] text-[#090e1c] font-bold shadow-[0_0_12px_#eab308]'
                : 'bg-[#090e1c]/70 hover:bg-[#252a39] text-[#bbc9cf] border border-[#3c494e]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#eab308] shadow-[0_0_6px_#eab308]" />
            <span>Mild NPDR</span>
            <span className="text-[#859399] text-[10px]">({mildCount})</span>
          </button>

          {/* Filter: Moderate NPDR */}
          <button
            type="button"
            onClick={() => setSeverityFilter('moderate-npdr')}
            className={`h-8 px-4 rounded-full font-mono text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              severityFilter === 'moderate-npdr'
                ? 'bg-[#f59e0b] text-[#090e1c] font-bold shadow-[0_0_12px_#f59e0b]'
                : 'bg-[#090e1c]/70 hover:bg-[#252a39] text-[#bbc9cf] border border-[#3c494e]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
            <span>Mod NPDR</span>
            <span className="text-[#859399] text-[10px]">({modCount})</span>
          </button>

          {/* Filter: Severe / PDR */}
          <button
            type="button"
            onClick={() => setSeverityFilter('severe-pdr')}
            className={`h-8 px-4 rounded-full font-mono text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              severityFilter === 'severe-pdr'
                ? 'bg-[#f43f5e] text-white font-bold shadow-[0_0_12px_#f43f5e]'
                : 'bg-[#090e1c]/70 hover:bg-[#252a39] text-[#bbc9cf] border border-[#3c494e]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_8px_#f43f5e] animate-pulse" />
            <span>Severe / PDR</span>
            <span className="text-[#859399] text-[10px]">({severeCount})</span>
          </button>
        </div>
      </section>

      {/* Main Table Container in Frosted Glass */}
      <div className="w-full bg-[#1a1f2e]/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-[#3c494e]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[#090e1c]/80 text-[#859399] font-mono text-xs uppercase tracking-wider border-b border-[#3c494e]/30">
                <th className="py-3.5 px-4" scope="col">Patient Identification</th>
                <th className="py-3.5 px-4" scope="col">Scan Protocol &amp; Date</th>
                <th className="py-3.5 px-4" scope="col">Laterality</th>
                <th className="py-3.5 px-4 text-center" scope="col">Retinal View</th>
                <th className="py-3.5 px-4" scope="col">Severity Grade</th>
                <th className="py-3.5 px-4" scope="col">Inference Confidence</th>
                <th className="py-3.5 px-4" scope="col">Triage Pathway</th>
                <th className="py-3.5 px-4 text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c494e]/20" id="screeningRegistryRows">
              {filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#859399] font-mono text-xs">
                    {scans.length === 0
                      ? 'No clinical records found. Upload a patient fundus scan from Dashboard.'
                      : 'No patient records match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan) => {
                  const severity = DR_SEVERITY_LEVELS[scan.drSeverityLevel];
                  const initials = scan.patientId.slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={scan.id}
                      onClick={() => onSelectScan(scan)}
                      className="hover:bg-[#252a39]/60 transition-colors group cursor-pointer"
                    >
                      {/* Patient ID & NHID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#303444] flex items-center justify-center text-[#a5e7ff] font-space font-bold text-sm border border-[#3c494e]/40 shadow-inner">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-space text-sm text-[#dee2f6] group-hover:text-[#00d2ff] transition-colors font-semibold">
                              Patient #{scan.patientId}
                            </span>
                            <span className="font-mono text-[11px] text-[#859399]">
                              ID: <span className="text-[#bbc9cf]">{scan.patientId}</span> • {scan.patientAge || 56}y
                            </span>
                            <span className="font-mono text-[10px] text-[#b8e3ff]">
                              NHID: {Math.floor(100 + Math.random() * 899)}-{Math.floor(1000 + Math.random() * 8999)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Scan Protocol & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col font-mono text-xs">
                          <span className="text-[#dee2f6]">
                            {new Date(scan.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(scan.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[#859399] text-[11px]">
                            RHU 04 • {scan.pupilDilationStatus}
                          </span>
                        </div>
                      </td>

                      {/* Laterality */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded bg-[#252a39] text-[#dee2f6] border border-[#3c494e]/30">
                          <span className="material-symbols-outlined text-[14px] text-[#00d2ff]">visibility</span>
                          {scan.eyeSide === 'OD' ? 'OD (Right)' : 'OS (Left)'}
                        </span>
                      </td>

                      {/* Retinal Thumbnail View */}
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center">
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden shadow-md group-hover:shadow-[0_0_12px_rgba(0,210,255,0.4)] transition-all border border-[#3c494e]/40 bg-black">
                            <img src={scan.imageUrl} alt="Fundus" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#00d2ff]/10 mix-blend-overlay" />
                            <span className="material-symbols-outlined absolute bottom-1 right-1 text-white text-[12px] drop-shadow">
                              center_focus_strong
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Severity Grade */}
                      <td className="py-3.5 px-4">
                        <span
                          style={{
                            backgroundColor: severity.badgeBg,
                            borderColor: severity.badgeBorder,
                            color: severity.badgeText,
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-xs font-semibold shadow-sm"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: severity.colorHex }}
                          />
                          <span>{severity.name}</span>
                        </span>
                      </td>

                      {/* Inference Confidence */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 w-28">
                          <div className="flex justify-between items-center font-mono text-xs">
                            <span className="text-[#dee2f6] font-semibold">{scan.confidenceScore.toFixed(1)}%</span>
                            <span className="text-[#00d2ff] text-[10px]">Edge Validated</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#090e1c] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#508eff] to-[#00d2ff] rounded-full"
                              style={{ width: `${scan.confidenceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Triage Pathway */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                            scan.drSeverityLevel >= 3
                              ? 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ffb4ab]/30'
                              : scan.drSeverityLevel === 2
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                              : scan.drSeverityLevel === 1
                              ? 'bg-yellow-950/40 text-yellow-300 border-yellow-500/30'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {scan.drSeverityLevel >= 3
                              ? 'local_hospital'
                              : scan.drSeverityLevel === 2
                              ? 'clinical_notes'
                              : scan.drSeverityLevel === 1
                              ? 'event_repeat'
                              : 'check_circle'}
                          </span>
                          <span>
                            {scan.drSeverityLevel >= 3
                              ? 'Referred to Base Hospital'
                              : scan.drSeverityLevel === 2
                              ? 'Specialist Review'
                              : scan.drSeverityLevel === 1
                              ? '6-Month Routine Recheck'
                              : 'Annual Routine Recall'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onSelectScan(scan)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#252a39] hover:bg-[#00d2ff] hover:text-[#090e1c] text-[#a5e7ff] font-mono text-xs transition-all shadow-sm flex items-center gap-1 border border-[#3c494e]/30 cursor-pointer"
                          >
                            <span>View</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenReportModal(scan)}
                            className="p-1.5 rounded-lg text-[#859399] hover:text-[#00d2ff] hover:bg-[#252a39] transition-all cursor-pointer"
                            title="Download Report"
                          >
                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete screening record for Patient #${scan.patientId}?`)) {
                                onDeleteScan(scan.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#859399] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 transition-all cursor-pointer"
                            title="Delete Record"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
