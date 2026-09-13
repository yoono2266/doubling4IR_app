import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

// 예측 챌린지 화면과 동일한 카테고리 체계를 재사용한다 (PolyMarketScreen.tsx categories 참고).
type CategoryKey = '사회' | '연예' | '정치' | '인물';
type ScopeKey = '전체' | CategoryKey;

const CATEGORY_KEYS: CategoryKey[] = ['사회', '연예', '정치', '인물'];
const SCOPES: ScopeKey[] = ['전체', ...CATEGORY_KEYS];

interface CategoryStat {
  accuracyRate: number; // 정답률 %
  totalVotes: number; // 참여 건수
  profitDp: number; // 누적 수익 DP (음수면 손실)
}

interface LeaderboardUser {
  nickname: string;
  isCurrentUser?: boolean;
  categories: Record<CategoryKey, CategoryStat>;
}

// 2026-09-16: 카테고리 필터 + 누적 수익 DP 표시 추가하면서, 기존에 있던 "전체" 정답률/참여건수
// 하드코딩 값을 카테고리별 mock으로 분해했다. "전체" 값은 아래 categories를 참여건수로
// 가중평균/합산해 화면에서 동적으로 계산한다(하드코딩된 별도 "전체" 값을 따로 두지 않음 —
// 두 값이 어긋나는 걸 방지).
// ⚠️ 실제 서버 데이터가 아닌 mock입니다 — 다른 유저들의 예측 성과는 전부 가상의 수치입니다.
const LEADERBOARD_PRESET_DATA: LeaderboardUser[] = [
  {
    nickname: 'jiyoon_k',
    categories: {
      사회: { accuracyRate: 85, totalVotes: 12, profitDp: 2400 },
      연예: { accuracyRate: 80, totalVotes: 10, profitDp: 1800 },
      정치: { accuracyRate: 90, totalVotes: 15, profitDp: 3200 },
      인물: { accuracyRate: 70, totalVotes: 8, profitDp: 900 },
    },
  },
  {
    nickname: 'marcus_v',
    categories: {
      사회: { accuracyRate: 78, totalVotes: 10, profitDp: 1600 },
      연예: { accuracyRate: 72, totalVotes: 9, profitDp: 1100 },
      정치: { accuracyRate: 80, totalVotes: 11, profitDp: 2000 },
      인물: { accuracyRate: 74, totalVotes: 8, profitDp: 1200 },
    },
  },
  {
    nickname: 'soojin_p',
    categories: {
      사회: { accuracyRate: 70, totalVotes: 14, profitDp: 1500 },
      연예: { accuracyRate: 76, totalVotes: 13, profitDp: 1700 },
      정치: { accuracyRate: 68, totalVotes: 12, profitDp: 900 },
      인물: { accuracyRate: 79, totalVotes: 13, profitDp: 1900 },
    },
  },
  {
    nickname: 'david_lee',
    categories: {
      사회: { accuracyRate: 65, totalVotes: 9, profitDp: 700 },
      연예: { accuracyRate: 72, totalVotes: 8, profitDp: 1000 },
      정치: { accuracyRate: 71, totalVotes: 8, profitDp: 950 },
      인물: { accuracyRate: 68, totalVotes: 8, profitDp: 800 },
    },
  },
  {
    nickname: 'minwoo_9',
    categories: {
      사회: { accuracyRate: 60, totalVotes: 11, profitDp: 500 },
      연예: { accuracyRate: 68, totalVotes: 10, profitDp: 900 },
      정치: { accuracyRate: 66, totalVotes: 10, profitDp: 800 },
      인물: { accuracyRate: 67, totalVotes: 10, profitDp: 850 },
    },
  },
  {
    nickname: 'clara_h',
    categories: {
      사회: { accuracyRate: 58, totalVotes: 8, profitDp: 300 },
      연예: { accuracyRate: 65, totalVotes: 7, profitDp: 600 },
      정치: { accuracyRate: 60, totalVotes: 7, profitDp: 400 },
      인물: { accuracyRate: 61, totalVotes: 7, profitDp: 450 },
    },
  },
  {
    nickname: 'kevin_kr',
    isCurrentUser: true,
    categories: {
      사회: { accuracyRate: 55, totalVotes: 10, profitDp: 200 },
      연예: { accuracyRate: 60, totalVotes: 9, profitDp: 500 },
      정치: { accuracyRate: 57, totalVotes: 9, profitDp: 350 },
      인물: { accuracyRate: 60, totalVotes: 8, profitDp: 450 },
    },
  },
  {
    nickname: 'victor_m',
    categories: {
      사회: { accuracyRate: 52, totalVotes: 12, profitDp: 100 },
      연예: { accuracyRate: 58, totalVotes: 11, profitDp: 400 },
      정치: { accuracyRate: 54, totalVotes: 11, profitDp: 250 },
      인물: { accuracyRate: 56, totalVotes: 10, profitDp: 300 },
    },
  },
  {
    nickname: 'hannah_s',
    categories: {
      사회: { accuracyRate: 50, totalVotes: 8, profitDp: 50 },
      연예: { accuracyRate: 55, totalVotes: 7, profitDp: 250 },
      정치: { accuracyRate: 52, totalVotes: 7, profitDp: 150 },
      인물: { accuracyRate: 55, totalVotes: 8, profitDp: 300 },
    },
  },
  {
    nickname: 'eric_park',
    categories: {
      사회: { accuracyRate: 48, totalVotes: 7, profitDp: -50 },
      연예: { accuracyRate: 53, totalVotes: 6, profitDp: 150 },
      정치: { accuracyRate: 50, totalVotes: 7, profitDp: 50 },
      인물: { accuracyRate: 54, totalVotes: 7, profitDp: 200 },
    },
  },
];

// 선택된 범위(전체 또는 카테고리 하나)에 대한 통계를 계산한다.
// "전체"는 카테고리별 값을 참여건수로 가중평균(정답률)·합산(참여건수, 수익 DP)한다.
const getScopedStat = (user: LeaderboardUser, scope: ScopeKey): CategoryStat => {
  if (scope !== '전체') return user.categories[scope];

  const stats = CATEGORY_KEYS.map((k) => user.categories[k]);
  const totalVotes = stats.reduce((sum, s) => sum + s.totalVotes, 0);
  const profitDp = stats.reduce((sum, s) => sum + s.profitDp, 0);
  const accuracyRate = totalVotes > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.accuracyRate * s.totalVotes, 0) / totalVotes)
    : 0;

  return { accuracyRate, totalVotes, profitDp };
};

export const PolyLeaderboardScreen: React.FC = () => {
  const { setCurrentSubScreen } = useApp();
  const [scope, setScope] = useState<ScopeKey>('전체');

  // 선택된 범위 기준으로 정렬 + 순위 재계산 (카테고리를 바꾸면 순위도 그 카테고리 기준으로 바뀜)
  const ranked = useMemo(() => {
    return LEADERBOARD_PRESET_DATA
      .map((user) => ({ user, stat: getScopedStat(user, scope) }))
      .sort((a, b) => b.stat.accuracyRate - a.stat.accuracyRate)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [scope]);

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Back Button */}
      <button
        onClick={() => setCurrentSubScreen(null)}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 w-fit transition"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>예측 챌린지 목록으로</span>
      </button>

      {/* Top Title & Season Header */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-2.5 shadow-lg relative overflow-hidden">
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

      {/* Individual Stat Card (Completely separate from competition ranking) */}
      <div className="bg-[#121E2C] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md">
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

      {/* Category Scope Tabs: 전체 / 사회 / 연예 / 정치 / 인물 */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
              scope === s
                ? 'bg-[#C5A059] text-[#0D1B2A] border-[#C5A059] font-bold shadow-sm'
                : 'bg-[#162639] text-slate-300 border-[#1F334D] hover:border-[#C5A059]/40'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Ranking List Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-300">
          {scope} 정답률 랭킹 TOP {ranked.length}
        </span>
        <span className="text-[10px] text-slate-400">정렬: 정답률 (%)</span>
      </div>

      {/* Ranking List Table */}
      <div className="flex flex-col gap-2">
        {ranked.map(({ user, stat, rank }) => {
          const isMe = user.isCurrentUser;
          const initial = user.nickname.substring(0, 1).toUpperCase();

          return (
            <div
              key={user.nickname}
              className={`rounded-2xl p-3.5 flex items-center justify-between transition border ${
                isMe
                  ? 'bg-gradient-to-r from-[#1E2E44] to-[#162639] border-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.25)] ring-1 ring-[#C5A059]/50'
                  : 'bg-[#162639] border-[#1F334D]'
              }`}
            >
              {/* Left: Pure Numeric Rank (No badges/trophies) + User Avatar + Nickname */}
              <div className="flex items-center gap-3">
                {/* Pure Numeric Rank (Strictly Numbers Only) */}
                <span
                  className={`w-6 text-center text-sm font-black font-mono ${
                    isMe ? 'text-[#E2C28E]' : rank <= 3 ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {rank}
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
                      {user.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[9px] bg-[#C5A059] text-[#0D1B2A] font-black px-1.5 py-0.2 rounded font-sans">
                        나
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    참여 {stat.totalVotes}건
                  </span>
                </div>
              </div>

              {/* Right: Accuracy Rate (%) + 누적 수익 DP(보조 표시, 정렬 기준 아님) */}
              <div className="text-right flex flex-col items-end">
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-base font-black font-mono ${isMe ? 'text-[#E2C28E]' : 'text-white'}`}>
                    {stat.accuracyRate}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[9px] text-slate-500 font-medium">정답률</span>
                <span
                  className={`text-[9px] font-mono font-bold mt-0.5 ${
                    stat.profitDp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stat.profitDp >= 0 ? '+' : ''}
                  {stat.profitDp.toLocaleString()} DP
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
