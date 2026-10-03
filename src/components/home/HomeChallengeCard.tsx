import React from 'react';
import { PolyMarketItem } from '../../data/polyMarketData';
import { ChallengeCardBackground } from '../challenge/ChallengeCardBackground';
import { ChallengeVotePanel } from '../challenge/ChallengeVotePanel';

// 2026-10-03: 홈 피드의 챌린지 카드 (챌린지 목록 카드와 같은 구성 — 카테고리 배경 35%, 카테고리·제목, YES/NO 또는 내 선택·의견 수집중).
// 참여 확인 창은 HomeScreen에서 하나만 띄운다(onSelect → useChallengeJoin.requestJoin).

interface HomeChallengeCardProps {
  market: PolyMarketItem;
  myChoice?: string;
  onOpen: () => void;
  onSelect: (choice: 'YES' | 'NO', e: React.MouseEvent) => void;
}

export const HomeChallengeCard: React.FC<HomeChallengeCardProps> = ({ market, myChoice, onOpen, onSelect }) => (
  <div
    onClick={onOpen}
    className="relative isolate overflow-hidden bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#C5A059]/50 transition cursor-pointer"
  >
    <ChallengeCardBackground category={market.category} />
    <span className="self-start h-6 px-2 rounded-md text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 border border-[#C5A059]/40 inline-flex items-center">
      {market.category}
    </span>
    <div className="flex items-start justify-between gap-2">
      <h3 className="text-[15px] font-bold text-white leading-snug break-keep">{market.title}</h3>
      <span className="material-symbols-outlined text-lg text-slate-500 shrink-0">chevron_right</span>
    </div>
    <ChallengeVotePanel market={market} myChoice={myChoice} onSelect={onSelect} />
  </div>
);
