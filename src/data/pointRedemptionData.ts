// 포인트 사용처(더블링 포인트 상품 교환) mock 데이터.
// 실제 서버 상품/재고 연동이 아니며, 전부 클라이언트 mock 카탈로그입니다.
// 이미지는 프로젝트에 이미 있는 Unsplash 라이선스 이미지(jackpotData.ts, compBenefitData.ts,
// FreeRoomScreen.tsx에서 사용 중인 URL)를 재사용합니다 — 새 서드파티 이미지 URL 추가 없음.

export type PointProductCategoryId = 'hotel_voucher' | 'dining_voucher' | 'other';

export interface PointProductCategory {
  id: PointProductCategoryId;
  title: string;
  subtitle: string;
  icon: string;
  image: string;
}

export interface PointProduct {
  id: string;
  categoryId: PointProductCategoryId;
  name: string;
  description: string;
  dpCost: number;
  validUntil: string; // 유효기간 안내 문구
  image: string;
}

export const POINT_PRODUCT_CATEGORIES: PointProductCategory[] = [
  {
    id: 'hotel_voucher',
    title: '호텔 바우처',
    subtitle: '더블링 제휴 리조트 객실 1박 이용권',
    icon: 'hotel',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'dining_voucher',
    title: '호텔 식음료권',
    subtitle: '파인다이닝 · 뷔페 · 라운지 이용권',
    icon: 'restaurant',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'other',
    title: '기타 상품',
    subtitle: '기프트카드 · 굿즈 · 프리미엄 서비스',
    icon: 'redeem',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80'
  }
];

export const POINT_PRODUCTS: PointProduct[] = [
  // --- 호텔 바우처 ---
  {
    id: 'hv-solaire-suite',
    categoryId: 'hotel_voucher',
    name: '솔레어 리조트 이그제큐티브 스위트 1박 이용권',
    description: '필리핀 마닐라 엔터테인먼트 시티, 솔레어 리조트 앤 카지노의 이그제큐티브 오션뷰 스위트룸 1박 무료 이용권입니다.',
    dpCost: 8000,
    validUntil: '발급일로부터 6개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'hv-okada-deluxe',
    categoryId: 'hotel_voucher',
    name: '오카다 마닐라 디럭스룸 1박 이용권',
    description: '황금빛 외관과 세계 최대급 분수쇼로 유명한 오카다 마닐라의 디럭스룸 1박 무료 이용권입니다.',
    dpCost: 6000,
    validUntil: '발급일로부터 6개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'hv-mbs-premier',
    categoryId: 'hotel_voucher',
    name: '마리나 베이 샌즈 프리미어룸 1박 이용권',
    description: '싱가포르의 랜드마크, 마리나 베이 샌즈의 프리미어룸 1박 무료 이용권입니다. 스카이파크 인피니티 풀 이용 포함.',
    dpCost: 9000,
    validUntil: '발급일로부터 6개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1506351421178-63b52a2d2562?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'hv-galaxy-standard',
    categoryId: 'hotel_voucher',
    name: '갤럭시 마카오 스탠다드룸 1박 이용권',
    description: '코타이 최대 규모 리조트, 갤럭시 마카오의 스탠다드룸 1박 무료 이용권입니다.',
    dpCost: 5000,
    validUntil: '발급일로부터 6개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80'
  },

  // --- 호텔 식음료권 ---
  {
    id: 'dv-solaire-dinner',
    categoryId: 'dining_voucher',
    name: '솔레어 파인다이닝 디너 2인 세트',
    description: '솔레어 리조트 내 파인다이닝 레스토랑에서 사용 가능한 2인 디너 코스 이용권입니다.',
    dpCost: 1200,
    validUntil: '발급일로부터 3개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'dv-okada-buffet',
    categoryId: 'dining_voucher',
    name: '오카다 마닐라 조식 뷔페 2인권',
    description: '오카다 마닐라 조식 뷔페 레스토랑에서 사용 가능한 2인 이용권입니다.',
    dpCost: 800,
    validUntil: '발급일로부터 3개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'dv-vip-lounge-drink',
    categoryId: 'dining_voucher',
    name: 'VIP 라운지 웰컴 드링크 세트',
    description: '제휴 리조트 VIP 라운지에서 사용 가능한 웰컴 드링크 세트 이용권입니다.',
    dpCost: 300,
    validUntil: '발급일로부터 3개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'dv-macau-michelin',
    categoryId: 'dining_voucher',
    name: '마카오 미쉐린 레스토랑 코스 디너 1인권',
    description: '마카오 코타이 지역 미쉐린 스타 레스토랑에서 사용 가능한 1인 코스 디너 이용권입니다.',
    dpCost: 1500,
    validUntil: '발급일로부터 3개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&auto=format&fit=crop&q=80'
  },

  // --- 기타 상품 ---
  {
    id: 'ot-giftcard',
    categoryId: 'other',
    name: '더블링 기프트카드 (5,000원 상당)',
    description: '더블링 제휴 가맹점에서 사용 가능한 5,000원 상당의 모바일 기프트카드입니다.',
    dpCost: 500,
    validUntil: '발급일로부터 1년 이내 사용',
    image: 'https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ot-goods-set',
    categoryId: 'other',
    name: '더블링 프리미엄 굿즈 세트 (텀블러+카드지갑)',
    description: '더블링 브랜드 로고가 새겨진 프리미엄 텀블러와 카드지갑 세트입니다.',
    dpCost: 300,
    validUntil: '발급일로부터 1년 이내 수령',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ot-lounge-daypass',
    categoryId: 'other',
    name: 'VIP 프라이빗 라운지 데이패스',
    description: '제휴 리조트 VIP 프라이빗 라운지를 하루 동안 자유롭게 이용할 수 있는 데이패스입니다.',
    dpCost: 700,
    validUntil: '발급일로부터 3개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ot-airport-limo',
    categoryId: 'other',
    name: '공항 VIP 리무진 픽업 1회권',
    description: '제휴 리조트 공항 VIP 리무진 픽업 서비스 1회 이용권입니다.',
    dpCost: 1000,
    validUntil: '발급일로부터 6개월 이내 사용',
    image: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&auto=format&fit=crop&q=80'
  }
];

export const getPointProductsByCategory = (categoryId: PointProductCategoryId): PointProduct[] =>
  POINT_PRODUCTS.filter((p) => p.categoryId === categoryId);
