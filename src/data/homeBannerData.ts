import { SOLAIRE_EXTERIOR_IMAGES } from './offerRoomData';

// 2026-10-03: 홈 상단 광고형 배너(HomeAdBanner) 데이터.
// ⚠️ mock — 테스트용 정적 데이터 2건(솔레어·오카다). 광고 BM용 배너 관리 API가 생기면 서버 값으로 교체.
// 클릭 시 "오퍼 탭의 해당 호텔 상품 리스트"로 연결 예정 (추후 작업) — offerHotelKey는 그 연결용 자리.

export interface HomeAdBannerItem {
  id: string;
  hotelName: string;
  image: string;
  imageAlt: string;
  // 배너 높이가 낮을 때(최소화) 사진의 어느 부분을 보여줄지 (CSS object-position)
  imagePosition: string;
  offerHotelKey?: string;
}

export const HOME_AD_BANNERS: HomeAdBannerItem[] = [
  {
    id: 'banner-solaire',
    hotelName: '솔레어 리조트 마닐라',
    image: SOLAIRE_EXTERIOR_IMAGES[0].src,
    imageAlt: SOLAIRE_EXTERIOR_IMAGES[0].alt,
    imagePosition: 'center 45%',
    offerHotelKey: 'SREC',
  },
  {
    id: 'banner-okada',
    hotelName: '오카다 마닐라',
    image: '/images/banner/okada-manila-exterior.webp',
    imageAlt: '오카다 마닐라 외관 (석양)',
    // 2026-10-03: 건물 상단 "OKADA" 간판(사진 높이 약 29% 지점)이 최소화(48px)·최대화(96px) 모두에서 보이도록 20%
    // (기존: 'center 35%' — 최소화 시 간판이 잘림)
    imagePosition: 'center 20%',
  },
];
