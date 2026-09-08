export interface CompBenefitItem {
  id: 'freeplay_suite' | 'gaming_room' | 'dining';
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
  tierRequirement: string;
  isAvailable: boolean;
  actionType: 'suite_booking' | 'gaming_room_booking' | 'dining_booking';
  image: string;
  highlights: string[];
}

export const COMP_BENEFITS: CompBenefitItem[] = [
  {
    id: 'freeplay_suite',
    title: '오퍼 스위트',
    subtitle: '럭셔리 스위트룸 무상/우대 이용',
    tagline: '마닐라 엔터테인먼트 시티 · 솔레어 리조트 앤 카지노 스위트',
    description: 'ETERNITY 등급 회원에게 주어지는 분기별 무상 바우처로 솔레어 리조트 앤 카지노(마닐라 엔터테인먼트 시티)의 이그제큐티브 스위트룸을 우선 배정받으세요.',
    icon: 'king_bed',
    badge: 'ETERNITY 등급 즉시 이용 가능',
    tierRequirement: 'BAND 이상 (ETERNITY 분기 바우처 적용)',
    isAvailable: true,
    actionType: 'suite_booking',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&auto=format&fit=crop&q=80',
    highlights: [
      '24시간 전담 VIP 버틀러 서비스',
      '이그제큐티브 라운지 올액세스 (동반 1인)',
      '공항 VIP 리무진 픽업 & 샌딩 지원'
    ]
  },
  {
    id: 'gaming_room',
    title: '멤버십 게이밍룸',
    subtitle: '프라이빗 전용 게이밍룸 출입 권한',
    tagline: '완벽한 프라이버시가 보장되는 최고급 살롱',
    description: '일반 구역과 완전히 분리된 프라이빗 게이밍룸에서 전담 호스트와 함께 최고 수준의 품격 있는 엔터테인먼트를 즐기세요.',
    icon: 'casino',
    badge: 'ETERNITY 전용 살롱 배정',
    tierRequirement: 'ETERNITY 이상 전용',
    isAvailable: true,
    actionType: 'gaming_room_booking',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80',
    highlights: [
      '프라이빗 하이리밋 테이블 우선 배정',
      'VIP 전용 케이터링 & 시그니처 칵테일',
      '1:1 전담 컨시어지 호스트 상시 대기'
    ]
  },
  {
    id: 'dining',
    title: '멤버십 다이닝',
    subtitle: '이그제큐티브 다이닝 & 미쉐린 레스토랑',
    tagline: '세계 정상급 마스터 셰프의 미식 경험',
    description: '복합리조트 내 미쉐린 스타 파인다이닝 및 VIP 전용 뷔페를 대기 없이 예약하고 특별 멤버십 바우처 혜택을 받으세요.',
    icon: 'restaurant',
    badge: 'F&B 특별 우대 혜택',
    tierRequirement: 'HALO 이상 전용',
    isAvailable: true,
    actionType: 'dining_booking',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    highlights: [
      '미쉐린 스타 레스토랑 프라이빗 룸 우선 예약',
      '웰컴 프리미엄 샴페인 세트 제공',
      '리조트 전 구역 F&B 10~20% 즉시 할인'
    ]
  }
];
