import React, { useState, useMemo } from 'react';
import { ScanRecord, DRSeverityLevel } from '../types';
import { DR_SEVERITY_LEVELS } from '../lib/constants';
import { saveUserSearchQuery, getUserSearchHistory } from '../lib/storage';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  Trash2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

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
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eyeFilter, setEyeFilter] = useState<string>('all');

  const searchHistory = useMemo(() => getUserSearchHistory(userId), [userId, searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      saveUserSearchQuery(userId, query);
    }
  };

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPatient = scan.patientId.toLowerCase().includes(q);
        const matchesSeverity = scan.drSeverityLabel.toLowerCase().includes(q);
        const matchesFindings = scan.findings.some((f) => f.label.toLowerCase().includes(q));
        if (!matchesPatient && !matchesSeverity && !matchesFindings) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter !== 'all') {
        const level = parseInt(severityFilter, 10);
        if (scan.drSeverityLevel !== level) return false;
      }

      // Eye side filter
      if (eyeFilter !== 'all') {
        if (scan.eyeSide !== eyeFilter) return false;
      }

      return true;
    });
  }, [scans, searchQuery, severityFilter, eyeFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#dbfcff] tracking-tight font-heading">
            Clinical Screening History
          </h2>
          <p className="text-xs text-[#b9cacb] mt-1">
            Archived patient retinal telemetry and explainable grading records.
          </p>
        </div>

        <button
          onClick={onNewScan}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#00a6e0] text-[#002022] font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          + Upload New Retinal Scan
        </button>
      </div>

      {/* Search & Filter Bar (Glass controls from Google Stitch) */}
      <div className="p-4 rounded-2xl bg-[#060d23]/75 border border-[#3b494b]/40 backdrop-blur-xl flex flex-col gap-4">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-[#7bd0ff] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by Patient NHS ID, severity, or detected pathological findings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181f35]/80 border border-[#3b494b]/40 text-[#dbfcff] text-xs placeholder:text-[#849495]/70 focus:outline-none focus:border-[#00f0ff] focus:bg-[#222940] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-[#b9cacb] hover:text-[#dbfcff] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#3b494b]/20">
          <div className="flex items-center gap-1.5 text-xs text-[#b9cacb] mr-2">
            <Filter className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-semibold">Severity:</span>
          </div>

          {[
            { label: 'All Levels', value: 'all' },
            { label: 'Level 0 (No DR)', value: '0' },
            { label: 'Level 1 (Mild)', value: '1' },
            { label: 'Level 2 (Moderate)', value: '2' },
            { label: 'Level 3 (Severe)', value: '3' },
            { label: 'Level 4 (Proliferative)', value: '4' },
          ].map((chip) => (
            <button
              key={chip.value}
              onClick={() => setSeverityFilter(chip.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                severityFilter === chip.value
                  ? 'bg-[#00f0ff] text-[#002022] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'bg-[#181f35]/80 border border-[#3b494b]/40 text-[#b9cacb] hover:text-[#dbfcff]'
              }`}
            >
              {chip.label}
            </button>
          ))}

          <div className="h-4 w-px bg-[#3b494b]/40 mx-2 hidden sm:block" />

          {/* Eye Side Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEyeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                eyeFilter === 'all'
                  ? 'bg-[#222940] text-[#00f0ff]'
                  : 'text-[#b9cacb] hover:text-white'
              }`}
            >
              All Eyes
            </button>
            <button
              onClick={() => setEyeFilter('OD')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                eyeFilter === 'OD'
                  ? 'bg-[#222940] text-[#00f0ff]'
                  : 'text-[#b9cacb] hover:text-white'
              }`}
            >
              OD (Right)
            </button>
            <button
              onClick={() => setEyeFilter('OS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                eyeFilter === 'OS'
                  ? 'bg-[#222940] text-[#00f0ff]'
                  : 'text-[#b9cacb] hover:text-white'
              }`}
            >
              OS (Left)
            </button>
          </div>
        </div>
      </div>

      {/* Real Scans Table / Glass Rows (Strictly handles empty state gracefully without seeded dummy data!) */}
      {filteredScans.length === 0 ? (
        <div className="rounded-2xl p-10 bg-[#060d23]/50 border border-[#3b494b]/30 text-center flex flex-col items-center justify-center gap-3 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-xl bg-[#141b31] border border-[#3b494b]/40 flex items-center justify-center text-[#7bd0ff]">
            <Clock className="w-6 h-6 opacity-60" />
          </div>
          <span className="text-sm font-semibold text-[#dbfcff]">
            {scans.length === 0
              ? 'No scans recorded yet'
              : 'No patient records match the selected filter'}
          </span>
          <p className="text-xs text-[#b9cacb] max-w-sm">
            {scans.length === 0
              ? 'Once you complete a retinal screening upload, diagnostic telemetry and explainable gradings are preserved here.'
              : 'Try resetting your search query or severity filter to view more past records.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScans.map((scan) => {
            const severity = DR_SEVERITY_LEVELS[scan.drSeverityLevel];
            return (
              <div
                key={scan.id}
                className="group rounded-2xl bg-[#0b1228]/70 border border-[#3b494b]/40 hover:border-[#00f0ff]/40 p-4 transition-all duration-200 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg hover:shadow-[0_4px_20px_rgba(0,240,255,0.1)]"
              >
                {/* Left: Thumbnail & Patient Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#3b494b]/50 bg-black shrink-0">
                    <img src={scan.imageUrl} alt="Fundus" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#dbfcff] font-mono truncate">
                        {scan.patientId}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#181f35] text-[10px] font-mono text-[#7bd0ff]">
                        {scan.eyeSide} • {scan.pupilDilationStatus}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#849495] mt-0.5">
                      {new Date(scan.uploadedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Middle: Severity Badge & Confidence */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    style={{
                      backgroundColor: severity.badgeBg,
                      borderColor: severity.badgeBorder,
                      color: severity.badgeText,
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: severity.colorHex }}
                    />
                    <span>{severity.name}</span>
                  </div>

                  <span className="text-xs font-mono text-[#00f0ff] font-semibold">
                    Conf: {scan.confidenceScore.toFixed(1)}%
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onOpenReportModal(scan)}
                    className="p-2 rounded-xl bg-[#181f35]/80 hover:bg-[#222940] border border-[#3b494b]/40 text-[#7bd0ff] hover:text-[#00f0ff] text-xs transition-colors cursor-pointer"
                    title="Download Diagnostic Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectScan(scan)}
                    className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/40 text-[#00f0ff] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Remove record for patient ${scan.patientId}?`)) {
                        onDeleteScan(scan.id);
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-[#93000a]/20 text-[#b9cacb] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
