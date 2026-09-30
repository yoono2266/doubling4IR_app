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
          {/* 2026-09-30: 뱃지가 작아 보여 크기 조정 — 위아래 여백 2px → 6px(py-1.5), 모서리 4px → 8px(rounded-lg),
              좌우 여백 8px·글자 16px 유지 (기존: px-2 py-0.5 rounded) */}
          <span className="text-base bg-orange-500/20 text-orange-300 font-extrabold px-2 py-1.5 rounded-lg border border-orange-500/30 animate-bounce leading-none">
            🔥 {currentDays}일째 출석 중
          </span>
        </div>
      </div>

      {/* 4-Step Milestone Progress Bar (3, 7, 14, 30 Days)
          2026-09-30 FE 수정 (BE 기준 컴포넌트 — 사용자 승인 후 수정, 패치노트에 별도 기재):
          작은 모바일 화면에서 노드 사이 구간이 DP 뱃지 폭에 밀려 10px 안팎으로 줄어 빨간 진행 화살표가
          찌그러져 보이던 문제 → 4칸 균등 격자로 바꾸고, 연결선은 원 중심 사이에 따로 그려 항상 한 칸 폭을 확보.
          표시 규칙(4일 미만 화살표 숨김, 첫 구간 비움)·3단계 색·보상 수령 동작·빨간 진행 색은 그대로. */}
      <div className="pt-7 pb-1 relative z-10">
        <div className="grid grid-cols-4 w-full px-1">
          {STREAK_MILESTONES.map((milestone, index) => {
            const isReached = currentDays >= milestone.days;
            const isClaimed = claimedStreakMilestones.includes(milestone.days);
            const isNextTarget = !isClaimed && isReached;
            const isActiveGap = !isReached && nextProgress?.nextMilestoneDays === milestone.days;
            const showProgressArrow = isActiveGap && currentDays >= 4;
            const isFirstSegment = index === 0;

            return (
              <div key={milestone.days} className="relative flex flex-col items-center gap-1 min-w-0">
                {/* 직전 노드 → 이 노드 연결선: 원(28px) 중심 높이(14px)에서, 양쪽 원 가장자리 4px 바깥까지 */}
                {!isFirstSegment && (
                  <div className="absolute top-[14px] right-[calc(50%+18px)] w-[calc(100%-36px)] -translate-y-1/2 flex items-center">
                    {showProgressArrow ? (
                      <div className="relative w-full flex items-center pr-[2px]">
                        <div className="w-full h-1 bg-red-500 rounded-full" />
                        <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[9px] border-l-red-500" />
                      </div>
                    ) : (
                      <div
                        className={`w-full h-1 rounded-full ${
                          isReached
                            ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400'
                            : 'bg-transparent border border-dashed border-slate-600/40'
                        }`}
                      />
                    )}
                  </div>
                )}

                {/* D-N 라벨: 연결선 가운데 위 */}
                {showProgressArrow && nextProgress && (
                  <div className="absolute -top-[22px] right-[calc(50%+18px)] w-[calc(100%-36px)] flex justify-center pointer-events-none">
                    <span className="whitespace-nowrap rounded-full border border-red-500/40 bg-red-500/15 px-1.5 py-px text-[11px] font-black leading-none tabular-nums text-red-400">
                      D-{nextProgress.daysRemaining}
                    </span>
                  </div>
                )}

                {/* Node Circle */}
                <button
                  disabled={!isReached || isClaimed}
                  onClick={() => claimStreakReward(milestone.days)}
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
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

                {/* Day Label — 화면 폭 비례 (최대 13px, 최소 10px). 고정폭 font-mono → 기본 글꼴 tabular-nums */}
                <span className={`text-[clamp(10px,3.3vw,13px)] font-bold tabular-nums ${isReached ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {milestone.days}일
                </span>

                {/* Bonus Badge — 3단계 색은 기존과 동일.
                    2026-09-30 재조정(요청: 너무 작아 보임 → 이전 크기로): 375px 이상 화면은 이전과 같은 12px·좌우 여백 6px,
                    그보다 좁은 화면에서만 칸(약 60~70px)을 넘지 않게 화면 폭 비례로 축소(최소 10px). */}
                <span
                  className={`max-w-full text-[clamp(10px,3.2vw,12px)] font-bold leading-tight tabular-nums px-1 min-[375px]:px-1.5 py-px rounded-full border whitespace-nowrap ${
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
            );
          })}
        </div>
      </div>

      {/* 2026-09-30 비활성화 (삭제하지 않고 주석 보존). 사유: 위 4칸 균등 격자 구조로 교체 (작은 화면에서 진행 화살표 찌그러짐).
          BE 원본 구조이므로 BE 반영 여부 확인 전까지 보존 — 복구 시 위 격자 블록을 지우고 아래 false를 제거. */}
      {false && (
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
      )}
    </div>
  );
};
