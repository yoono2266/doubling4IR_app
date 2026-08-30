import React from 'react';
import { useApp } from '../context/AppContext';
import { STREAK_MILESTONES } from '../data/streakData';

// 연속 출석 스트릭 공용 컴포넌트. 홈 / 챌린지 / 마이페이지에서 재사용.
// 배포 기준(doubling4ir.ai.studio)과 동일하게: 출석일수는 고정 표시이고,
// 도달한 마일스톤 노드(3/7/14/30일)를 눌러 DP 보너스를 1회 수령한다. (별도 "오늘 출석 체크" 없음)
// AppContext의 mock 상태(attendanceStreak, claimedStreakMilestones)를 구독한다.
export const StreakTracker: React.FC = () => {
  const { attendanceStreak, claimedStreakMilestones, claimStreakReward } = useApp();

  const currentDays = attendanceStreak;
  const isDay7Claimed = claimedStreakMilestones.includes(7);

  return (
    <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#E2C28E]/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <span className="material-symbols-outlined text-lg animate-pulse">local_fire_department</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>연속 출석 스트릭</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 font-extrabold px-1.5 py-0.2 rounded border border-orange-500/30">
                🔥 {currentDays}일째 출석 중
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">출석 마일스톤 달성 시 추가 DP 보너스 지급</p>
          </div>
        </div>

        {/* 7-Day Milestone Claim Button (If eligible and unclaimed) */}
        {isDay7Claimed ? (
          <span className="px-2.5 py-1 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-400 text-[11px] font-bold">
            ✓ 7일 완료
          </span>
        ) : (
          <button
            onClick={() => claimStreakReward(7)}
            className="px-3 py-1.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-[11px] shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-1 animate-bounce"
          >
            <span>7일 달성! +250DP 받기</span>
          </button>
        )}
      </div>

      {/* 4-Step Milestone Progress Bar (3, 7, 14, 30 Days) */}
      <div className="pt-2 pb-1 relative z-10">
        {/* Progress Line */}
        <div className="relative flex items-center justify-between w-full px-4">
          {/* Connector Line Background */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-[#0D1B2A] rounded-full z-0 border border-[#1F334D]">
            {/* Active filled line up to current streak day */}
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-[#C5A059] to-[#E2C28E] rounded-full transition-all duration-700"
              style={{
                width: currentDays >= 30 ? '100%' : currentDays >= 14 ? '66%' : currentDays >= 7 ? '33%' : currentDays >= 3 ? '15%' : '0%'
              }}
            />
          </div>

          {/* 4 Step Checkpoints */}
          {STREAK_MILESTONES.map((milestone) => {
            const isReached = currentDays >= milestone.days;
            const isClaimed = claimedStreakMilestones.includes(milestone.days);
            const isNextTarget = !isClaimed && isReached;

            return (
              <div key={milestone.days} className="flex flex-col items-center gap-1 relative z-10">
                {/* Node Circle */}
                <button
                  disabled={!isReached || isClaimed}
                  onClick={() => claimStreakReward(milestone.days)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isClaimed
                      ? 'bg-emerald-500 text-[#0D1B2A] ring-2 ring-emerald-400/50 shadow-sm'
                      : isNextTarget
                      ? 'bg-gradient-to-br from-[#E2C28E] to-[#C5A059] text-[#0D1B2A] ring-2 ring-[#E2C28E] animate-pulse cursor-pointer shadow-[0_0_12px_rgba(226,194,142,0.6)]'
                      : isReached
                      ? 'bg-[#E2C28E] text-[#0D1B2A]'
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

                {/* Day Label */}
                <span className={`text-[10px] font-bold font-mono ${isReached ? 'text-white' : 'text-slate-500'}`}>
                  {milestone.days}일
                </span>

                {/* Bonus Badge */}
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border whitespace-nowrap ${
                    isClaimed
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : isReached
                      ? 'bg-[#E2C28E]/20 text-[#E2C28E] border-[#E2C28E]/40 font-black'
                      : 'bg-[#0D1B2A] text-slate-500 border-[#1F334D]'
                  }`}
                >
                  +{milestone.reward}DP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
