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
    // 2026-10-03 문구 변경 요청 (기존: 2박 결제하면 2박을 더 드려요 (총 4박))
    headline: '체류 중 정해진 프로모션을 이행하면 숙박 디포짓 면제',
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

// 2026-10-03: BO에서 지정하는 오퍼 상품 (mock). 오퍼 카드 1장 = 상품 1건, 오퍼 방식은 상품당 하나
// (조건부 1+1 · Free Room · 할인·일반 예약 중 BO가 지정한 하나만 노출).
// 서버 제공 전 FE 정적 데이터 — 오퍼 상품 목록 API: BE 요청서 REQ-260930-03 (상품 단위로 보완 요청 예정)
// - 2026-10-03 1차: 솔레어 엔터테인먼트 시티 | 에메랄드 | 밴드 | 조건부 1+1 (사용자 지정)
// - 2026-10-03 2차: 사용자 제공 표 기준 20건 추가 (리조트명 | 리조트 멤버십 | 3등급 | DOUBLE RING 멤버십 | 오퍼 방식), 표 순서 그대로.
//   표의 'SOLITARE'는 'SOLITAIRE' 오타로 보고 통일. 리조트 사진은 사용자 제공(public/images/offer/resorts),
//   객실 정보가 없어 예약 신청서 객실명은 '스위트'로 통일(사용자 지정).
// - 필드 변경: roomId(OFFER_ROOMS 연결) → image·roomName 직접 보유, requiredResortTier(솔레어 등급 enum) → resortTierLabel(리조트별 등급명 문자열)
const OFFER_RESORT_IMAGE_BASE = '/images/offer/resorts';

export interface OfferProduct {
  id: string;
  resortName: string;
  resortMembershipName: string; // 리조트(호텔) 멤버십 이름 — BO 상품 데이터에서 받아 오는 값 (예: 솔레어 리워즈). 카드 조건 구역 첫 줄에 표시
  regionCode: 'MO' | 'PH' | 'SG' | 'JP';
  image: string; // 카드 사진
  roomName: string; // 예약 신청서 객실명
  resortTierLabel: string; // 신청에 필요한 리조트 멤버십 최소 등급 이름 (예: 에메랄드, 다이아몬드)
  requiredDrTier: string; // 신청에 필요한 DOUBLE RING 최소 등급 (MEMBERSHIP_TIERS englishName)
  planId: OfferPlanId; // BO 지정 오퍼 방식 1개
}

export const OFFER_PRODUCTS: OfferProduct[] = [
  {
    id: 'venetian-macao-conditional-01',
    resortName: '베네시안 마카오',
    resortMembershipName: '샌즈 리워즈',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/venetian-macao.jpg`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'BAND',
    planId: 'conditional',
  },
  {
    id: 'londoner-macao-free-01',
    resortName: '런던어 마카오',
    resortMembershipName: '샌즈 리워즈',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/londoner-macao.jpg`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'HALO',
    planId: 'free',
  },
  {
    id: 'parisian-macao-standard-01',
    resortName: '파리지앵 마카오',
    resortMembershipName: '샌즈 리워즈',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/parisian-macao.webp`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'ETERNITY',
    planId: 'standard',
  },
  {
    id: 'sands-macao-conditional-01',
    resortName: '샌즈 마카오',
    resortMembershipName: '샌즈 리워즈',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/sands-macao.jpg`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'SOLITAIRE',
    planId: 'conditional',
  },
  {
    id: 'galaxy-macau-free-01',
    resortName: '갤럭시 마카오',
    resortMembershipName: 'GEG Privilege Club',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/galaxy-macau.webp`,
    roomName: '스위트',
    resortTierLabel: '블랙',
    requiredDrTier: 'CROWN',
    planId: 'free',
  },
  {
    id: 'starworld-macau-standard-01',
    resortName: '스타월드 마카오',
    resortMembershipName: 'GEG Privilege Club',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/starworld-macau.webp`,
    roomName: '스위트',
    resortTierLabel: '블랙',
    requiredDrTier: 'BAND',
    planId: 'standard',
  },
  {
    id: 'mgm-cotai-conditional-01',
    resortName: 'MGM 코타이',
    resortMembershipName: 'MGM 리워즈',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/mgm-cotai.jpg`,
    roomName: '스위트',
    resortTierLabel: '골드',
    requiredDrTier: 'HALO',
    planId: 'conditional',
  },
  {
    id: 'mgm-macau-free-01',
    resortName: 'MGM 마카오',
    resortMembershipName: 'MGM 리워즈',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/mgm-macau.jpg`,
    roomName: '스위트',
    resortTierLabel: '골드',
    requiredDrTier: 'ETERNITY',
    planId: 'free',
  },
  {
    id: 'wynn-palace-standard-01',
    resortName: '윈 팰리스',
    resortMembershipName: '윈 리워즈 마카오',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/wynn-palace.jpeg`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'SOLITAIRE',
    planId: 'standard',
  },
  {
    id: 'wynn-macau-conditional-01',
    resortName: '윈 마카오',
    resortMembershipName: '윈 리워즈 마카오',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/wynn-macau.jpeg`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'CROWN',
    planId: 'conditional',
  },
  {
    id: 'city-of-dreams-macau-free-01',
    resortName: '시티 오브 드림스 (마카오)',
    resortMembershipName: '멜코 클럽',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/city-of-dreams-macau.webp`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'BAND',
    planId: 'free',
  },
  {
    id: 'studio-city-standard-01',
    resortName: '스튜디오 시티',
    resortMembershipName: '멜코 클럽',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/studio-city.webp`,
    roomName: '스위트',
    resortTierLabel: '다이아몬드',
    requiredDrTier: 'HALO',
    planId: 'standard',
  },
  {
    id: 'grand-lisboa-palace-conditional-01',
    resortName: '그랜드 리스보아 팰리스',
    resortMembershipName: 'SJM 슈프림 카드',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/grand-lisboa-palace.webp`,
    roomName: '스위트',
    resortTierLabel: '플래티넘',
    requiredDrTier: 'ETERNITY',
    planId: 'conditional',
  },
  {
    id: 'grand-lisboa-free-01',
    resortName: '그랜드 리스보아',
    resortMembershipName: 'SJM 슈프림 카드',
    regionCode: 'MO',
    image: `${OFFER_RESORT_IMAGE_BASE}/grand-lisboa.webp`,
    roomName: '스위트',
    resortTierLabel: '플래티넘',
    requiredDrTier: 'SOLITAIRE',
    planId: 'free',
  },
  {
    id: 'solaire-ec-conditional-01',
    resortName: '솔레어 엔터테인먼트 시티',
    resortMembershipName: '솔레어 리워즈', // 2026-10-03: 솔레어 멤버십 정식 명칭 (기존: '솔레어')
    regionCode: 'PH',
    image: `${OFFER_IMAGE_BASE}/room-twin-city.jpg`, // 기존 객실 카드 사진 유지 (기존 필드: roomId 'twin-city')
    roomName: '디럭스 트윈 시티뷰',
    resortTierLabel: '에메랄드', // 기존 필드: requiredResortTier 'EMERALD'
    requiredDrTier: 'BAND',
    planId: 'conditional',
  },
  {
    id: 'okada-manila-standard-01',
    resortName: '오카다 마닐라',
    resortMembershipName: '리워드 써클',
    regionCode: 'PH',
    image: `${OFFER_RESORT_IMAGE_BASE}/okada-manila.webp`,
    roomName: '스위트',
    resortTierLabel: '프리미엄',
    requiredDrTier: 'CROWN',
    planId: 'standard',
  },
  {
    id: 'newport-world-free-01',
    resortName: '뉴포트 월드 리조트',
    resortMembershipName: '에픽 리워즈',
    regionCode: 'PH',
    image: `${OFFER_RESORT_IMAGE_BASE}/newport-world.jpg`,
    roomName: '스위트',
    resortTierLabel: '로즈 골드',
    requiredDrTier: 'BAND',
    planId: 'free',
  },
  {
    id: 'city-of-dreams-manila-standard-01',
    resortName: '시티 오브 드림스 마닐라',
    resortMembershipName: '멜코 클럽',
    regionCode: 'PH',
    image: `${OFFER_RESORT_IMAGE_BASE}/city-of-dreams-manila.webp`,
    roomName: '스위트',
    resortTierLabel: '플래티넘',
    requiredDrTier: 'HALO',
    planId: 'standard',
  },
  {
    id: 'hann-casino-clark-conditional-01',
    resortName: '한 카지노 리조트 (클락)',
    resortMembershipName: '한 리워즈',
    regionCode: 'PH',
    image: `${OFFER_RESORT_IMAGE_BASE}/hann-casino-clark.avif`,
    roomName: '스위트',
    resortTierLabel: '로열',
    requiredDrTier: 'ETERNITY',
    planId: 'conditional',
  },
  {
    id: 'marina-bay-sands-free-01',
    resortName: '마리나 베이 샌즈',
    resortMembershipName: 'Sands LifeStyle',
    regionCode: 'SG',
    image: `${OFFER_RESORT_IMAGE_BASE}/marina-bay-sands.avif`,
    roomName: '스위트',
    resortTierLabel: '엘리트',
    requiredDrTier: 'SOLITAIRE',
    planId: 'free',
  },
  {
    id: 'resorts-world-sentosa-standard-01',
    resortName: '리조트 월드 센토사',
    resortMembershipName: '겐팅 리워즈',
    regionCode: 'SG',
    image: `${OFFER_RESORT_IMAGE_BASE}/resorts-world-sentosa.avif`,
    roomName: '스위트',
    resortTierLabel: '골드',
    requiredDrTier: 'CROWN',
    planId: 'standard',
  },
];
