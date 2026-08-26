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

export interface UserPersona {
  name: string;
  title: string;
  company: string;
  ageGroup: string;
  membershipTier: MembershipTierId;
  tierScore: number;
  tierExpiration: string;
  walletCoin: number; // 코인월렛 (실결제/FreePlay 전용, 기본 20,000)
  walletDp: number;   // 더블링포인트 (예측 챌린지 전용, 기본 2,480)
  referralCode: string;
  avatar: string;
}

export interface Post {
  id: string;
  author: string;
  authorRole: string;
  avatar: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
  category: string;
  image?: string;
  isNew?: boolean;
  postType?: 'standard' | 'video_promo';
  publishedAt?: string;
  hashtags?: string[];
  bookmarks?: number;
  isBookmarked?: boolean;
  videoThumbnail?: string;
}

export type CompBenefitType = 'freeplay_suite' | 'gaming_room' | 'dining';

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
  totalCoins?: number;
  status: '확정' | '대기' | '취소' | '심사중' | '승인완료';
  createdAt: string;
  image: string;
  qrCode?: string;
}

export interface WalletTransaction {
  id: string;
  type: '충전' | '예약 결제' | '배팅' | '배당금' | '출금';
  title: string;
  amount: number; // 코인 단위
  date: string;
  txHash: string;
  status: '완료' | '처리중';
}

export interface StreakMilestone {
  day: number;
  dpBonus: number;
  claimed: boolean;
}

export interface AttendanceStreakState {
  currentStreakDays: number;
  lastAttendanceDate: string;
  loginBonusClaimedToday: boolean;
  milestones: StreakMilestone[];
}

export interface PolyVote {
  id: string;
  marketId: string;
  title: string;
  category: string;
  choice: string; // 'YES', 'NO', or Candidate name
  amountDp: number;
  currentOdds: string;
  initialOdds?: string;
  oddsChangeText?: string;
  expectedPayoutDp?: number;
  unrealizedPnlDp?: number; // e.g. +37 or -64
  status: '진행중' | '완료';
  settleType?: 'MAJORITY_WIN' | 'MINORITY_WIN' | 'LOSS' | 'EARLY_EXIT';
  settledPayoutDp?: number; // net profit/loss
  date: string;
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
  pricePerNightCoins: number;
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
  totalCoins: number;
}
