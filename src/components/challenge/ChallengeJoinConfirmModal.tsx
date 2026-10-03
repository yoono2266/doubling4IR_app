import React from 'react';
import { CHALLENGE_REWARD_DP } from './challengeConfig';

// 2026-10-03: 챌린지 참여 확인 창 (DP 금액 선택 없이 YES/NO 확정 + 즉시 DP 지급 안내, 선택 변경 불가)

interface ChallengeJoinConfirmModalProps {
  category: string;
  title: string;
  choice: 'YES' | 'NO';
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ChallengeJoinConfirmModal: React.FC<ChallengeJoinConfirmModalProps> = ({
  category,
  title,
  choice,
  isSubmitting,
  onCancel,
  onConfirm,
}) => {
  const isYes = choice === 'YES';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="챌린지 참여 확인"
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[#C5A059] bg-[#162639] p-5 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <span className="self-start h-6 px-2 rounded-md text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 border border-[#C5A059]/40 inline-flex items-center">
            {category}
          </span>
          <p className="text-[15px] font-bold leading-snug text-white break-keep">{title}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-[#1F334D] bg-[#0D1B2A] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">내 선택</span>
            <span className={`text-sm font-extrabold ${isYes ? 'text-emerald-300' : 'text-rose-300'}`}>{choice}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#1F334D] pt-2">
            <span className="text-xs text-slate-400">참여 보상</span>
            <span className="text-sm font-extrabold tabular-nums text-[#E2C28E]">+{CHALLENGE_REWARD_DP} DP 즉시 지급</span>
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-slate-400 break-keep">
          참여 후에는 선택을 바꿀 수 없어요. 참여 인원이 100명이 되면 결과가 공개됩니다.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 rounded-xl border border-[#1F334D] bg-[#0D1B2A] text-[13px] font-bold text-slate-300 transition hover:text-white disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-11 rounded-xl gold-button-gradient text-[13px] font-extrabold text-[#0D1B2A] transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? '참여 중...' : `${choice}로 참여하기`}
          </button>
        </div>
      </div>
    </div>
  );
};
