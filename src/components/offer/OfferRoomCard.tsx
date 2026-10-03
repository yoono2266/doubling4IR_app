import React from 'react';
import { OfferPlan, OfferProduct } from '../../data/offerRoomData';
import { MEMBERSHIP_TIERS } from '../../data/membershipData';

// 2026-10-03: 오퍼 리스트 카드 (전면 개편 — 객실 사진 1장 위에 정보 배치). 카드 1장 = BO 지정 오퍼 상품 1건.
//   좌측 상단 리조트명 / 우측 상단 국가 코드 뱃지
//   하단 좌·우: 리조트 멤버십 / DOUBLE RING 최소 등급 (신청 조건 — 글자만, "명칭 줄바꿈 등급 이상")
//   맨 아래 한 줄: BO가 지정한 오퍼 방식 1개(조건부 1+1 · Free Room · 할인·일반 예약 중 하나) — 누르면 예약 신청서
// 데이터: offerRoomData.ts OFFER_PRODUCTS (mock). 오퍼 상품 API: BE 요청서 REQ-260930-03.
// (같은 날 앞선 버전은 오퍼 방식 3개를 모두 노출했으나, 상품당 1개만 노출하도록 변경)

interface OfferRoomCardProps {
  product: OfferProduct;
  plan: OfferPlan;
  onApply: () => void;
}

const drTierLabel = (englishName: string) =>
  MEMBERSHIP_TIERS.find((tier) => tier.englishName === englishName)?.koreanName ?? englishName;

// 2026-10-03: 사진·리조트 등급명을 상품(product.image·resortTierLabel)에서 직접 사용 (기존: room.image, getSolaireTierLabel(requiredResortTier))
// 2026-10-03: 멤버십 다이닝 카드와 같은 마우스 오버 모션 — 카드에 올리면 사진 0.5초간 105% 확대 (group / group-hover:scale-105)
export const OfferRoomCard: React.FC<OfferRoomCardProps> = ({ product, plan, onApply }) => (
  <article className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#C5A059]/40 bg-[#162639]">
    <img src={product.image} alt={product.resortName} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    {/* 글자 가독성용 위·아래 그라데이션 (사진 가운데는 원본 그대로) */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 to-transparent" />
    {/* 2026-10-03: 등급 글자가 밝은 사진 위에서도 읽히도록 하단 그라데이션 확대 (기존: h-1/2 from-black/80 to-transparent) */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

    {/* 상단: 리조트명 · 국가 코드 */}
    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
      <h3 className="min-w-0 text-[17px] font-extrabold leading-snug text-white break-keep">{product.resortName}</h3>
      <span className="shrink-0 rounded-md border border-[#C5A059]/50 bg-[#0D1B2A]/80 px-2 py-0.5 text-[11px] font-bold tracking-wider text-[#E2C28E]">
        {product.regionCode}
      </span>
    </div>

    {/* 하단: 멤버십 최소 등급(신청 조건) → BO 지정 오퍼 방식 버튼 순서
        2026-10-03 수정: 순서 교체(기존: 오퍼 버튼이 위), 등급은 버튼처럼 보이지 않게 테두리·배경 박스 없이 글자만,
        "명칭 줄바꿈 등급 이상" 두 줄 + 글자 확대 (기존: 11px 한 줄 박스 뱃지) */}
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-3.5">
      {/* 2026-10-03: 리조트 멤버십 / DOUBLE RING 조건을 챌린지 YES·NO와 같은 반투명 사각 구역 2개로 좌우 반반 배치
          (누르는 요소가 아니므로 hover·눌림 효과 없음). 기존: 박스 없이 좌·우 정렬 글자만
          2026-10-03 가독성 수정: 골드 반투명 배경(bg-[#C5A059]/25)이 밝은 사진과 섞여 글자가 흐려짐 →
          네이비 반투명(bg-[#0D1B2A]/80) + 배경 흐림(backdrop-blur-sm), 테두리 골드 60%, 등급 글자 #FFF0D0 → #E2C28E */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[#C5A059]/60 bg-[#0D1B2A]/80 px-2 py-2 text-center backdrop-blur-sm">
          <span className="max-w-full truncate text-[12px] font-semibold leading-tight text-slate-200">{product.resortMembershipName}</span>
          <span className="text-[17px] font-extrabold leading-tight text-[#E2C28E]">
            {product.resortTierLabel} 이상
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[#C5A059]/60 bg-[#0D1B2A]/80 px-2 py-2 text-center backdrop-blur-sm">
          <span className="max-w-full truncate text-[12px] font-semibold leading-tight text-slate-200">DOUBLE RING</span>
          <span className="text-[17px] font-extrabold leading-tight text-[#E2C28E]">
            {drTierLabel(product.requiredDrTier)} 이상
          </span>
        </div>
      </div>
      {/* 2026-10-03: 오퍼 방식 설명 보강 — 기존 오퍼 방식 데이터(OFFER_PLANS)의 headline을 버튼 안 둘째 줄,
          detail(조건)을 버튼 아래 한 줄로 표시 (기존: 버튼에 plan.title 한 줄만, h-10) */}
      {/* 2026-10-03: 멤버십 구역(네이비 반투명, 정보)과 같은 색감이라 구분이 안 되던 문제 → 버튼은 앱 주 버튼과 같은 골드 채움
          (기존: border-[#C5A059]/70 bg-[#0D1B2A]/75 text-[#FFF0D0], hover 시 골드 채움) */}
      <button
        type="button"
        onClick={onApply}
        className="w-full rounded-lg gold-button-gradient px-3 py-2 text-[#0D1B2A] transition hover:brightness-110 active:scale-[0.98]"
      >
        <span className="block text-[15px] font-extrabold leading-tight">{plan.title}</span>
        <span className="mt-0.5 block text-[12px] font-semibold leading-snug text-[#0D1B2A]/80 break-keep">
          {plan.headline}
        </span>
      </button>
      {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 버튼 둘째 줄을 "체류 중 정해진 프로모션을 이행하면 숙박 디포짓 면제"로
          바꾸면서 같은 내용이 반복되어 버튼 아래 ⓘ 조건 줄(plan.detail) 삭제 요청.
      <p className="-mt-1 flex items-start justify-center gap-1 text-center text-[11px] leading-snug text-slate-300 break-keep">
        <span className="material-symbols-outlined text-[13px] text-[#E2C28E]">info</span>
        <span>{plan.detail}</span>
      </p>
      */}
    </div>
  </article>
);
