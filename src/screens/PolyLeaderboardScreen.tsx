import React from 'react';
import { useApp } from '../context/AppContext';

interface LeaderboardUser {
  rank: number;
  nickname: string;
  accuracyRate: number; // e.g. 82
  totalVotes: number;
  isCurrentUser?: boolean;
}

const LEADERBOARD_PRESET_DATA: LeaderboardUser[] = [
  { rank: 1, nickname: 'jiyoon_k', accuracyRate: 82, totalVotes: 45 },
  { rank: 2, nickname: 'marcus_v', accuracyRate: 76, totalVotes: 38 },
  { rank: 3, nickname: 'soojin_p', accuracyRate: 73, totalVotes: 52 },
  { rank: 4, nickname: 'david_lee', accuracyRate: 69, totalVotes: 33 },
  { rank: 5, nickname: 'minwoo_9', accuracyRate: 65, totalVotes: 41 },
  { rank: 6, nickname: 'clara_h', accuracyRate: 61, totalVotes: 29 },
  { rank: 7, nickname: 'kevin_kr', accuracyRate: 58, totalVotes: 36, isCurrentUser: true },
  { rank: 8, nickname: 'victor_m', accuracyRate: 55, totalVotes: 44 },
  { rank: 9, nickname: 'hannah_s', accuracyRate: 53, totalVotes: 30 },
  { rank: 10, nickname: 'eric_park', accuracyRate: 51, totalVotes: 27 },
];

export const PolyLeaderboardScreen: React.FC = () => {
  const { setCurrentSubScreen, user } = useApp();

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Back Button */}
      <button 
        onClick={() => setCurrentSubScreen(null)}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 w-fit transition"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>예측 챌린지로 돌아가기</span>
      </button>

      {/* Top Title & Season Header */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4.5 flex flex-col gap-2.5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E2C28E]">
              <span className="material-symbols-outlined text-xl">leaderboard</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">이번 시즌 리더보드</h2>
              <p className="text-xs font-semibold text-[#E2C28E] font-mono">2026년 8월 · 정답률 순</p>
            </div>
          </div>
          <span className="text-[10px] bg-[#0D1B2A] text-slate-400 px-2.5 py-1 rounded-full border border-[#1F334D] font-mono">
            월간 시즌제
          </span>
        </div>

        {/* Clear Notice: Monthly Reset / No Lifetime Records */}
        <div className="bg-[#0D1B2A]/90 border border-[#1F334D] rounded-xl px-3 py-2 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
          <span className="material-symbols-outlined text-xs text-slate-400 shrink-0 mt-0.5">info</span>
          <span>
            매월 초기화되는 이번 달 랭킹입니다. 역대 기록은 제공하지 않습니다.
          </span>
        </div>
      </div>

      {/* Ranking List Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-300">정답률 랭킹 TOP 10</span>
        <span className="text-[10px] text-slate-400">정렬: 정답률 (%)</span>
      </div>

      {/* Ranking List Table */}
      <div className="flex flex-col gap-2">
        {LEADERBOARD_PRESET_DATA.map((item) => {
          const isMe = item.isCurrentUser;
          // Generate initial for avatar
          const initial = item.nickname.substring(0, 1).toUpperCase();

          return (
            <div
              key={item.rank}
              className={`rounded-2xl p-3.5 flex items-center justify-between transition border ${
                isMe
                  ? 'bg-gradient-to-r from-[#1E2E44] to-[#162639] border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.25)] ring-1 ring-[#C5A059]/50'
                  : 'bg-[#162639] border-[#1F334D]'
              }`}
            >
              {/* Left: Pure Numeric Rank (No badges/trophies) + User Avatar + Masked Nickname */}
              <div className="flex items-center gap-3">
                {/* Pure Numeric Rank (Strictly Numbers Only) */}
                <span
                  className={`w-6 text-center text-sm font-black font-mono ${
                    isMe ? 'text-[#E2C28E]' : item.rank <= 3 ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {item.rank}
                </span>

                {/* User Initial Avatar (Strictly no badges or tier icons) */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                    isMe
                      ? 'bg-[#C5A059]/20 text-[#E2C28E] border-[#C5A059]/60 font-black'
                      : 'bg-[#0D1B2A] text-slate-300 border-[#1F334D]'
                  }`}
                >
                  {initial}
                </div>

                {/* Nickname & Participation */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold font-mono ${isMe ? 'text-[#E2C28E]' : 'text-slate-200'}`}>
                      {item.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-[#C5A059] text-[#0D1B2A] font-black px-1.5 py-0.2 rounded font-sans">
                        나
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    참여 {item.totalVotes}건
                  </span>
                </div>
              </div>

              {/* Right: Accuracy Rate (%) */}
              <div className="text-right flex flex-col items-end">
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-base font-black font-mono ${isMe ? 'text-[#E2C28E]' : 'text-white'}`}>
                    {item.accuracyRate}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">정답률</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Individual Stat Card (Completely separate from competition ranking) */}
      <div className="mt-2 bg-[#121E2C] border border-[#1F334D] rounded-2xl p-4.5 flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">psychology</span>
            <span className="text-xs font-bold text-slate-200">개인 예측 성향 지표</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D]">
            비경쟁 참고용
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1 max-w-[220px]">
            <h4 className="text-sm font-bold text-white leading-snug">
              당신의 남다른 시각 적중률: <span className="text-[#E2C28E] font-mono font-black text-base">34%</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              소수의견에 투표해 적중한 비율입니다. 이 지표는 순위에 반영되지 않습니다.
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#0D1B2A] border border-[#1F334D] flex flex-col items-center justify-center shrink-0">
            <span className="text-sm font-black text-[#E2C28E] font-mono">34%</span>
            <span className="text-[8px] text-slate-500 font-medium mt-0.5">역발상 적중</span>
          </div>
        </div>
      </div>
    </div>
  );
};
