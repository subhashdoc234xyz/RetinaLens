import React, { useState, useEffect } from 'react';
import { IRIS_VISUAL_URL } from '../lib/constants';

interface LandingHeroProps {
  onGetStarted: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onGetStarted }) => {
  const [isDilated, setIsDilated] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDilated((prev) => !prev);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen relative overflow-hidden bg-[#090e1c] text-[#dee2f6] select-none">
      {/* Subtle ambient gradient meshes behind glass */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#00d2ff]/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-[#508eff]/15 blur-[140px] pointer-events-none" />

      {/* Optical Field Calibration / Reticle HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30 flex items-center justify-center">
        <div className="w-[850px] h-[850px] rounded-full border border-[#a5e7ff]/20 -translate-x-[22%] translate-y-[8%] scale-95 animate-pulse" />
        <div className="w-[1100px] h-[1100px] rounded-full border border-dashed border-[#7bd0ff]/20 -translate-x-[22%] translate-y-[8%]" />
      </div>

      {/* Primary Viewport Grid Container */}
      <div className="relative w-full flex-1 flex flex-col lg:flex-row items-center justify-between z-20 px-4 sm:px-8 lg:px-12 py-6 lg:py-10 min-h-[90vh]">
        
        {/* LEFT 62%: Macro Iris Biological Simulator Lens Viewport */}
        <div className="relative w-full lg:w-[62%] h-[480px] lg:h-[820px] flex items-center justify-start overflow-hidden rounded-3xl lg:rounded-none">
          {/* Ambient Backlight for biological depth */}
          <div className="absolute -left-20 top-1/4 w-[520px] h-[520px] rounded-full bg-[#00d2ff]/20 blur-[100px] pointer-events-none" />

          {/* Macro Iris Container with rhythmic physiological dilation animation */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={IRIS_VISUAL_URL}
              alt="Bio-optical macro ophthalmic visualization"
              className={`w-full h-full object-cover object-center select-none pointer-events-none filter contrast-125 brightness-95 transition-all duration-[4500ms] ease-in-out ${
                isDilated
                  ? 'scale-[1.12] -rotate-[0.3deg] contrast-[130%] brightness-[102%] saturate-[112%]'
                  : 'scale-[1.06] rotate-[0.4deg] contrast-[125%] brightness-[95%] saturate-[105%]'
              }`}
            />

            {/* Precision Optical Reticle SVG Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-full h-full max-w-[700px] max-h-[700px]" fill="none" viewBox="0 0 400 400">
                {/* Center Focus Reticle Marker */}
                <circle className="text-[#a5e7ff]/20" cx="200" cy="200" r="145" stroke="currentColor" strokeDasharray="6 6" strokeWidth="1.5" />
                <circle className="text-[#00d2ff]/40" cx="200" cy="200" r="95" stroke="currentColor" strokeWidth="1" />
                <circle className="text-[#a5e7ff]" cx="200" cy="200" r="38" stroke="currentColor" strokeWidth="1.5" />
                <circle className="text-[#090e1c]" cx="200" cy="200" fill="currentColor" r="14" />
                {/* Crosshairs */}
                <line className="text-[#00d2ff]" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="200" x2="200" y1="20" y2="60" />
                <line className="text-[#00d2ff]" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="200" x2="200" y1="340" y2="380" />
                <line className="text-[#00d2ff]" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="20" x2="60" y1="200" y2="200" />
                <line className="text-[#00d2ff]" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="340" x2="380" y1="200" y2="200" />
                {/* Radial Micro Target Nodes */}
                <circle className="text-[#00d2ff]" cx="200" cy="115" fill="currentColor" r="4.5" />
                <circle className="text-[#00d2ff]" cx="200" cy="285" fill="currentColor" r="4.5" />
                <circle className="text-[#00d2ff]" cx="115" cy="200" fill="currentColor" r="4.5" />
                <circle className="text-[#00d2ff]" cx="285" cy="200" fill="currentColor" r="4.5" />
              </svg>
            </div>

            {/* Vignette & Translucent Scrim transitioning into dark negative space */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#090e1c]/40 to-[#090e1c] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090e1c] via-transparent to-[#090e1c]/60 pointer-events-none" />
          </div>


        </div>

        {/* RIGHT 38%: Velvety Dark Clinical Diagnostic Terminal */}
        <div className="relative w-full lg:w-[38%] flex flex-col justify-center space-y-5 lg:space-y-6 z-30 lg:pl-6 my-auto">
          {/* Clinical Compliance Certification Badge */}
          <div className="inline-flex items-center self-start gap-2.5 px-3.5 py-1.5 rounded-full bg-[#252a39]/80 backdrop-blur-xl border border-[#a5e7ff]/25 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2ff]" />
            </span>
            <span className="font-mono text-[11px] text-[#a5e7ff] uppercase tracking-widest font-semibold">
              ISO 13485 CERTIFIED • EXPLAINABLE DIAGNOSTIC AI
            </span>
          </div>

          {/* Title & Subtitle Stack */}
          <div className="flex flex-col space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] lg:leading-[60px] text-[#dee2f6] tracking-tight font-space font-bold">
              Retina<span className="text-[#00d2ff] font-semibold">Lens</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#c4e7ff] font-medium tracking-tight font-space">
              Explainable AI for Diabetic Retinopathy Screening
            </p>
          </div>

          {/* Value Proposition Body */}
          <p className="text-sm sm:text-[15px] text-[#bbc9cf] leading-relaxed">
            Empowering rural clinical officers with instantaneous, interpretable fundus screening. Grad-CAM visual heatmaps pinpoint microaneurysms and exudates within seconds — zero cloud dependency required.
          </p>

          {/* Diagnostic Metrics Pill Row */}
          <div className="grid grid-cols-3 gap-2.5 py-1">
            <div className="flex flex-col p-3 rounded-xl bg-[#1a1f2e]/60 backdrop-blur-lg border border-[#3c494e]/30 transition-all hover:bg-[#252a39]/70">
              <span className="font-mono text-[11px] text-[#859399] uppercase tracking-wider">AUROC</span>
              <span className="text-xl text-[#a5e7ff] font-bold mt-1 font-space">98.4%</span>
              <span className="font-mono text-[10px] text-[#bbc9cf]/80">Sensitivity</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#1a1f2e]/60 backdrop-blur-lg border border-[#3c494e]/30 transition-all hover:bg-[#252a39]/70">
              <span className="font-mono text-[11px] text-[#859399] uppercase tracking-wider">LATENCY</span>
              <span className="text-xl text-[#b8e3ff] font-bold mt-1 font-space">&lt; 3.2s</span>
              <span className="font-mono text-[10px] text-[#bbc9cf]/80">Edge Inference</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#1a1f2e]/60 backdrop-blur-lg border border-[#3c494e]/30 transition-all hover:bg-[#252a39]/70">
              <span className="font-mono text-[11px] text-[#859399] uppercase tracking-wider">OPERATIONAL</span>
              <span className="text-xl text-[#aec6ff] font-bold mt-1 font-space">100%</span>
              <span className="font-mono text-[10px] text-[#bbc9cf]/80">Offline Mode</span>
            </div>
          </div>

          {/* Action Workflow CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            {/* Primary Luminous Liquid Glass Button */}
            <button
              onClick={onGetStarted}
              id="launch-portal-btn"
              className="relative group overflow-hidden px-7 py-4 rounded-xl text-sm font-semibold text-[#090e1c] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 bg-gradient-to-r from-[#00d2ff] via-[#47d6ff] to-[#508eff] hover:brightness-110 active:scale-[0.98] cursor-pointer"
              style={{ boxShadow: '0 0 28px rgba(0, 210, 255, 0.35)' }}
            >
              <span className="relative z-10 flex items-center gap-2 font-bold">
                Get Started — Launch Clinic Portal
                <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </button>

            {/* Secondary Ghost Glass Link */}
            <button
              onClick={onGetStarted}
              className="px-5 py-3.5 rounded-xl text-sm font-medium text-[#a5e7ff] bg-[#1a1f2e]/40 backdrop-blur-md border border-[#a5e7ff]/20 hover:bg-[#252a39]/60 hover:border-[#a5e7ff]/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>View Validation (AUROC 0.984)</span>
            </button>
          </div>

          {/* Clinician Deployment Footnote */}
          <div className="pt-2 flex items-center gap-2 font-mono text-xs text-[#859399]">
            <span className="material-symbols-outlined text-[16px] text-[#00d2ff]">cell_tower</span>
            <span>Deployed across 140+ remote health outposts in sub-Saharan clinics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
