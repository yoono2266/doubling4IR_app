import React from 'react';
import { useApp } from '../context/AppContext';
import { getTierInfo, getNextTier } from '../data/membershipData';

export const CurrentTripSummaryScreen: React.FC = () => {
  const { user, setCurrentSubScreen } = useApp();

  const currentTier = getTierInfo(user.membershipTier);
  const nextTier = getNextTier(user.membershipTier);

  // Score metrics
  const currentScore = user.tierScore; // 2,150
  const checkInScore = 150; // 확정
  const roomScore = 250; // 예상
  const totalTripExpected = checkInScore + roomScore; // 400
  const expectedTotalScore = currentScore + totalTripExpected; // 2,550

  const nextThreshold = nextTier ? nextTier.thresholdScore : 3800; // 3,800
  const currentThreshold = currentTier.thresholdScore; // 1,500
  const remainingBeforeTrip = Math.max(0, nextThreshold - currentScore); // 1,650
  const remainingAfterTrip = Math.max(0, nextThreshold - expectedTotalScore); // 1,250

  const currentProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((currentScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
  );

  const expectedProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((expectedTotalScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
  );

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Top Bar: Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentSubScreen('my-membership')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>멤버십 대시보드로 돌아가기</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-extrabold tracking-wider">
            투숙 중 (In-House)
          </span>
        </div>
      </div>

      {/* Screen Title */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059] text-2xl">luggage</span>
          <span>이번 여행 요약</span>
        </h1>
        <p className="text-xs text-slate-300 mt-0.5">
          실시간 체크인 연동 기반 이번 방문 예상 실적 및 VIP 혜택 안내
        </p>
      </div>

      {/* 1. TOP: CHECK-IN INFO CARD */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#1E2E44] via-[#162639] to-[#0A1422] border-2 border-[#C5A059]/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Status & Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-400">verified</span>
              체크인 확인됨
            </span>
            <span className="px-2 py-0.5 rounded bg-[#C9CBCF]/20 text-[#F1F5F9] text-[10px] font-bold">
              {user.membershipTier} VIP
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            RES-OKD-2026-8921
          </span>
        </div>

        {/* Hotel & Stay Details */}
        <div className="mt-4 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                <span>Okada Manila</span>
                <span className="text-xs font-normal text-slate-300">(오카다 마닐라)</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-[#C5A059]">location_on</span>
                <span>New Manila Bay, Manila, Philippines</span>
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059] shadow-inner">
              <span className="material-symbols-outlined text-2xl">hotel</span>
            </div>
          </div>

          {/* Stay Info Grid */}
          <div className="mt-4 grid grid-cols-2 gap-2 bg-[#0D1B2A]/90 backdrop-blur-sm p-3.5 rounded-2xl border border-[#1F334D] text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">체크인 확인 일시</span>
              <span className="font-mono font-bold text-[#E2C28E] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">schedule</span>
                2026-08-26 15:32
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">객실 타입</span>
              <span className="font-bold text-white block mt-0.5 truncate">
                Executive Ocean Suite
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE: EXPECTED TIER SCORE BREAKDOWN */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-3xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#C5A059] text-base">savings</span>
              <span>이번 방문 예상 적립 안내</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              호텔 체크인 및 리조트 실적 기반 Tier Score 산정
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">합계 예상 적립</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              +{totalTripExpected}점
            </span>
          </div>
        </div>

        {/* Source by Source Breakdown */}
        <div className="space-y-2.5">
          {/* Source 1: Check-in Score */}
          <div className="bg-[#0D1B2A] border border-[#C5A059]/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E] shrink-0">
                <span className="material-symbols-outlined text-lg">key</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">체크인 적립</span>
                  <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    확정됨
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  호텔 키 수령 및 현장 체크인 확인 완료
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono font-black text-sm text-emerald-400 block">
                +{checkInScore}점
              </span>
              <span className="text-[9px] text-slate-400">즉시 반영</span>
            </div>
          </div>

          {/* Source 2: Room Package Score */}
          <div className="bg-[#0D1B2A] border border-blue-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                <span className="material-symbols-outlined text-lg">hotel</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">객실 (1+1 패키지) 적립</span>
                  <span className="text-[9px] font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.2 rounded">
                    예상 적립
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  체크아웃 시 자동 정산 및 확정 반영
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono font-black text-sm text-blue-300 block">
                +{roomScore}점
              </span>
              <span className="text-[9px] text-slate-400">체크아웃 시</span>
            </div>
          </div>

          {/* Source 3: F&B Dining Score */}
          <div className="bg-[#0D1B2A] border border-rose-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
                <span className="material-symbols-outlined text-lg">restaurant</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">식음료 (F&B) 적립</span>
                  <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.2 rounded">
                    실시간 갱신 예정
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  방문 중 리조트 내 레스토랑 &amp; 바 이용 시 발생
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold text-slate-400 block font-mono">
                이용 시 갱신
              </span>
              <span className="text-[9px] text-slate-400">실시간 연동</span>
            </div>
          </div>
        </div>

        {/* Progress & Next Tier Roadmap (SOLITAIRE 3,800점) */}
        <div className="bg-[#0D1B2A] p-4 rounded-2xl border border-[#1F334D] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C5A059] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              다음 등급(SOLITAIRE) 승급 진행률
            </span>
            <span className="text-xs font-mono font-extrabold text-[#D4AF37]">
              남은 점수: {remainingBeforeTrip.toLocaleString()}점 → {remainingAfterTrip.toLocaleString()}점
            </span>
          </div>

          {/* Dynamic Dual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>현재: <strong className="text-white font-bold">{currentScore.toLocaleString()}점</strong></span>
              <span>이번 반영 시: <strong className="text-emerald-400 font-bold">{expectedTotalScore.toLocaleString()}점</strong></span>
              <span className="text-[#D4AF37]">목표: <strong>{nextThreshold.toLocaleString()}점</strong></span>
            </div>

            <div className="w-full bg-[#162639] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#1F334D] relative">
              {/* Expected projection bar */}
              <div
                className="h-full rounded-full bg-emerald-500/40 absolute top-0.5 left-0.5 transition-all duration-700"
                style={{ width: `${expectedProgressPercent}%` }}
              />
              {/* Current actual bar */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C9CBCF] via-[#E2C28E] to-[#D4AF37] relative z-10 transition-all duration-700 shadow-sm"
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <span>현재 진행률: <strong className="text-white font-mono">{currentProgressPercent}%</strong></span>
              <span>이번 여행 완료 시: <strong className="text-emerald-400 font-mono">{expectedProgressPercent}%</strong> (+{expectedProgressPercent - currentProgressPercent}%p)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM: AVAILABLE VIP COMP BENEFITS SHORTCUT */}
      <div className="bg-gradient-to-br from-[#1E2E44] via-[#162639] to-[#0A1422] border-2 border-[#C5A059] rounded-3xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0D1B2A] border border-[#C5A059] flex items-center justify-center text-[#C5A059] shadow">
              <span className="material-symbols-outlined text-2xl">diamond</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">이번 여행 VIP 혜택 이용하기</h3>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#C5A059] text-[#0D1B2A]">
                  Comp 3종
                </span>
              </div>
              <p className="text-xs text-[#E2C28E] font-medium mt-0.5">
                이번 방문 중 준비된 VIP 혜택을 확인해보세요
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#0D1B2A]/80 p-3 rounded-xl border border-[#1F334D]">
          투숙 기간 동안 FreePlay 스위트 룸, VIP 살롱 게이밍룸, 미쉐린 파인다이닝 등 <strong className="text-white">{user.membershipTier}</strong> 등급 전용 Comp 특전을 바로 신청하고 이용하실 수 있습니다.
        </p>

        <button
          onClick={() => setCurrentSubScreen('comp-benefits')}
          className="w-full py-3.5 rounded-2xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-xl hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          <span>VIP 혜택 확인하기 (Comp 3종 선택)</span>
        </button>
      </div>
    </div>
  );
};
