import React, { useState } from 'react';

// 2026-09-27: 예측 챌린지 목록(PolyMarketScreen)·상세(PolyMarketDetailScreen)에 똑같이 복제돼 있던
// "DP 사용 확인" / "투표 완료" 모달을 공용 컴포넌트로 분리하고 UI/UX 정리.
// - ✕ 문자 → 32px 닫기 아이콘 버튼, 라벨 콜론 제거, font-mono → Pretendard tabular-nums, 글자 9~12px → 11~14px
// - 선택 항목(YES/NO)은 칩으로, 프리셋 버튼 높이 48px, 확정 버튼 처리 중 중복 탭 방지(처리 중… 표시)
// - 드롭 섀도우·글로우·깜빡임 제거
// - 완료 모달 "현재 보유 잔액": 기존 mock user.walletDp(헤더 DP와 불일치) → 확인 모달에서 계산한 예상 잔여 포인트
// 투표 API 호출·mock 반영 로직은 각 화면(handleConfirmVote)에 그대로 있다.

export const DP_PRESETS = [100, 500, 1000, 5000];

export const calcExpectedPayout = (amount: number, oddsStr: string): number => {
  const percent = parseFloat(oddsStr.replace(/[^0-9.]/g, '')) || 50;
  const decimal = percent / 100;
  if (decimal <= 0) return amount;
  return Math.round(amount / decimal);
};

const Row: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 ${className}`}>
    <span className="shrink-0 text-xs text-slate-400">{label}</span>
    <span className="min-w-0 text-right text-[13px] text-white">{children}</span>
  </div>
);

export const ChoiceChip: React.FC<{ choice: string; odds?: string }> = ({ choice, odds }) => (
  <span
    className={`h-6 px-2 rounded-md text-xs font-bold border inline-flex items-center gap-1 tabular-nums ${
      choice === 'YES'
        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
        : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
    }`}
  >
    {choice}
    {odds && <span className="font-medium opacity-80">{odds}</span>}
  </span>
);

interface PolyVoteConfirmModalProps {
  category: string;
  title: string;
  choice: string;
  odds: string;
  isRevote: boolean;
  prevAmount?: number;
  walletDp: number;
  selectedAmount: number;
  onSelectAmount: (amount: number) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export const PolyVoteConfirmModal: React.FC<PolyVoteConfirmModalProps> = ({
  category,
  title,
  choice,
  odds,
  isRevote,
  prevAmount,
  walletDp,
  selectedAmount,
  onSelectAmount,
  onCancel,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refund = isRevote ? prevAmount || 100 : 0;
  const maxAvailableDp = walletDp + refund;
  const projectedBalance = walletDp + refund - selectedAmount;
  const isOver = selectedAmount > maxAvailableDp;

  const handleConfirm = async () => {
    if (isSubmitting || isOver) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#162639] border border-[#C5A059]/60 rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059]">how_to_vote</span>
            {isRevote ? '투표 포지션 변경' : 'DP 사용 확인'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="w-8 h-8 -mr-1.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1F334D]/60 transition"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Market Info & Selection */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#C5A059]">{category}</span>
          <p className="text-sm font-bold text-white leading-snug line-clamp-2 break-keep">{title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            선택
            <ChoiceChip choice={choice} odds={odds} />
          </div>
        </div>

        {/* Preset Options (100 / 500 / 1,000 / 5,000 DP) */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs tabular-nums">
            <span className="text-slate-300 font-bold">사용할 DP</span>
            <span className="text-slate-400">보유 {walletDp.toLocaleString()} DP</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 tabular-nums">
            {DP_PRESETS.map((preset) => {
              const isDisabled = preset > maxAvailableDp;
              const isSelected = selectedAmount === preset;

              return (
                <button
                  key={preset}
                  type="button"
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  onClick={() => onSelectAmount(preset)}
                  className={`h-12 rounded-xl text-sm font-bold transition border flex flex-col items-center justify-center leading-tight ${
                    isSelected
                      ? 'bg-[#C5A059] text-[#0D1B2A] border-[#C5A059] font-extrabold'
                      : isDisabled
                      ? 'bg-[#0D1B2A]/40 text-slate-600 border-[#1F334D]/40 cursor-not-allowed'
                      : 'bg-[#0D1B2A] text-slate-200 border-[#1F334D] hover:border-[#C5A059]/60'
                  }`}
                >
                  <span>{preset.toLocaleString()}</span>
                  <span className="text-[10px] font-bold opacity-80">DP</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Cost Summary */}
        <div className="bg-[#0D1B2A] p-3.5 rounded-xl border border-[#1F334D] flex flex-col gap-2.5 tabular-nums">
          <Row label="사용 포인트">
            <span className="text-base font-extrabold text-[#E2C28E]">{selectedAmount.toLocaleString()} DP</span>
          </Row>
          {isRevote && (
            <Row label="기존 투표 반환">
              <span className="font-bold">+{refund.toLocaleString()} DP</span>
            </Row>
          )}
          <Row label="사용 후 잔여 포인트" className="pt-2.5 border-t border-[#1F334D]">
            <span className={`font-bold ${projectedBalance >= 0 ? 'text-white' : 'text-amber-300'}`}>
              {projectedBalance.toLocaleString()} DP
            </span>
          </Row>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-300 font-bold text-sm hover:bg-[#1E2E44] transition"
          >
            취소
          </button>
          <button
            type="button"
            disabled={isOver || isSubmitting}
            onClick={handleConfirm}
            className="h-12 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '처리 중…' : isRevote ? '포지션 변경 확정' : '포인트 사용 확정'}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface PolyVoteResult {
  title: string;
  choice: string;
  odds: string;
  amount: number;
  expectedPayout: number;
  isRevote: boolean;
  participationRewardDp?: number;
  balanceAfter: number;
}

export const PolyVoteResultModal: React.FC<{ result: PolyVoteResult; onClose: () => void }> = ({ result, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-[#162639] border border-[#C5A059]/60 rounded-2xl p-5 w-full max-w-sm flex flex-col items-center gap-4 text-center animate-in zoom-in-95">
      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/70 flex items-center justify-center text-emerald-300">
        <span className="material-symbols-outlined text-3xl">check</span>
      </div>

      <div>
        <h3 className="text-base font-bold text-white">
          {result.isRevote ? '투표 변경 완료' : '예측 챌린지 참여 완료'}
        </h3>
        <p className="text-[13px] text-slate-300 mt-1 break-keep tabular-nums">
          {result.isRevote
            ? `${result.choice} · ${result.amount.toLocaleString()} DP로 변경되었습니다.`
            : `${result.amount.toLocaleString()} DP가 사용되어 투표가 등록되었습니다.`}
        </p>
      </div>

      {/* Instant Participation Reward */}
      {!!result.participationRewardDp && (
        <div className="w-full bg-[#C5A059]/10 border border-[#C5A059]/40 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#E2C28E] text-xl">card_giftcard</span>
            <div className="min-w-0">
              <span className="font-bold text-white text-[13px] block">참여 즉시 보상 지급</span>
              <span className="text-[11px] text-slate-400">정산과 관계없이 바로 적립됩니다</span>
            </div>
          </div>
          <span className="shrink-0 text-sm font-extrabold text-[#E2C28E] tabular-nums">+{result.participationRewardDp} DP</span>
        </div>
      )}

      <div className="w-full bg-[#0D1B2A] p-3.5 rounded-xl border border-[#1F334D] text-left flex flex-col gap-2.5 tabular-nums">
        <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 break-keep">{result.title}</p>
        <Row label="선택" className="pt-2.5 border-t border-[#1F334D]">
          <ChoiceChip choice={result.choice} odds={result.odds} />
        </Row>
        <Row label="투표 금액">
          <span className="font-bold">{result.amount.toLocaleString()} DP</span>
        </Row>
        <Row label="적중 시 예상 획득">
          <span className="font-bold text-[#E2C28E]">약 {result.expectedPayout.toLocaleString()} DP</span>
        </Row>
        <Row label="예상 잔여 포인트" className="pt-2.5 border-t border-[#1F334D]">
          <span className="font-bold">{result.balanceAfter.toLocaleString()} DP</span>
        </Row>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full h-12 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition"
      >
        확인
      </button>
    </div>
  </div>
);
