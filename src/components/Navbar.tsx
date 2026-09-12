import React from 'react';
import { RetinaLensLogo } from './RetinaLensLogo';
import { ClinicianUser, ActiveView } from '../types';
import { LogOut, User, Activity, PlusCircle, Clock, Lock } from 'lucide-react';

interface NavbarProps {
  currentUser: ClinicianUser | null;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
  edgeNodesOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onLogout,
  edgeNodesOnline = true,
}) => {
  return (
    <header className="relative z-20 w-full flex items-center justify-between px-6 sm:px-12 lg:px-16 py-5 border-b border-[#3b494b]/20 bg-[#060d23]/40 backdrop-blur-md">
      {/* Brand logo + Name */}
      <button
        onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
        className="flex items-center gap-3.5 group text-left cursor-pointer transition-transform active:scale-95"
      >
        <RetinaLensLogo size="md" />
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-extrabold text-[#dbfcff] tracking-tight group-hover:text-[#00f0ff] transition-colors">
            RetinaLens
          </span>
          <span className="text-[10px] font-semibold text-[#7bd0ff] tracking-widest uppercase">
            Clinical AI Core
          </span>
        </div>
      </button>

      {/* Right side controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Edge Nodes Online Status Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#060d23]/80 border border-[#3b494b]/50 shadow-[0_0_15px_rgba(0,240,255,0.1)] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]" />
          </span>
          <span className="text-[11px] font-semibold text-[#c4e7ff] tracking-wider uppercase">
            EDGE NODES ONLINE
          </span>
        </div>

        {/* View Switchers if Logged In */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'dashboard'
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'text-[#b9cacb] hover:text-[#dbfcff] hover:bg-[#181f35]/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Scan</span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'history'
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'text-[#b9cacb] hover:text-[#dbfcff] hover:bg-[#181f35]/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-xs font-medium text-[#ffb4ab] hover:bg-[#93000a]/30 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f0ff]/20 to-[#00a6e0]/30 hover:from-[#00f0ff]/30 hover:to-[#00a6e0]/40 border border-[#00f0ff]/40 text-[#dbfcff] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Clinician Portal</span>
          </button>
        )}
      </div>
    </header>
  );
};
