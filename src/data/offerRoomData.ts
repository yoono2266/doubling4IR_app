// 2026-09-30: 오퍼 탭 룸 오퍼 리뉴얼용 데이터 (2026-09-30 회의 구조 기준).
// 💡 서버 연동 전 mock 데이터입니다. 객실명·객실별 필요 등급·디포짓 단가는 임시값이며,
//    호텔(솔레어)과 확정되면 교체해야 합니다. 이미지는 솔레어 제공 자료(public/images/offer/solaire).

// 솔레어 멤버십 등급 체계 (낮은 등급 → 높은 등급). 객실 타입마다 신청에 필요한 등급이 다르다.
export const SOLAIRE_TIERS = [
  { id: 'PEARL', label: '펄' },
  { id: 'SAPPHIRE', label: '사파이어' },
  { id: 'EMERALD', label: '에메랄드' },
  { id: 'RUBY', label: '루비' },
  { id: 'DIAMOND', label: '다이아몬드' },
] as const;

export type SolaireTierId = (typeof SOLAIRE_TIERS)[number]['id'];

export const getSolaireTierLabel = (id: SolaireTierId): string =>
  SOLAIRE_TIERS.find(tier => tier.id === id)?.label ?? id;

const OFFER_IMAGE_BASE = '/images/offer/solaire';

export interface OfferHotelImage {
  src: string;
  alt: string;
}

// 솔레어 외관 사진 (낮·밤) — 오퍼 탭 호텔 슬라이드와 잭팟 상세(SREC) 상단 롤링 이미지에서 공용 사용
export const SOLAIRE_EXTERIOR_IMAGES: OfferHotelImage[] = [
  { src: `${OFFER_IMAGE_BASE}/exterior-day.jpg`, alt: '솔레어 리조트 앤 카지노 외관 (낮)' },
  { src: `${OFFER_IMAGE_BASE}/exterior-night.jpg`, alt: '솔레어 리조트 앤 카지노 외관 (밤)' },
];

export const OFFER_HOTEL = {
  nameKo: '솔레어 리조트 앤 카지노',
  nameEn: 'Solaire Resort & Casino',
  location: '필리핀 마닐라, 엔터테인먼트 시티',
  images: SOLAIRE_EXTERIOR_IMAGES,
};

// 멤버십 다이닝 카드에 쓰는 솔레어 뷔페 사진 (기존 외부 스톡 이미지 대체)
export const OFFER_DINING_IMAGE = `${OFFER_IMAGE_BASE}/buffet.jpg`;

export interface OfferRoom {
  id: string;
  name: string;
  summary: string;
  image: string;
  // 신청에 필요한 최소 등급 (mock)
  requiredSolaireTier: SolaireTierId;
  requiredDrTier: string; // MEMBERSHIP_TIERS의 englishName (BAND / HALO / ETERNITY / SOLITAIRE / CROWN)
  pricePerNightDp: number; // 기존 예약 흐름(startBooking)용 박당 디포짓 코인 (mock) — 2026-09-30: 플랫폼 결제 없음으로 현재 미사용
}

export const OFFER_ROOMS: OfferRoom[] = [
  {
    id: 'twin-city',
    name: '디럭스 트윈 시티뷰',
    summary: '더블 침대 2개, 엔터테인먼트 시티 전망',
    image: `${OFFER_IMAGE_BASE}/room-twin-city.jpg`,
    requiredSolaireTier: 'SAPPHIRE',
    requiredDrTier: 'HALO',
    pricePerNightDp: 600,
  },
  {
    id: 'twin-bay',
    name: '디럭스 트윈 베이뷰',
    summary: '더블 침대 2개, 마닐라 베이 전망',
    image: `${OFFER_IMAGE_BASE}/room-twin-bay.jpg`,
    requiredSolaireTier: 'EMERALD',
    requiredDrTier: 'ETERNITY',
    pricePerNightDp: 800,
  },
];

// 오퍼 방식 (2026-09-30 회의): 조건부 1+1 / Free Room / 할인·일반 예약
export type OfferPlanId = 'conditional' | 'free' | 'standard';

export interface OfferPlan {
  id: OfferPlanId;
  title: string;
  headline: string;
  detail: string;
  cta: string;
}

export const OFFER_PLANS: OfferPlan[] = [
  {
    id: 'conditional',
    title: '조건부 1+1',
    headline: '2박 결제하면 2박을 더 드려요 (총 4박)',
    // 2026-09-30 문구 변경 요청 (기존: 체류 중 정해진 게임 포인트를 채우면 결제한 2박을 취소해 드려요.)
    detail: '체류 중 정해진 프로모션을 이행하면 디포짓 2박 면제',
    cta: '1+1 신청하기',
  },
  {
    id: 'free',
    title: 'Free Room',
    headline: '호텔 심사 후 객실을 무료로 제공해요',
    // 2026-09-30 문구 변경 요청 (기존: 호텔 등급과 게임 이력에 따라 승인돼요. 승인되지 않으면 조건부 1+1로 안내해 드려요.)
    // 서비스 표기 규칙에 따라 "더블링" → "DOUBLE RING"
    detail: '고객님의 DOUBLE RING 회원 등급과 보유하신 호텔 멤버십 등급을 심사하여 최적의 상품을 제공합니다.',
    cta: 'Free Room 신청하기',
  },
  {
    id: 'standard',
    title: '할인 · 일반 예약',
    headline: '게임 조건 없이 멤버십 할인가로 예약해요',
    // 2026-09-30 문구 변경 요청 (기존: 일반 예약으로 진행되며 등급에 따라 할인이 적용돼요.)
    detail: '특별 프로모션이 없는 DOUBLE RING만의 멤버십 특가로 제공해 드립니다.',
    cta: '일반 예약하기',
  },
];
