export interface MyProfile {
  memberInfo: any;
  memberShip: any;
  memberPoly: any;
  memberReward: any;
}

export interface UserPersona {
  name: string;
  title: string;
  company: string;
  ageGroup: string;
  membership: 'White' | 'Silver' | 'Gold' | 'Diamond';
  walletDp: number;
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
  hotelName: string;
  hotelLocation: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalDp: number;
  status: '확정' | '대기' | '취소';
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
  status: '진행중' | '종료';
  date: string;
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