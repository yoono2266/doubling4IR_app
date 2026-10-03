import React from 'react';
import { PolyMarketItem } from '../../data/polyMarketData';
import { PolyOddsBar, PolyVoteButtons } from '../PolyVoteControls';
import { CHALLENGE_RESULT_THRESHOLD, isChallengeResultOpen } from './challengeConfig';

// 2026-10-03: 챌린지 카드·상세·홈 캐러셀 공용 참여 영역.
// - 참여 전: YES / NO 선택 버튼만 (여론 막대 없음)
// - 참여 후, 참여 인원 100명 전: 내 선택 + "의견 수집중" 안내
// - 참여 후, 100명 도달: 내 선택 + YES/NO 비율 막대·%

interface ChallengeVotePanelProps {
  market: PolyMarketItem;
  myChoice?: string;
  onSelect: (choice: 'YES' | 'NO', e: React.MouseEvent) => void;
  size?: 'md' | 'lg';
}

export const ChallengeVotePanel: React.FC<ChallengeVotePanelProps> = ({ market, myChoice, onSelect, size = 'md' }) => {
  if (!myChoice) {
    return <PolyVoteButtons onVote={onSelect} size={size} />;
  }

  const isYes = myChoice === 'YES';
  const choiceBadge = (
    <span
      className={`h-6 px-2 rounded-md text-xs font-bold border inline-flex items-center gap-1 ${
        isYes ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
      }`}
    >
      <span className="material-symbols-outlined text-sm">check_circle</span>
      내 선택 {myChoice}
    </span>
  );

  if (isChallengeResultOpen(market)) {
    return (
      <div className="flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          {choiceBadge}
          <span className="text-[11px] font-semibold text-slate-400">결과 공개</span>
        </div>
        <PolyOddsBar yesValue={market.yesValue} noValue={market.noValue} />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-[#1F334D] bg-[#0D1B2A] px-3 py-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      {choiceBadge}
      <div className="flex min-w-0 flex-col items-end text-right">
        <span className="flex items-center gap-1 text-[13px] font-bold text-[#E2C28E]">
          <span className="material-symbols-outlined animate-pulse text-base">hourglass_top</span>
          의견 수집중
        </span>
        <span className="text-[11px] text-slate-400 break-keep">참여 {CHALLENGE_RESULT_THRESHOLD}명이 모이면 결과가 공개돼요</span>
      </div>
    </div>
  );
};
