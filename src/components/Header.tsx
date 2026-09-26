import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { getStoredUserInfo } from '../utils/auth';

export const Header: React.FC = () => {
  const { user, isLoggedIn, currentSubScreen, setCurrentTab, setCurrentSubScreen, myProfile, refreshMemberProfile } = useApp();

  const uinfo = getStoredUserInfo();
  // 구글 프로필 이미지 로드 실패(예: lh3.googleusercontent.com 429 등) 시 기본 아바타로 대체
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  // myProfile.memberInfo에 u_dp가 없으면(uchk 응답에는 빠져 있을 수 있음), /members/{uidx}로
  // 전체 회원 정보를 다시 받아와 채운다. 캐시가 지워진 상태에서도 세션이 살아있으면 복구된다.
  const memberInfoDp = myProfile?.memberInfo?.u_dp;
  useEffect(() => {
    if (!isLoggedIn) return;
    if (memberInfoDp !== undefined && memberInfoDp !== null) return;

    refreshMemberProfile();
  }, [isLoggedIn, memberInfoDp, refreshMemberProfile]);

  // DP는 서버에서 상시 갱신되는 myProfile.memberInfo를 우선 사용하고, 마지막으로 기존 로컬 캐시로 폴백한다.
  const walletDp = memberInfoDp ?? uinfo?.u_dp ?? 0;

  const isAuthScreen = !isLoggedIn || 
    currentSubScreen === 'login' || 
    currentSubScreen === 'signup' || 
    (typeof currentSubScreen === 'string' && currentSubScreen.startsWith('email-verify'));
  const showHeaderActions = currentSubScreen === null || !isAuthScreen;

  return (
    <header className="sticky top-0 z-40 shrink-0 w-full bg-[#0D1B2A]/95 backdrop-blur-md border-b border-[#1F334D] px-4 py-3 flex items-center justify-between">
      {/* Left: Brand Logo (32x32 Base64 Image + DOUBLE RING Wordmark) */}
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
          alt="DOUBLE RING Logo" 
          width={32}
          height={32}
          className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <span className="font-black text-lg tracking-[0.02em] text-transparent bg-clip-text bg-gradient-to-r from-[#F7E2AD] via-[#C5A059] to-[#E2C28E] leading-none">
          DOUBLE RING
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
                {walletDp.toLocaleString()} <span className="text-[10px] text-slate-400">DP</span>
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
            {isLoggedIn && uinfo?.u_profile && !avatarLoadFailed ? (
              <img
                src={uinfo.u_profile}
                alt={uinfo.u_name || 'User Avatar'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarLoadFailed(true)}
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

