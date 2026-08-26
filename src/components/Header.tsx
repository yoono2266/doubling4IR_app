import React from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { getTierInfo } from '../data/membershipData';

export const Header: React.FC = () => {
  const { user, isLoggedIn, currentSubScreen, setCurrentTab, setCurrentSubScreen } = useApp();

  const isAuthScreen = !isLoggedIn || 
    currentSubScreen === 'login' || 
    currentSubScreen === 'signup' || 
    (typeof currentSubScreen === 'string' && currentSubScreen.startsWith('email-verify'));

  const currentTierInfo = getTierInfo(user.membershipTier);
  const tierColor = currentTierInfo?.color || '#C9CBCF';

  return (
    <header className="sticky top-0 z-40 shrink-0 w-full bg-[#0D1B2A]/95 backdrop-blur-md border-b border-[#1F334D] px-4 py-3 flex items-center justify-between">
      {/* Left: Brand Logo */}
      <div 
        onClick={() => {
          if (!isAuthScreen) {
            setCurrentTab('home');
            setCurrentSubScreen(null);
          }
        }}
        className={`flex items-center gap-2.5 ${!isAuthScreen ? 'cursor-pointer group' : ''}`}
      >
        <img 
          src={LOGO_BASE64} 
          alt="DOUBLING Logo" 
          width={32}
          height={32}
          className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <span className="font-black text-lg tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-[#F7E2AD] via-[#C5A059] to-[#E2C28E] leading-none">
          DOUBLING
        </span>
      </div>

      {/* Right: Dual Wallet Balance Chip (DP Primary, Coin Wallet Secondary) & Tier Ring Avatar */}
      {!isAuthScreen && (
        <div className="flex items-center gap-3">
          {/* Dual Balance Pill */}
          <div className="flex items-center bg-[#162639] border border-[#C5A059]/40 rounded-xl px-2.5 py-1.5 gap-2.5 shadow-sm">
            {/* Primary: DP Balance (Predict Challenge) */}
            <button 
              onClick={() => {
                setCurrentTab('poly');
                setCurrentSubScreen(null);
              }}
              className="flex flex-col items-end text-right hover:opacity-85 transition group"
              title="더블링포인트 (예측 챌린지 바로가기)"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E2C28E] animate-pulse"></span>
                <span className="text-xs font-black text-[#E2C28E] font-mono leading-tight group-hover:text-[#FFF0D0] transition">
                  {user.walletDp.toLocaleString()} <span className="text-[10px] text-amber-200/90 font-sans font-bold">DP</span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium leading-none">
                예측 챌린지
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 bg-[#1F334D]"></div>

            {/* Secondary: Coin Wallet (Real Payment / FreePlay) */}
            <button 
              onClick={() => {
                setCurrentTab('my');
                setCurrentSubScreen('my-wallet');
              }}
              className="flex flex-col items-start text-left hover:opacity-85 transition group"
              title="코인 월렛 (실결제 / FreePlay 전용)"
            >
              <span className="text-[9px] text-slate-400 font-medium leading-none">코인월렛</span>
              <span className="text-[11px] font-bold text-slate-200 font-mono leading-tight group-hover:text-white transition">
                {user.walletCoin.toLocaleString()} <span className="text-[9px] text-slate-400 font-sans">코인</span>
              </span>
            </button>
          </div>

          {/* Profile Avatar with Dynamic Membership Tier Ring */}
          <div 
            onClick={() => {
              setCurrentTab('my');
              setCurrentSubScreen('my-membership');
            }}
            className="relative cursor-pointer shrink-0 group transition-transform active:scale-95"
            title={`${user.name} 님 (${user.membershipTier} 등급 - 멤버십 대시보드)`}
          >
            {/* Dynamic Tier Colored Ring (2.5px ring with glow) */}
            <div 
              className="w-9 h-9 rounded-full p-[2.5px] transition-all duration-300 group-hover:scale-105"
              style={{ 
                background: user.membershipTier === 'CROWN' 
                  ? 'linear-gradient(135deg, #D4AF37 0%, #1A1A1A 50%, #D4AF37 100%)' 
                  : tierColor,
                boxShadow: `0 0 10px ${tierColor}66`
              }}
            >
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover bg-[#0D1B2A]"
              />
            </div>
            {/* Online status indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0D1B2A]"></span>
          </div>
        </div>
      )}
    </header>
  );
};

