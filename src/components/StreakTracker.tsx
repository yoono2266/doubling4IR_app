import React from 'react';
import { useApp } from '../context/AppContext';
import { STREAK_MILESTONES, getNextMilestoneProgress } from '../data/streakData';

// 연속 출석 스트릭 공용 컴포넌트. 마이페이지 / 챌린지 탭에서 재사용.
// 배포 기준(doubling4ir.ai.studio)과 동일하게: 출석일수는 고정 표시이고,
// 도달한 마일스톤 노드(3/7/14/30일)를 눌러 DP 보너스를 1회 수령한다. (별도 "오늘 출석 체크" 없음)
// AppContext의 mock 상태(attendanceStreak, claimedStreakMilestones)를 구독한다.
export const StreakTracker: React.FC = () => {
  const { attendanceStreak, claimedStreakMilestones, claimStreakReward } = useApp();

  const currentDays = attendanceStreak;
  // 아직 도달하지 못한 다음 마일스톤까지 남은 일수 — 그 구간에만 진행 화살표 표시 (2026-09-20, 기획 확정)
  const nextProgress = getNextMilestoneProgress(currentDays);

  return (
    <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#E2C28E]/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
          <span className="material-symbols-outlined text-lg animate-pulse">local_fire_department</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-black text-white leading-none">연속 출석 현황</h3>
          <span className="text-base bg-orange-500/20 text-orange-300 font-extrabold px-2 py-0.5 rounded border border-orange-500/30 animate-bounce leading-none">
            🔥 {currentDays}일째 출석 중
          </span>
        </div>
      </div>

      {/* 4-Step Milestone Progress Bar (3, 7, 14, 30 Days) */}
      <div className="pt-5 pb-1 relative z-10">
        <div className="flex items-center w-full px-2">
          {STREAK_MILESTONES.map((milestone, index) => {
            const isReached = currentDays >= milestone.days;
            const isClaimed = claimedStreakMilestones.includes(milestone.days);
            const isNextTarget = !isClaimed && isReached;
            // 다음 목표 마일스톤(D-day가 걸쳐있는 구간의 도착 지점) — 진행 화살표뿐 아니라
            // 해당 노드/DP 배지도 강조(파란 링 + 골드 배경)한다.
            const isActiveGap = !isReached && nextProgress?.nextMilestoneDays === milestone.days;
            // 연속 출석 4일 미만이면 D-day/화살표는 노출하지 않는다 (2026-09-20, 기획 확정).
            // 노드·DP 배지 강조는 그대로 유지 — "다음 목표"라는 정보 자체는 계속 보여준다.
            const showProgressArrow = isActiveGap && currentDays >= 4;
            // 첫 번째 구간(시작~첫 마일스톤)은 왼쪽에 실제 노드가 없어 "이어지는 진행선"이라는
            // 개념 자체가 성립하지 않는다 — 색이 있든 점선이든 어떤 선도 그리지 않고 완전히
            // 비워둔다(레이아웃 간격 유지를 위해 컨테이너는 남기되 내용만 제거). (2026-09-21, 기획 확정)
            const isFirstSegment = index === 0;

            return (
              <React.Fragment key={milestone.days}>
                {/* 이 마일스톤 직전 구간 (진행 화살표는 현재 진행 중인 구간에만 노출). */}
                <div className="flex-1 relative h-1 flex items-center">
                  {!isFirstSegment && (
                    showProgressArrow ? (
                      <div className="relative w-full flex items-center">
                        <div className="w-full h-[3px] bg-red-500 rounded-full" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-red-500" />
                      </div>
                    ) : (
                      <div
                        className={`w-full h-1 rounded-full ${
                          isReached
                            ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400'
                            : 'bg-transparent border border-dashed border-slate-600/40'
                        }`}
                      />
                    )
                  )}
                  {showProgressArrow && nextProgress && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-red-500 text-[10px] font-black leading-none">
                        D-{nextProgress.daysRemaining}
                      </span>
                    </div>
                  )}
                </div>

                {/* Node Circle */}
                <div className="flex flex-col items-center gap-1 relative z-10 shrink-0">
                  <button
                    disabled={!isReached || isClaimed}
                    onClick={() => claimStreakReward(milestone.days)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isClaimed
                        ? 'bg-emerald-500 text-[#0D1B2A] ring-2 ring-emerald-400/50 shadow-sm'
                        : isNextTarget
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#0D1B2A] ring-2 ring-emerald-300 animate-pulse cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                        : isActiveGap
                        ? 'bg-gradient-to-br from-[#E2C28E] to-[#C5A059] text-[#0D1B2A] ring-2 ring-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.6)]'
                        : 'bg-[#0D1B2A] text-slate-500 border border-[#1F334D]'
                    }`}
                    title={`${milestone.days}일 마일스톤 (+${milestone.reward} DP)`}
                  >
                    {isClaimed ? (
                      <span className="material-symbols-outlined text-sm font-black">check</span>
                    ) : (
                      <span>{milestone.days}</span>
                    )}
                  </button>

                  {/* Day Label — 요청에 따라 기존 대비 30% 확대 (10px → 13px). 완료(도달) 시 초록 계열 */}
                  <span className={`text-[13px] font-bold font-mono ${isReached ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {milestone.days}일
                  </span>

                  {/* Bonus Badge — 요청에 따라 기존 대비 30% 확대 (9px → 12px).
                      3단계 색상: 완료(초록) / 다음 목표(골드) / 미래(회색) — claimed 여부와 무관하게
                      "완료(도달)" 단계는 항상 초록으로 통일한다. (2026-09-21, 기획 확정) */}
                  <span
                    className={`text-[12px] font-mono font-bold px-1.5 py-0.2 rounded-full border whitespace-nowrap ${
                      isReached
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black'
                        : isActiveGap
                        ? 'bg-[#E2C28E]/20 text-[#E2C28E] border-[#E2C28E]/40 font-black'
                        : 'bg-[#0D1B2A] text-slate-500 border-[#1F334D]'
                    }`}
                  >
                    +{milestone.reward.toLocaleString()}DP
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
