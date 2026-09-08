import React from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { getStoredUserInfo } from '../utils/auth';

export const Header: React.FC = () => {
  const { user, isLoggedIn, currentSubScreen, setCurrentTab, setCurrentSubScreen } = useApp();

  const uinfo = getStoredUserInfo();

  const isAuthScreen = !isLoggedIn || 
    currentSubScreen === 'login' || 
    currentSubScreen === 'signup' || 
    (typeof currentSubScreen === 'string' && currentSubScreen.startsWith('email-verify'));
  const showHeaderActions = currentSubScreen === null || !isAuthScreen;

  return (
    <header className="sticky top-0 z-40 shrink-0 w-full bg-[#0D1B2A]/95 backdrop-blur-md border-b border-[#1F334D] px-4 py-3 flex items-center justify-between">
      {/* Left: Brand Logo (32x32 Base64 Image + DOUBLING Wordmark) */}
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

      {/* Right: Wallet Quick View, Persona Avatar (Rendered only when logged in) */}
      {showHeaderActions && (
        <div className="flex items-center gap-2">
          {/* Wallet Balance Chip — DP(예측 챌린지) 잔액만 표기. mock 잔액. */}
          {isLoggedIn && (
            <div
              onClick={() => {
                setCurrentTab('my');
                setCurrentSubScreen('my-wallet');
              }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#162639] border border-[#C5A059]/40 hover:border-[#C5A059] transition cursor-pointer"
            >
              <span className="text-xs font-bold text-[#E2C28E] font-mono">
                {uinfo.u_dp} <span className="text-[10px] text-slate-400">DP</span>
              </span>
            </div>
          )}

          {/* Persona Avatar */}
          <div 
            onClick={() => {
              if (isLoggedIn) {
                setCurrentTab('my');
                setCurrentSubScreen(null);
              } else {
                setCurrentSubScreen('login');
              }
            }}
            className="relative cursor-pointer"
            title={user.name}
          >
            {isLoggedIn && uinfo?.u_profile ? (
              <img 
                src={uinfo.u_profile} 
                alt={uinfo.u_name || 'User Avatar'} 
                className="w-8 h-8 rounded-full object-cover border-2 border-[#C5A059]"
              />
            ) : (
              <div
                aria-label="로그인"
                className="w-8 h-8 rounded-full bg-[#162639] border-2 border-[#C5A059] text-[#C5A059] flex items-center justify-center"
              >
                <i className="bi bi-person-fill text-lg" aria-hidden="true"></i>
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0D1B2A]"></span>
          </div>
        </div>
      )}
    </header>
  );
};

