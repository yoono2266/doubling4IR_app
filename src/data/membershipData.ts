import { MembershipTierId, MembershipTierInfo, TierAccrualRecord } from '../types';

export const MEMBERSHIP_TIERS: MembershipTierInfo[] = [
  {
    id: '1',
    name: 'BAND (밴드)',
    englishName: 'BAND',
    koreanName: '밴드',
    color: '#A9A9A9',
    thresholdScore: 0,
    icon: 'circle',
    jewelryConcept: '클래식 밴드 링 (기본 웰컴)',
    benefits: [
      '더블링 파트너스 기본 가입 혜택',
      '오퍼 호텔 시즌별 우선 예약 권한',
      '아시아 제휴 IR 웰컴 음료 서비스'
    ]
  },
  {
    id: '2',
    name: 'HALO (헤일로)',
    englishName: 'HALO',
    koreanName: '헤일로',
    color: '#B76E79',
    thresholdScore: 600,
    icon: 'flare',
    jewelryConcept: '로즈골드 헤일로 세팅',
    benefits: [
      '호텔 레이트 체크아웃 (최대 14:00)',
      '리조트 F&B 10% 현장 할인/적립',
      '크로스-IR 제휴 리조트 룸 업그레이드 우선 대기'
    ]
  },
  {
    id: '3',
    name: 'ETERNITY (이터니티)',
    englishName: 'ETERNITY',
    koreanName: '이터니티',
    color: '#C9CBCF',
    thresholdScore: 1500,
    icon: 'diamond',
    jewelryConcept: '풀 파베 다이아몬드 이터니티 링 (플래티넘)',
    benefits: [
      '마카오·필리핀·싱가포르 복합리조트 VIP 등급 상호 동등 인정 (Cross-IR)',
      '오퍼 스위트 분기별 바우처 지급',
      'VIP 클럽 라운지 올액세스 (동반 1인 무료)',
      '리조트 내 전용 발렛파킹 및 컨시어지 직통 서비스'
    ]
  },
  {
    id: '4',
    name: 'SOLITAIRE (솔리테어)',
    englishName: 'SOLITAIRE',
    koreanName: '솔리테어',
    color: '#D4AF37',
    thresholdScore: 3800,
    icon: 'military_tech',
    jewelryConcept: '프롱 세팅 솔리테어 다이아몬드 (골드)',
    benefits: [
      '크로스-IR 최고위 VIP 다이렉트 패스트트랙 체크인',
      '전담 버틀러 및 VIP 호스트 1:1 배정',
      '리무진 공항 픽업/센딩 연 4회 무료 제공',
      'VIP 전용 프라이빗 살롱 & 게이밍 다이닝 무료 초청'
    ]
  },
  {
    id: '5',
    name: 'CROWN (크라운)',
    englishName: 'CROWN',
    koreanName: '크라운',
    color: '#1A1A1A',
    trimColor: '#D4AF37',
    thresholdScore: 30000,
    icon: 'crown',
    jewelryConcept: '로열 임페리얼 크라운 & 티아라',
    benefits: [
      'VVIP 최상위 프레지덴셜/빌라 스위트 무제한 우선 예약',
      '아시아 전역 IR 전세기 및 헬기 트랜스퍼 지원',
      '글로벌 VIP 갈라 디너 및 프라이빗 옥션 프리패스',
      '개인 맞춤형 무제한 컨시어지 서비스'
    ]
  }
];

// Initial 5 Accrual records for Kevin persona
export const INITIAL_TIER_RECORDS: TierAccrualRecord[] = [
  {
    id: 'tr-1',
    sourceType: '체크인',
    hotelName: '오카다 마닐라 (Okada Manila)',
    score: 150,
    date: '2026.08.22',
    description: 'VIP 패스트트랙 키오스크 체크인 완료'
  },
  {
    id: 'tr-2',
    sourceType: '객실',
    hotelName: '오카다 마닐라 (Okada Manila)',
    score: 250,
    date: '2026.08.20',
    description: '프리미엄 1+1 패키지 숙박 완료'
  },
  {
    id: 'tr-3',
    sourceType: '식음료',
    hotelName: '솔레어 리조트 (Solaire Resort)',
    score: 200,
    date: '2026.08.15',
    description: '파인다이닝 레스토랑 F&B 결제 적립'
  },
  {
    id: 'tr-4',
    sourceType: '체크인',
    hotelName: '마리나 베이 샌즈 (Marina Bay Sands)',
    score: 150,
    date: '2026.08.01',
    description: '스위트 타워 체크인 완료'
  },
  {
    id: 'tr-5',
    sourceType: '객실',
    hotelName: '마리나 베이 샌즈 (Marina Bay Sands)',
    score: 250,
    date: '2026.07.30',
    description: '샌즈 프리미어 룸 2박 투숙 완료'
  }
];

export const getTierInfo = (tierId: MembershipTierId): MembershipTierInfo => {
  return MEMBERSHIP_TIERS.find(t => t.id === tierId) || MEMBERSHIP_TIERS[2]; // default ETERNITY
};

export const getNextTier = (currentTierId: MembershipTierId): MembershipTierInfo | null => {
  const idx = MEMBERSHIP_TIERS.findIndex(t => t.id === currentTierId);
  if (idx >= 0 && idx < MEMBERSHIP_TIERS.length - 1) {
    return MEMBERSHIP_TIERS[idx + 1];
  }
  return null;
};
