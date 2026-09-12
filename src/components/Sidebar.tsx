import React from 'react';
import { RetinaLensLogo } from './RetinaLensLogo';
import { ClinicianUser, ActiveView } from '../types';
import {
  UploadCloud,
  Clock,
  Search,
  LogOut,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentUser: ClinicianUser;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`relative z-20 flex flex-col justify-between h-full bg-[#0b1228]/85 border-r border-[#3b494b]/30 backdrop-blur-2xl transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Section: Brand & Nav */}
      <div className="flex flex-col p-4">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-6 border-b border-[#3b494b]/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <RetinaLensLogo size={isCollapsed ? 'sm' : 'md'} />
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-lg text-[#dbfcff] tracking-tight">
                  RetinaLens
                </span>
                <span className="text-[10px] text-[#7bd0ff] font-semibold tracking-wider uppercase">
                  Clinical AI Core
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-[#181f35] text-[#b9cacb] hover:text-[#dbfcff] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-2 mt-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_16px_rgba(0,240,255,0.2)]'
                : 'text-[#b9cacb] hover:text-[#dbfcff] hover:bg-[#181f35]/60'
            }`}
            title="New Scan"
          >
            <UploadCloud className="w-4 h-4 shrink-0 text-[#00f0ff]" />
            {!isCollapsed && <span>New Scan</span>}
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_16px_rgba(0,240,255,0.2)]'
                : 'text-[#b9cacb] hover:text-[#dbfcff] hover:bg-[#181f35]/60'
            }`}
            title="History & Search"
          >
            <Clock className="w-4 h-4 shrink-0 text-[#7bd0ff]" />
            {!isCollapsed && <span>History & Scans</span>}
          </button>
        </nav>
      </div>

      {/* Bottom Section: Clinician Profile & Logout */}
      <div className="p-4 border-t border-[#3b494b]/20">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-[#141b31]/70 border border-[#3b494b]/30 mb-3 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#222940] border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] font-bold text-xs shrink-0">
            {currentUser.displayName.slice(0, 2).toUpperCase()}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col truncate flex-1 min-w-0">
              <span className="text-xs font-bold text-[#dbfcff] truncate">
                {currentUser.displayName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    currentUser.isGuest ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                  }`}
                />
                <span className="text-[10px] text-[#b9cacb] truncate font-medium">
                  {currentUser.isGuest ? 'Guest Triage' : currentUser.clinicId || 'Clinician'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#ffb4ab] hover:bg-[#93000a]/20 border border-transparent hover:border-[#ffb4ab]/30 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};
