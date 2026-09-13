import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBERSHIP_TIERS, getTierInfo, getNextTier } from '../data/membershipData';
import { MembershipTierId } from '../types';

export const MembershipDashboardScreen: React.FC = () => {
  const { user, tierRecords, setCurrentSubScreen, myProfile } = useApp();
  // 2026-09-14 비활성화 (삭제하지 않고 주석 보존). 사유: "IR 시연용 실시간 알림
  // 시뮬레이션" 박스(데모 트리거 버튼) 완전 삭제 요청에 따라 이 박스를 여는 트리거가
  // 사라지면서 아래 두 미리보기 모달(6, 7번 섹션)이 도달 불가능해져 함께 비활성화함.
  // const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  // const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);

  // 서버 memberShip(회원 1인의 현재 등급 1건)의 tb_index를 로컬 membershipData의 id와 매칭해
  // 주얼리 컨셉/아이콘/혜택 목록 등 API에 없는 보완 정보를 채우고, 표시값은 API를 우선한다.
  const apiTier = myProfile?.memberShip && typeof myProfile.memberShip === 'object' ? myProfile.memberShip : null;
  const localCurrentTier = (apiTier ? MEMBERSHIP_TIERS.find((t) => t.id === String(apiTier.tb_index)) : null) || MEMBERSHIP_TIERS[0];

  const currentTier = {
    ...localCurrentTier,
    englishName: apiTier?.tb_title_en || localCurrentTier.englishName,
    koreanName: apiTier?.tb_title_ko || localCurrentTier.koreanName,
    color: apiTier?.tb_color || localCurrentTier.color,
    // thresholdScore(진입 임계값)는 로컬 값을 그대로 쓴다 — tb_max_exp는 "이 등급의 최대 경험치"라
    // 사실상 다음 등급 진입 임계값과 같은 값이라(아래 nextThreshold에서 사용), 여기 넣으면 안 된다.
  };

  // 다음 등급 정보는 API가 내려주지 않으므로(현재 등급 1건만 제공) 로컬 카탈로그 순서로 결정하되,
  // 다음 등급까지의 임계값(상한)은 현재 등급 API의 tb_max_exp를 우선 사용한다.
  const nextTier = getNextTier(localCurrentTier.id);

  const [activeTierTab, setActiveTierTab] = useState<MembershipTierId>(localCurrentTier.id);

  const tierIndexOf = (id: MembershipTierId) => MEMBERSHIP_TIERS.findIndex((t) => t.id === id);

  const getBenefitCompTag = (benefit: string) => {
    const b = benefit.toLowerCase();
    if (b.includes('freeplay') || b.includes('오퍼') || b.includes('스위트') || b.includes('룸 업그레이드') || b.includes('체크아웃') || b.includes('호텔')) {
      return {
        type: 'freeplay_suite',
        label: '오퍼 스위트',
        icon: 'hotel',
        bg: 'bg-blue-500/15',
        text: 'text-blue-300',
        border: 'border-blue-500/30'
      };
    }
    if (b.includes('게이밍') || b.includes('살롱') || b.includes('호스트') || b.includes('하이리밋') || b.includes('테이블')) {
      return {
        type: 'gaming_room',
        label: '멤버십 게이밍룸',
        icon: 'casino',
        bg: 'bg-purple-500/15',
        text: 'text-purple-300',
        border: 'border-purple-500/30'
      };
    }
    if (b.includes('다이닝') || b.includes('라운지') || b.includes('f&b') || b.includes('음료') || b.includes('디너') || b.includes('뷔페')) {
      return {
        type: 'dining',
        label: '멤버십 다이닝',
        icon: 'restaurant',
        bg: 'bg-rose-500/15',
        text: 'text-rose-300',
        border: 'border-rose-500/30'
      };
    }
    return null;
  };

  // Score Calculations (currentScore는 API의 u_exp를 우선 사용)
  const currentScore = myProfile?.memberInfo?.u_exp ?? user.tierScore;
  const currentThreshold = localCurrentTier.thresholdScore;
  const nextThreshold = nextTier
    ? (apiTier?.tb_max_exp ?? nextTier.thresholdScore)
    : currentThreshold;
  const scoreNeeded = nextTier ? Math.max(0, nextThreshold - currentScore) : 0;
  const progressPercent = nextTier
    ? Math.min(100, Math.max(0, Math.round(((currentScore - currentThreshold) / (nextThreshold - currentThreshold || 1)) * 100)))
    : 100;

  const getSourceBadge = (sourceType: '체크인' | '객실' | '식음료') => {
    switch (sourceType) {
      case '체크인':
        return {
          icon: 'key',
          label: '체크인 적립',
          bg: 'bg-[#C5A059]/15',
          text: 'text-[#E2C28E]',
          border: 'border-[#C5A059]/30'
        };
      case '객실':
        return {
          icon: 'hotel',
          label: '객실(패키지) 적립',
          bg: 'bg-blue-500/15',
          text: 'text-blue-300',
          border: 'border-blue-500/30'
        };
      case '식음료':
        return {
          icon: 'restaurant',
          label: '식음료(F&B) 적립',
          bg: 'bg-rose-500/15',
          text: 'text-rose-300',
          border: 'border-rose-500/30'
        };
      default:
        return {
          icon: 'stars',
          label: '적립',
          bg: 'bg-slate-500/15',
          text: 'text-slate-300',
          border: 'border-slate-500/30'
        };
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Top Bar: Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#162639] border border-[#C9CBCF]/40">
          <span className="w-2 h-2 rounded-full bg-[#C9CBCF] shadow-[0_0_8px_#C9CBCF]"></span>
          <span className="text-[11px] font-extrabold text-[#C9CBCF] tracking-wider">
            {currentTier.englishName}
          </span>
        </div>
      </div>

      {/* 1. TOP: TIER CARD (ETERNITY, #C9CBCF Platinum / Diamond Pavé Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#1E2E44] via-[#162639] to-[#0A1422] border-2 border-[#C9CBCF]/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        {/* Subtle Luxury Pattern Overlays */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#C9CBCF]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Badges */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#C9CBCF]/20 border border-[#C9CBCF]/50 text-[#F1F5F9] font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#C9CBCF]">diamond</span>
              DOUBLING TIER
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">등급 유지 만료일</span>
            <span className="text-xs font-bold text-white font-mono">{user.tierExpiration}</span>
          </div>
        </div>

        {/* Main Tier Branding & Jewel Icon */}
        <div className="mt-4 flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-wide text-white flex items-center gap-1.5">
                <span>{currentTier.englishName}</span>
                <span className="text-sm font-bold text-[#C9CBCF] font-sans">({currentTier.koreanName})</span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {currentTier.jewelryConcept}
            </p>
          </div>

          {/* Platinum Ring / Jewel Emblem */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9CBCF] via-[#94A3B8] to-[#64748B] p-[2px] shadow-[0_0_20px_rgba(201,203,207,0.4)]">
            <div className="w-full h-full bg-[#0D1B2A] rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-[#C9CBCF]">diamond</span>
            </div>
          </div>
        </div>

        {/* Cross-IR Recognition Notice Box */}
        <div className="mt-4 bg-[#0D1B2A]/90 backdrop-blur-sm border border-[#C9CBCF]/40 rounded-2xl p-3.5 relative z-10">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-sm text-[#C5A059] shrink-0 mt-0.5">public</span>
            <div>
              <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider block">
                Cross-IR Tier Recognition
              </span>
              <p className="text-xs font-semibold text-slate-100 leading-snug mt-0.5">
                "이 등급은 마카오뿐 아니라 필리핀·싱가포르 복합리조트에서도 동일하게 인정됩니다"
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* 2. MIDDLE: NEXT TIER PROGRESS (SOLITAIRE 3,800점) */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-5 shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            다음 등급까지 진행률
          </h3>
          <span className="text-xs font-extrabold text-[#D4AF37] font-mono">
            {nextTier ? `다음 등급까지 ${scoreNeeded.toLocaleString()}점 남음` : '최고 등급 달성'}
          </span>
        </div>

        {/* Score Numbers Summary */}
        <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">현재 누적 Tier Score</span>
            <span className="text-lg font-black text-white font-mono">
              {currentScore.toLocaleString()}{' '}
              <span className="text-xs font-bold text-[#C9CBCF]">점</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">
              다음 등급 ({nextTier?.englishName || '최고 등급'}) 임계값
            </span>
            <span className="text-lg font-black text-[#D4AF37] font-mono">
              {nextThreshold.toLocaleString()}{' '}
              <span className="text-xs font-bold text-[#D4AF37]">점</span>
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono font-bold">
            <span className="text-[#C9CBCF]">{currentTier.englishName} ({currentThreshold.toLocaleString()}점)</span>
            <span className="text-[#D4AF37]">{nextTier?.englishName || '최고 등급'} ({nextThreshold.toLocaleString()}점)</span>
          </div>
          <div className="w-full bg-[#0D1B2A] h-3 rounded-full overflow-hidden p-0.5 border border-[#1F334D]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C9CBCF] via-[#E2C28E] to-[#D4AF37] transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-end text-[10px] text-slate-400">
            <span>진행률: <strong className="text-white font-mono">{progressPercent}%</strong></span>
          </div>
        </div>

        {/* 5-Tier Step Path Diagram */}
        <div className="pt-2 border-t border-[#1F334D] mt-1">
          <span className="text-[10px] text-slate-400 font-bold block mb-2">5단계 멤버십 승급 로드맵</span>
          <div className="grid grid-cols-5 gap-1 text-center">
            {MEMBERSHIP_TIERS.map((tier) => {
              const isCurrent = tier.id === currentTier.id;
              const isPast = tier.thresholdScore < currentScore;
              const isNext = tier.id === nextTier?.id;

              return (
                <div
                  key={tier.id}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-between gap-1 transition ${
                    isCurrent
                      ? 'bg-[#C9CBCF]/15 border-[#C9CBCF] ring-1 ring-[#C9CBCF]/60'
                      : isNext
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
                      : isPast
                      ? 'bg-[#0D1B2A] border-[#1F334D] opacity-70'
                      : 'bg-[#0D1B2A]/50 border-[#1F334D]/50 opacity-40'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className={`text-[10px] font-extrabold truncate w-full ${
                    isCurrent ? 'text-white' : isNext ? 'text-[#D4AF37]' : 'text-slate-300'
                  }`}>
                    {tier.englishName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {tier.thresholdScore >= 1000
                      ? `${(tier.thresholdScore / 1000).toFixed(1)}k`
                      : tier.thresholdScore}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] bg-[#C9CBCF] text-[#0D1B2A] font-black px-1 rounded">
                      현재
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM: RECENT ACCRUAL HISTORY (5 Records) */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-base">receipt_long</span>
            <span>최근 Tier Score 적립 내역</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            총 {tierRecords.length}건
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed -mt-1">
          * 실제 호텔 체크인, 객실 패키지 투숙 및 리조트 F&B 이용 시 자동으로 적립된 Cross-IR 실적입니다.
        </p>

        {/* Accrual List */}
        <div className="space-y-2.5">
          {tierRecords.map((record) => {
            const badge = getSourceBadge(record.sourceType);

            return (
              <div
                key={record.id}
                className="bg-[#0D1B2A] border border-[#1F334D] hover:border-[#C5A059]/40 transition p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                {/* Left: Source Icon & Info */}
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${badge.bg} border ${badge.border} flex items-center justify-center ${badge.text} shrink-0 mt-0.5`}>
                    <span className="material-symbols-outlined text-base">{badge.icon}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg} ${badge.border} ${badge.text}`}>
                        {record.sourceType}
                      </span>
                      <span className="font-bold text-white">{record.hotelName}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{record.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{record.date}</span>
                  </div>
                </div>

                {/* Right: +Score */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-sm text-emerald-400 block">
                    +{record.score}점
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">Tier Score</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TIER BENEFITS EXPLORER */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-md flex flex-col gap-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#C5A059] text-base">workspace_premium</span>
          <span>더블링 5단계 등급별 혜택 안내</span>
        </h3>

        {/* Tier Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {MEMBERSHIP_TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setActiveTierTab(tier.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${
                activeTierTab === tier.id
                  ? 'bg-[#0D1B2A] text-white border-[#C5A059] shadow-sm'
                  : 'bg-[#0D1B2A]/50 text-slate-400 border-[#1F334D] hover:text-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              <span>{tier.englishName}</span>
            </button>
          ))}
        </div>

        {/* Selected Tier Detail */}
        {(() => {
          const selected = getTierInfo(activeTierTab);
          const isCurrentTier = activeTierTab === currentTier.id;
          const isHigherTier = tierIndexOf(activeTierTab) > tierIndexOf(currentTier.id);
          const isLowerTier = tierIndexOf(activeTierTab) < tierIndexOf(currentTier.id);

          return (
            <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#1F334D] space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5 whitespace-nowrap">
                      <span style={{ color: selected.color }}>●</span>
                      <span>{selected.englishName}</span>
                    </h4>
                    {isCurrentTier && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#C9CBCF]/20 text-[#F1F5F9] border border-[#C9CBCF]/40 whitespace-nowrap shrink-0">
                        현재
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{selected.jewelryConcept}</p>
                </div>
                <span className="font-mono font-bold text-[#E2C28E] text-xs whitespace-nowrap shrink-0">
                  기준: {selected.thresholdScore.toLocaleString()}점 이상
                </span>
              </div>

              {/* Benefits List with Comp Tags */}
              <div className="space-y-2 pt-2 border-t border-[#1F334D]">
                {selected.benefits.map((b, i) => {
                  const compTag = getBenefitCompTag(b);

                  return (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2.5 p-2 rounded-lg bg-[#162639]/60 border border-[#1F334D]/60 text-slate-200"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="text-xs leading-snug break-keep">{b}</span>
                      </div>

                      {compTag && (
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${compTag.bg} ${compTag.text} border ${compTag.border} shrink-0 whitespace-nowrap mt-0.5`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{compTag.icon}</span>
                          <span>{compTag.label}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Button / Status based on user tier */}
              <div className="pt-2 border-t border-[#1F334D]">
                {isCurrentTier ? (
                  <button
                    onClick={() => setCurrentSubScreen('comp-benefits')}
                    className="w-full py-2.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-md hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">diamond</span>
                    <span>이 등급 혜택 신청하기</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                ) : isHigherTier ? (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-400 text-xs font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-500">lock</span>
                      <span>이 등급 도달 시 신청 가능합니다</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#E2C28E] font-bold">
                      +{(selected.thresholdScore - currentScore).toLocaleString()}점 필요
                    </span>
                  </div>
                ) : (
                  <div className="w-full py-2 px-3 rounded-xl bg-[#162639]/80 border border-[#1F334D] text-slate-400 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
                      <span>현재 상위 등급({currentTier.englishName})에 포함된 기본 혜택입니다</span>
                    </div>
                    <button
                      onClick={() => setCurrentSubScreen('comp-benefits')}
                      className="text-[10px] font-bold text-[#E2C28E] hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>혜택 신청</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 6. POPUP MODAL: "승급 알림 미리보기"
          2026-09-14 비활성화 (삭제하지 않고 주석 보존). 사유: 이 모달을 열던 트리거 버튼이
          속한 "IR 시연용 실시간 알림 시뮬레이션" 박스가 삭제되면서 도달 불가능해짐.
          showUpgradeModal state 자체도 위에서 비활성화되어 있어 `false &&`로 대체함. */}
      {false && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E2E44] via-[#162639] to-[#0D1B2A] border-2 border-[#D4AF37] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-[0_0_40px_rgba(212,175,55,0.4)] animate-in zoom-in-95">
            {/* Celebration Icon Header */}
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] text-3xl shadow-[0_0_20px_rgba(212,175,55,0.5)]">
              <span className="material-symbols-outlined text-3xl">military_tech</span>
            </div>

            {/* Title & Tier Badge */}
            <div>
              <span className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/15 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 inline-block mb-1">
                TIER UPGRADE PREVIEW
              </span>
              <h3 className="text-base font-black text-white leading-tight">
                축하합니다! <br />
                <span className="text-[#D4AF37] text-lg">SOLITAIRE</span> 등급으로 승급하셨습니다
              </h3>
            </div>

            {/* Cross-IR Recognition Core Text */}
            <div className="w-full bg-[#0D1B2A] p-4 rounded-2xl border border-[#D4AF37]/40 text-left text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#D4AF37] text-base shrink-0 mt-0.5">public</span>
                <p className="font-bold text-slate-100 leading-snug">
                  "이 등급은 마카오뿐 아니라 필리핀·싱가포르 복합리조트에서도 동일하게 인정됩니다"
                </p>
              </div>

              <div className="pt-2 border-t border-[#1F334D] space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-[#E2C28E]">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>크로스-IR 최고위 VIP 다이렉트 패스트트랙 체크인</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#E2C28E]">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>전담 버틀러 및 VIP 호스트 1:1 배정</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#E2C28E]">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>리무진 공항 픽업/센딩 연 4회 무료</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 7. POPUP MODAL: "체크인 알림 미리보기"
          2026-09-14 비활성화 (삭제하지 않고 주석 보존). 사유: 위 6번 모달과 동일 —
          트리거 버튼이 속한 데모 박스 삭제로 도달 불가능해짐. */}
      {false && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E2E44] via-[#162639] to-[#0D1B2A] border-2 border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-[0_0_40px_rgba(197,160,89,0.4)] animate-in zoom-in-95 relative">
            {/* Top Close (X) Button */}
            <button
              onClick={() => setShowCheckInModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#0D1B2A] border border-[#1F334D] flex items-center justify-center text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {/* Check-in Hotel Key Icon Header */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
              <span className="material-symbols-outlined text-3xl">key</span>
            </div>

            {/* Title & Badge */}
            <div>
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/40 inline-block mb-1">
                CHECK-IN CONFIRMED
              </span>
              <h3 className="text-base font-black text-white leading-tight">
                Okada Manila <br />
                <span className="text-[#E2C28E] text-lg">체크인이 확인되었습니다</span>
              </h3>
            </div>

            {/* Notification Body Text */}
            <div className="w-full bg-[#0D1B2A] p-4 rounded-2xl border border-[#C5A059]/40 text-left text-xs space-y-2.5">
              <p className="font-semibold text-slate-100 leading-relaxed">
                <strong className="text-[#C9CBCF]">{currentTier.englishName}</strong> 멤버님, 이번 방문 예상 적립 약 <strong className="text-emerald-400">400점</strong> — 다음 등급(<span className="text-[#D4AF37]">{nextTier?.englishName || '최고 등급'}</span>)까지 <strong className="text-[#E2C28E]">{scoreNeeded.toLocaleString()}점</strong> 남았어요
              </p>

              <div className="pt-2 border-t border-[#1F334D] space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>체크인 적립 (확정):</span>
                  <span className="font-mono font-bold text-emerald-400">+150점</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>객실(1+1패키지) 예상:</span>
                  <span className="font-mono font-bold text-blue-300">+250점</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>식음료(F&B) 적립:</span>
                  <span className="text-rose-300 font-medium">실시간 갱신 예정</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-2">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="w-1/3 py-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#1F334D] transition"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setCurrentSubScreen('current-trip-summary');
                }}
                className="w-2/3 py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">luggage</span>
                <span>이번 여행 보기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
