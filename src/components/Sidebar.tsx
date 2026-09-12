import React from 'react';
import { ClinicianUser, ActiveView } from '../types';

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
      className={`fixed left-0 top-0 h-full bg-[#090e1c]/80 backdrop-blur-xl z-50 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] border-r border-[#3c494e]/30 transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col">
        {/* Header Branding */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#3c494e]/20">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <img
              src="/assets/retinalens_logo.png"
              alt="RetinaLens Logo"
              className="h-8 w-auto object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-space text-xl text-[#a5e7ff] tracking-tight font-bold">
                  Retina<span className="text-[#00d2ff]">Lens</span>
                </span>
                <span className="font-mono text-[11px] text-[#b8e3ff] uppercase tracking-wider font-medium">
                  Clinical AI
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-[#859399] hover:text-[#a5e7ff] hover:bg-[#252a39] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* New Scan CTA Button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#47d6ff] to-[#508eff] text-[#001a43] shadow-[0_0_20px_rgba(0,210,255,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer ${
              isCollapsed ? 'p-2' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            {!isCollapsed && <span className="font-space text-sm font-bold">New Scan</span>}
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex flex-col gap-1 px-4 pt-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-[#252a39] text-[#a5e7ff] font-bold shadow-[0_0_12px_rgba(0,210,255,0.15)] border border-[#00d2ff]/30'
                : 'text-[#bbc9cf] hover:bg-[#252a39]/60 hover:text-[#dee2f6]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            {!isCollapsed && <span>Main Dashboard</span>}
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-[#252a39] text-[#a5e7ff] font-bold shadow-[0_0_12px_rgba(0,210,255,0.15)] border border-[#00d2ff]/30'
                : 'text-[#bbc9cf] hover:bg-[#252a39]/60 hover:text-[#dee2f6]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">manage_search</span>
            {!isCollapsed && <span>History &amp; Search</span>}
          </button>

          <button
            onClick={() => onNavigate('results')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
              activeView === 'results'
                ? 'bg-[#252a39] text-[#a5e7ff] font-bold shadow-[0_0_12px_rgba(0,210,255,0.15)] border border-[#00d2ff]/30'
                : 'text-[#bbc9cf] hover:bg-[#252a39]/60 hover:text-[#dee2f6]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">assignment</span>
            {!isCollapsed && <span>Scan Results / Reports</span>}
          </button>
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-4 flex flex-col gap-2 border-t border-[#3c494e]/20">
        <button
          onClick={onLogout}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-[#ffb4ab] hover:bg-[#93000a]/20 hover:text-[#ffdad6] transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {!isCollapsed && <span className="font-mono font-medium">Log Out</span>}
        </button>

        {!isCollapsed && (
          <div className="px-4 py-2 rounded-lg bg-[#1a1f2e]/60 border border-[#3c494e]/20">
            <span className="font-mono text-[11px] text-[#859399] block">
              v2.4 Clinical Explainability Suite
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
