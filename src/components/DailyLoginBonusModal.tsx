import React from 'react';
import { useApp } from '../context/AppContext';

export const DailyLoginBonusModal: React.FC = () => {
  const { showLoginBonusModal, claimDailyLoginBonus } = useApp();

  if (!showLoginBonusModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#1E2E44] via-[#162639] to-[#0D1B2A] border-2 border-[#E2C28E] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-[0_0_40px_rgba(226,194,142,0.35)] animate-in zoom-in-95">
        
        {/* Animated Celebration Icon */}
        <div className="relative">
          <div className="w-18 h-18 w-20 h-20 rounded-3xl bg-gradient-to-br from-[#C5A059] to-[#E2C28E] p-0.5 shadow-[0_0_25px_rgba(226,194,142,0.6)]">
            <div className="w-full h-full bg-[#0D1B2A] rounded-3xl flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#E2C28E] animate-bounce">
                featured_seasonal_and_gifts
              </span>
            </div>
          </div>
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E2C28E] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C5A059]"></span>
          </span>
        </div>

        {/* Title */}
        <div>
          <span className="text-[10px] font-extrabold text-[#E2C28E] uppercase tracking-widest bg-[#E2C28E]/15 px-2.5 py-0.5 rounded-full border border-[#E2C28E]/30 inline-block mb-1.5">
            DAILY LOGIN BONUS
          </span>
          <h3 className="text-lg font-black text-white leading-snug">
            오늘의 로그인 보너스
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            더블링 파트너스에 매일 접속하고 <br />
            예측 챌린지 전용 포인트를 무료로 받으세요!
          </p>
        </div>

        {/* DP Highlight Box */}
        <div className="w-full bg-[#0D1B2A]/90 p-4 rounded-2xl border border-[#E2C28E]/50 flex flex-col items-center justify-center gap-1 shadow-inner">
          <span className="text-[11px] text-slate-400 font-medium">지급 혜택</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-[#E2C28E] font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(226,194,142,0.4)]">
              +150
            </span>
            <span className="text-base font-extrabold text-amber-200 bg-[#E2C28E]/20 px-2 py-0.5 rounded-lg border border-[#E2C28E]/40 font-mono">
              DP
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            * 예측 챌린지 전용 (실시간 투표 및 승부 예측에 사용 가능)
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={claimDailyLoginBonus}
          className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-sm shadow-[0_4px_20px_rgba(197,160,89,0.4)] hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>150 DP 받기</span>
        </button>
      </div>
    </div>
  );
};
