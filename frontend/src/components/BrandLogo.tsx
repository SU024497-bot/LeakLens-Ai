import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'dark',
}) => {
  const pixelSizes = {
    sm: 30,
    md: 38,
    lg: 48,
  };
  const px = pixelSizes[size];

  const textColor = variant === 'light' ? 'text-[#EEEBDA]' : 'text-[#282B4A]';
  const subtitleColor = variant === 'light' ? 'text-[#EEEBDA]/70' : 'text-[#282B4A]/70';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Custom Vector Lens & Dataset Grid SVG */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <rect width="48" height="48" rx="12" fill="#282B4A" />
        {/* Dataset rows */}
        <rect x="11" y="13" width="10" height="3.5" rx="1.5" fill="#EEEBDA" fillOpacity="0.4" />
        <rect x="11" y="20" width="13" height="3.5" rx="1.5" fill="#EEEBDA" fillOpacity="0.3" />
        <rect x="11" y="27" width="8" height="3.5" rx="1.5" fill="#EEEBDA" fillOpacity="0.4" />
        <rect x="11" y="34" width="11" height="3.5" rx="1.5" fill="#EEEBDA" fillOpacity="0.2" />
        
        {/* Inspection Optical Lens */}
        <circle cx="28" cy="24" r="11" stroke="#EEEBDA" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="24" r="6" stroke="#EEEBDA" strokeWidth="1.5" strokeDasharray="2 3" strokeOpacity="0.7" />
        
        {/* Optical reticle lines */}
        <line x1="28" y1="15" x2="28" y2="18" stroke="#EEEBDA" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="30" x2="28" y2="33" stroke="#EEEBDA" strokeWidth="2" strokeLinecap="round" />
        <line x1="19" y1="24" x2="22" y2="24" stroke="#EEEBDA" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="24" x2="37" y2="24" stroke="#EEEBDA" strokeWidth="2" strokeLinecap="round" />
        
        {/* Lens grip handle */}
        <line x1="36" y1="32" x2="41" y2="37" stroke="#EEEBDA" strokeWidth="3" strokeLinecap="round" />
        
        {/* Anomaly target beacon */}
        <circle cx="28" cy="24" r="2.2" fill="#D97706" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight text-lg sm:text-xl ${textColor}`}>
              LeakLens
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#282B4A] text-[#EEEBDA] border border-[#EEEBDA]/20">
              AI
            </span>
          </div>
          <span className={`text-[10px] font-semibold tracking-wider uppercase ${subtitleColor}`}>
            Auditing & Leakage Lab
          </span>
        </div>
      )}
    </div>
  );
};
