import React from 'react';
import { MEMBERSHIP_TIERS } from '../../data/membershipData';
import { OfferRoom, getSolaireTierLabel } from '../../data/offerRoomData';

// 2026-09-30: 오퍼 탭 리뉴얼 — 선택한 객실을 부킹하기 위한 최소 등급 조건 표시.
// 왼쪽: 호텔(솔레어) 멤버십 최소 등급 / 오른쪽: DOUBLE RING 멤버십 최소 등급.
// - 솔레어: 회원별 솔레어 등급은 아직 서버에 없어 "내 등급 미연동"으로 표시 (BE 요청 REQ-260930-03)
// - DOUBLE RING: 앱의 user.membershipTier(현재 mock 값)와 최소 등급을 비교해 충족 여부 표시

interface OfferTierStatusProps {
  room: OfferRoom;
  userDrTier: string;
}

const getDrTierIndex = (tier: string): number =>
  MEMBERSHIP_TIERS.findIndex(item => item.englishName === tier || item.id === tier);

export const OfferTierStatus: React.FC<OfferTierStatusProps> = ({ room, userDrTier }) => {
  const userDrIndex = getDrTierIndex(userDrTier);
  const requiredDrIndex = getDrTierIndex(room.requiredDrTier);
  const isDrMet = userDrIndex >= 0 && requiredDrIndex >= 0 && userDrIndex >= requiredDrIndex;
  const userDrLabel = userDrIndex >= 0 ? MEMBERSHIP_TIERS[userDrIndex].englishName : '미확인';

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold text-white">이 객실, 내 멤버십으로 신청할 수 있나요?</h3>
        <p className="mt-0.5 text-[11px] text-slate-400">객실 부킹을 위한 최소 등급 조건이에요.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* 왼쪽: 호텔(솔레어) 멤버십 최소 등급 */}
        <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#1F334D] bg-[#162639] p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-slate-400">솔레어 멤버십</span>
            <span className="shrink-0 rounded-md border border-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
              확인 필요
            </span>
          </div>
          <p className="truncate text-base font-extrabold tracking-wide text-[#E2C28E]">
            {getSolaireTierLabel(room.requiredSolaireTier)} 이상
          </p>
          <p className="border-t border-[#1F334D] pt-2 text-[10px] text-slate-400">내 등급 미연동</p>
        </div>

        {/* 오른쪽: DOUBLE RING 멤버십 최소 등급 */}
        <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-[#1F334D] bg-[#162639] p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-slate-400">DOUBLE RING</span>
            <span
              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                isDrMet ? 'border-[#C5A059]/50 text-[#E2C28E]' : 'border-slate-600 text-slate-400'
              }`}
            >
              {isDrMet ? '충족' : '미충족'}
            </span>
          </div>
          <p className="truncate text-base font-extrabold tracking-wide text-[#E2C28E]">{room.requiredDrTier} 이상</p>
          <p className="border-t border-[#1F334D] pt-2 text-[10px] text-slate-400">내 등급 {userDrLabel}</p>
        </div>
      </div>

      {/* 2026-09-30 주석 처리 (삭제 요청): "솔레어 등급별 신청 가능 여부" 5단계 막대 (펄 → 다이아몬드, 필요 등급부터 금색).
          되살릴 경우 SOLAIRE_TIERS import와 requiredSolaireIndex(SOLAIRE_TIERS.findIndex) 계산도 함께 복구.
      <div className="rounded-2xl border border-[#1F334D] bg-[#0D1B2A] p-3">
        <p className="text-[10px] font-semibold text-slate-400">솔레어 등급별 신청 가능 여부</p>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {SOLAIRE_TIERS.map((tier, index) => {
            const isEligible = index >= requiredSolaireIndex;
            return (
              <div key={tier.id} className="flex min-w-0 flex-col items-center gap-1">
                <span className={`h-1 w-full rounded-sm ${isEligible ? 'bg-[#C5A059]' : 'bg-[#1F334D]'}`} />
                <span className={`truncate text-[10px] font-semibold ${isEligible ? 'text-[#E2C28E]' : 'text-slate-500'}`}>
                  {tier.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      */}
    </section>
  );
};
