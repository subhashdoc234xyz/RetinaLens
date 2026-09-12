import React from 'react';
import { RETINALENS_LOGO_URL } from '../lib/constants';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RetinaLensLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`relative rounded-xl bg-[#222940]/80 border border-[#00f0ff]/30 p-1.5 shadow-lg flex items-center justify-center backdrop-blur-md overflow-hidden ${sizeMap[size]} ${className}`}
    >
      {!imgError ? (
        <img
          src={RETINALENS_LOGO_URL}
          alt="RetinaLens Optical Logo"
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#00f0ff]"
        >
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
          <circle cx="24" cy="24" r="14" stroke="#7bd0ff" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="24" cy="24" r="8" fill="#00f0ff" fillOpacity="0.3" stroke="#00f0ff" strokeWidth="2" />
          <circle cx="24" cy="24" r="3" fill="#ffffff" />
          <path d="M12 24H4M44 24H36M24 12V4M24 44V36" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <div className="absolute -inset-1 rounded-xl bg-[#00f0ff]/15 blur-md -z-10" />
    </div>
  );
};
