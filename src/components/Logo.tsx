import React from 'react';
import { LOGO_BASE64 } from '../assets/logoBase64';

interface LogoProps {
  className?: string;
  imgClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-9", imgClassName = "h-9 w-9" }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Attached app_logo_32x32.png Monogram */}
      <img 
        src={LOGO_BASE64} 
        alt="DOUBLE RING Logo"
        className={`${imgClassName} aspect-square object-contain rounded-lg flex-shrink-0`}
        referrerPolicy="no-referrer"
      />

      {/* Wordmark Typography */}
      <div className="flex flex-col justify-center">
        <span className="font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-[#F7E2AD] via-[#C5A059] to-[#E2C28E] text-base leading-none">
          DOUBLE RING
        </span>
      </div>
    </div>
  );
};
