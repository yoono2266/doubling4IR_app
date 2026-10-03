import React from 'react';

// 2026-10-03: 마이페이지 "챌린지 참여 내역" 상단의 AI 성향 분석 자리.
// 회원이 참여한 챌린지 결과를 바탕으로 한 성향 AI 분석을 보여줄 예정 — 서버 분석 기능이 없어 "분석 준비 중"만 표시.
// ⚠️ 미연동: BE 요청서 REQ-261003-02 (AI 성향 분석 결과 조회 API). 결과가 오면 이 카드 본문을 분석 결과로 교체.

interface ChallengeAiAnalysisCardProps {
  participatedCount: number;
}

export const ChallengeAiAnalysisCard: React.FC<ChallengeAiAnalysisCardProps> = ({ participatedCount }) => (
  <section
    aria-label="AI 성향 분석"
    className="flex flex-col gap-3 rounded-2xl border border-[#C5A059]/40 bg-[#162639] p-4"
  >
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-white">
        <span className="material-symbols-outlined text-lg text-[#C5A059]">psychology</span>
        AI 성향 분석
      </h3>
      <span className="h-6 shrink-0 rounded-md border border-[#1F334D] bg-[#0D1B2A] px-2 text-[11px] font-bold leading-6 text-slate-400">
        분석 준비 중
      </span>
    </div>
    <p className="text-[13px] leading-relaxed text-slate-300 break-keep">
      참여한 챌린지의 결과가 공개되면, 나의 선택을 바탕으로 AI가 분석한 성향을 이곳에서 보여 드릴 예정이에요.
    </p>
    <p className="text-[11px] tabular-nums text-slate-500">지금까지 참여한 챌린지 {participatedCount}건</p>
  </section>
);
