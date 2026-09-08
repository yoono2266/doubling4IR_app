export interface MyProfile {
  memberInfo: any;
  memberShip: any;
  memPickList: any;
  memberReward: any;
}

// 더블링 5단계 멤버십 등급
export type MembershipTierId = 'BAND' | 'HALO' | 'ETERNITY' | 'SOLITAIRE' | 'CROWN';

export interface MembershipTierInfo {
  id: MembershipTierId;
  name: string;
  englishName: string;
  koreanName: string;
  color: string;
  trimColor?: string;
  thresholdScore: number;
  icon: string;
  jewelryConcept: string;
  benefits: string[];
}

export interface TierAccrualRecord {
  id: string;
  sourceType: '체크인' | '객실' | '식음료';
  hotelName: string;
  score: number;
  date: string;
  description: string;
}

export type CompBenefitType = 'freeplay_suite' | 'gaming_room' | 'dining';

export interface UserPersona {
  name: string;
  title: string;
  company: string;
  ageGroup: string;
  membership: 'White' | 'Silver' | 'Gold' | 'Diamond';
  membershipTier: MembershipTierId;
  tierScore: number;
  tierExpiration: string;
  walletDp: number; // 예측 챌린지 투표 전용 포인트 (무료 지급, 현금화 불가)
  walletCoin: number; // FreePlay(호텔) 신청 디포짓 및 유료 결제용 코인
  referralCode: string;
  avatar: string;
}

export interface Post {
  tb_index: number;
  tb_title: string;
  tb_type: number;
  tb_writer_id: number;
  tb_status: number;
  tb_file_url: string;
  tb_upd_timestamp: number;
  tb_reg_timestamp: number;
  class_name: string;
  cate_name: string;
  cate_sub_name: string;
  sub_name: string;
  tb_class_index: number;
  tb_cate_index: number;
  tb_thumb_url: string;
  tb_link: string;
  ai_index: string;
  tb_main_name: string;
  tb_sub_name: string;
  tb_logo: string;
  tb_desc: string;
  tb_country: string;
  count_like: number;
  is_user_liked: number;
  count_bookmark: number;
  is_user_bookmarked: number;
  tb_reg_datetime: string;
}

export interface Reservation {
  id: string;
  benefitType?: CompBenefitType;
  hotelName: string;
  hotelLocation: string;
  roomType: string;
  checkIn: string;
  checkOut?: string;
  timeSlot?: string;
  nights?: number;
  guests: number;
  optionsList?: string[];
  totalDp?: number;
  totalCoins?: number;
  status: '확정' | '대기' | '취소' | '심사중' | '승인완료';
  createdAt: string;
  image: string;
  qrCode?: string;
}

export interface WalletTransaction {
  id: string;
  type: '충전' | '예약 결제' | '배팅' | '배당금';
  title: string;
  amount: number; // positive or negative DP
  date: string;
  txHash: string;
  status: '완료' | '처리중';
}

export interface PolyVote {
  id: string;
  marketId: string;
  title: string;
  category: string;
  choice: string; // 'YES', 'NO', or Candidate name
  amountDp: number; // 100 DP
  currentOdds: string;
  status: '진행중' | '종료' | '완료';
  date: string;
  // 예측 챌린지 투표 플로우 / 포트폴리오(배포 기준)에서 추가 사용하는 선택 필드
  initialOdds?: string;
  oddsChangeText?: string;
  expectedPayoutDp?: number;
  unrealizedPnlDp?: number;
  settleType?: 'MAJORITY_WIN' | 'MINORITY_WIN' | 'LOSS' | 'EARLY_EXIT';
  settledPayoutDp?: number;
  settledDate?: string;
}

export interface SettingsState {
  pushNotifications: boolean;
  marketingConsent: boolean;
  monthlyBookingLimit: number;
  biometricAuth: boolean;
  autoCoinDeduction: boolean;
}

export interface BookingFlowState {
  step: 'detail' | 'date' | 'options' | 'payment' | 'success';
  hotelName: string;
  location: string;
  roomType: string;
  pricePerNightDp: number;
  image: string;
  startDate: string;
  endDate: string;
  nights: number;
  guests: number;
  options: {
    breakfast: boolean;
    loungeAccess: boolean;
    airportTransfer: boolean;
  };
  totalDp: number;
}

export interface SocialSignupInfo {
  platformUid: string;
  platformGid: string;
  platformBid: string;
  profileImage?: string;
  googleProfile?: Record<string, unknown>;
}