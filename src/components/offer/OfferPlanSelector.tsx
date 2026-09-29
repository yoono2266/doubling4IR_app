import React, { useState } from 'react';
import { OFFER_PLANS, OfferPlan } from '../../data/offerRoomData';

// 2026-09-30: 오퍼 탭 리뉴얼 — 오퍼 방식 선택 (조건부 1+1 / Free Room / 할인·일반 예약).
// 하나를 고르면 아래 신청 버튼 문구가 바뀌고, 버튼은 onApply(plan)으로 기존 예약 흐름에 넘긴다.
// 💡 게임 포인트 판정·결제 취소·호텔 심사는 서버/운영 처리 대상이며 현재는 신청 흐름만 있는 mock.

interface OfferPlanSelectorProps {
  onApply: (plan: OfferPlan) => void;
}

export const OfferPlanSelector: React.FC<OfferPlanSelectorProps> = ({ onApply }) => {
  const [selectedId, setSelectedId] = useState<OfferPlan['id']>('conditional');
  const selectedPlan = OFFER_PLANS.find(plan => plan.id === selectedId) ?? OFFER_PLANS[0];

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-white">오퍼 방식 선택</h3>

      <div role="radiogroup" aria-label="오퍼 방식" className="flex flex-col gap-2">
        {OFFER_PLANS.map(plan => {
          const isSelected = plan.id === selectedId;
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedId(plan.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${
                isSelected ? 'border-[#C5A059] bg-[#1E324A]' : 'border-[#1F334D] bg-[#162639]'
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  isSelected ? 'border-[#C5A059]' : 'border-slate-500'
                }`}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-[#C5A059]" />}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className={`text-sm font-extrabold ${isSelected ? 'text-[#E2C28E]' : 'text-white'}`}>{plan.title}</span>
                <span className="text-xs font-semibold text-slate-200">{plan.headline}</span>
                <span className="text-[11px] leading-relaxed text-slate-400">{plan.detail}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onApply(selectedPlan)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold text-[#0D1B2A] gold-button-gradient transition hover:brightness-110 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-base">calendar_month</span>
        <span>{selectedPlan.cta}</span>
      </button>
    </section>
  );
};
