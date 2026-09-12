import React from 'react';
import { IRIS_VISUAL_URL } from '../lib/constants';

interface IrisBackgroundProps {
  dimmed?: boolean; // When in auth modal or dashboard, dimmed for higher card contrast
}

export const IrisBackground: React.FC<IrisBackgroundProps> = ({ dimmed = false }) => {
  return (
    <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none select-none">
      {/* Macro Iris Image with subtle breathing motion */}
      <img
        src={IRIS_VISUAL_URL}
        alt="Cinematic Macro Human Iris Visual"
        className={`absolute inset-0 w-full h-full object-cover object-left md:object-center transition-all duration-1000 will-change-transform ${
          dimmed
            ? 'filter blur-md scale-105 opacity-40'
            : 'animate-iris-breathe opacity-90'
        }`}
      />

      {/* Optical Field Calibration / Reticle HUD Overlays */}
      {!dimmed && (
        <div className="absolute inset-0 pointer-events-none z-10 opacity-35 flex items-center justify-center">
          <div className="w-[850px] h-[850px] rounded-full border border-[#47d6ff]/20 -translate-x-[22%] translate-y-[8%] scale-95 animate-pulse" />
          <div className="w-[1100px] h-[1100px] rounded-full border border-dashed border-[#7bd0ff]/20 -translate-x-[22%] translate-y-[8%]" />
        </div>
      )}

      {/* Atmospheric deep obsidian gradient overlays */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          dimmed
            ? 'bg-gradient-to-r from-[#090e1c]/95 via-[#0e1321]/85 to-[#090e1c]/95 backdrop-blur-md'
            : 'bg-gradient-to-r from-transparent via-[#090e1c]/40 via-55% to-[#090e1c]/95'
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090e1c] via-transparent via-25% to-[#090e1c]/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,14,28,0.75)_100%)]" />

      {/* Ambient glowing optical dust particles & bokeh */}
      <div className="absolute top-[18%] right-[28%] w-2 h-2 rounded-full bg-[#00d2ff]/40 blur-[1px] animate-pulse" />
      <div className="absolute top-[35%] right-[14%] w-3 h-3 rounded-full bg-[#7bd0ff]/30 blur-[2px]" />
      <div className="absolute bottom-[24%] right-[22%] w-1.5 h-1.5 rounded-full bg-[#b8e3ff]/40 blur-[0.5px]" />
      <div className="absolute bottom-[42%] right-[8%] w-2.5 h-2.5 rounded-full bg-[#00d2ff]/25 blur-[1.5px]" />
      <div className="absolute top-[55%] right-[32%] w-1 h-1 rounded-full bg-white/30 blur-[0.5px]" />

      {/* Ambient refractive glow orbs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-[#00d2ff]/10 blur-3xl pointer-events-none -z-20" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#508eff]/15 blur-3xl pointer-events-none -z-20" />
    </div>
  );
};
