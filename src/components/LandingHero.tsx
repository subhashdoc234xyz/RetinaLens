import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Eye, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
  onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
  return (
    <div className="relative z-10 flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-6 md:py-10 min-h-[calc(100vh-80px)]">
      {/* Top spacer */}
      <div className="hidden lg:block" />

      {/* Main Right-aligned Hero Glass Card Stack */}
      <div className="w-full max-w-xl ml-auto flex flex-col items-start text-left space-y-5 my-auto">
        {/* Clinical Compliance Certification Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1a1f2e]/80 border border-[#00d2ff]/30 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2ff]" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#a5e7ff] font-semibold">
            ISO 13485 CERTIFIED • EXPLAINABLE DIAGNOSTIC AI
          </span>
        </div>

        {/* Hero Glass Card */}
        <div className="w-full rounded-2xl p-7 sm:p-9 bg-[#0e1321]/75 border border-[#3c494e]/40 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
          {/* Top glowing cyan highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00d2ff] to-transparent opacity-90" />

          {/* App Name */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#dee2f6] tracking-tight mb-2 font-space leading-tight">
            Retina<span className="text-[#00d2ff] font-bold">Lens</span>
          </h1>

          {/* Medical Focus Tagline */}
          <h2 className="text-lg sm:text-xl text-[#c4e7ff] font-medium tracking-tight mb-3 font-space">
            Explainable AI for Diabetic Retinopathy Screening
          </h2>

          {/* Clinical Supporting Copy */}
          <p className="text-sm text-[#bbc9cf] leading-relaxed mb-6">
            Empowering rural clinical officers with instantaneous, interpretable fundus screening. Grad-CAM visual heatmaps pinpoint microaneurysms and exudates within seconds — zero cloud dependency required.
          </p>

          {/* KPI Metric Overview Strip */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="flex flex-col p-3 rounded-xl bg-[#161b2a]/70 border border-[#3c494e]/30 backdrop-blur-md">
              <span className="font-mono text-[10px] text-[#859399] uppercase tracking-wider">AUROC</span>
              <span className="text-lg sm:text-xl text-[#00d2ff] font-bold mt-0.5 font-space">98.4%</span>
              <span className="font-mono text-[10px] text-[#bbc9cf]/80">Sensitivity</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#161b2a]/70 border border-[#3c494e]/30 backdrop-blur-md">
              <span className="font-mono text-[10px] text-[#859399] uppercase tracking-wider">LATENCY</span>
              <span className="text-lg sm:text-xl text-[#b8e3ff] font-bold mt-0.5 font-space">&lt; 3.2s</span>
              <span className="font-mono text-[10px] text-[#bbc9cf]/80">Edge Inference</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#161b2a]/70 border border-[#3c494e]/30 backdrop-blur-md">
              <span className="font-mono text-[10px] text-[#859399] uppercase tracking-wider">OPERATIONAL</span>
              <span className="text-lg sm:text-xl text-[#aec6ff] font-bold mt-0.5 font-space">100%</span>
              <span className="font-mono text-[10px] text-[#bbc9cf]/80">Offline Mode</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#00d2ff] via-[#47d6ff] to-[#508eff] text-[#090e1c] text-sm font-bold shadow-[0_0_28px_rgba(0,210,255,0.35)] hover:shadow-[0_0_36px_rgba(0,210,255,0.65)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <span>Get Started — Launch Clinic Portal</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Clinician Deployment Footnote */}
          <div className="mt-5 pt-4 border-t border-[#3c494e]/30 flex items-center gap-2 text-[#859399] text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-[#00d2ff]" />
            <span>Deployed across 140+ remote health outposts • DICOM 3.0</span>
          </div>
        </div>
      </div>

      {/* Bottom Edge Status Readout */}
      <footer className="w-full pt-6 flex flex-col sm:flex-row items-center justify-between text-[#859399] text-xs font-mono tracking-wide gap-2 border-t border-[#3c494e]/20">
        <div className="flex items-center gap-4">
          <span>Inference Speed: &lt; 118ms</span>
          <span className="hidden sm:inline text-[#3c494e]">|</span>
          <span className="hidden sm:inline">Sensitivity 98.4% (AUROC)</span>
        </div>
        <div>
          <span>ISO 13485 Certified • HIPAA Compliant Edge AI</span>
        </div>
      </footer>
    </div>
  );
};
