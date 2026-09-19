import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiCommonClient, setErrorToastHandler, setSessionExpiredHandler, ResultCode, CommonResponse } from '../utils/apiClient'; // 💡 apiCommonClient 임포트 추가
import { checkLogin, clearSession } from '../utils/auth';
import {
  MyProfile,
  UserPersona,
  Post,
  Reservation,
  WalletTransaction,
  PointRedemption,
  PolyVote,
  SettingsState,
  BookingFlowState,
  SocialSignupInfo,
  TierAccrualRecord
} from '../types';
import { PolyMarketItem, INITIAL_POLY_MARKETS } from '../data/polyMarketData';
import { HotelJackpotData, JackpotApiResponse, mapJackpotApiHotels } from '../data/jackpotData';
import { INITIAL_TIER_RECORDS } from '../data/membershipData';
import { STREAK_MILESTONES, STREAK_MAX_DAYS } from '../data/streakData';

interface PLMContentsResponse {
  pm_index: number;
  pm_cate_index: number;
  pm_cate_name: string;
  pm_title: string;
  pm_desc: string;
  pm_rule: string;
  pm_yes: string | number;
  pm_no: string | number;
  pm_pick_dp: number;
  pm_file_url: string;
  pm_start: string;
  pm_stop: string;
  pm_end: string;
}

const normalizeCategory = (categoryName: string): PolyMarketItem['category'] => {
  const normalized = (categoryName || '').trim();
  if (normalized.includes('사회')) return '사회';
  if (normalized.includes('연예')) return '연예';
  if (normalized.includes('정치')) return '정치';
  if (normalized.includes('인물')) return '인물';
  return normalized || '사회';
};

const mapPlmContentsToMarket = (item: PLMContentsResponse): PolyMarketItem => {
  const yesValue = typeof item.pm_yes === 'number'
    ? item.pm_yes
    : Number.parseFloat((item.pm_yes || '0').replace(/[^0-9.]/g, '')) || 0;
  const noValue = typeof item.pm_no === 'number'
    ? item.pm_no
    : Number.parseFloat((item.pm_no || '0').replace(/[^0-9.]/g, '')) || 0;

  return {
    id: `plm-${item.pm_index}`,
    type: 'general',
    title: item.pm_title,
    category: normalizeCategory(item.pm_cate_name),
    yesOdds: `${yesValue}%`,
    noOdds: `${noValue}%`,
    yesValue,
    noValue,
    totalVolumeDp: `${(item.pm_pick_dp || 0).toLocaleString()} DP`,
    description: item.pm_desc,
    rulesText: item.pm_rule,
    contextNews: '실시간 마켓 분석 및 뉴스는 준비 중입니다.',
    comments: [],
  };
};

interface AppContextType {
  user: UserPersona;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  authChecked: boolean; // 💡 앱 최초 마운트 시 서버 세션 확인(refreshLogin)이 끝났는지 여부
  currentTab: 'jackpot' | 'poly' | 'home' | 'freeroom' | 'my';
  setCurrentTab: (tab: 'jackpot' | 'poly' | 'home' | 'freeroom' | 'my') => void;
  currentSubScreen: string | null;
  setCurrentSubScreen: (screen: string | null) => void;
  requireLogin: () => boolean;
  socialSignupInfo: SocialSignupInfo | null;
  setSocialSignupInfo: (info: SocialSignupInfo | null) => void;
  
  // Data State
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  toggleLikePost: (postId: number) => Promise<void>; // 💡 Promise 타입으로 변경
  toggleBookmarkPost: (postId: number) => Promise<void>; // 💡 북마크 토글 추가

  reservations: Reservation[];
  addReservation: (res: Omit<Reservation, 'id' | 'createdAt'>) => void;

  // 멤버십 Tier Score 적립 내역 (mock)
  tierRecords: TierAccrualRecord[];
  addTierRecord: (record: Omit<TierAccrualRecord, 'id'>) => void;

  // 현재 투숙(체크인) 상태 (IR 데모용 mock)
  hasActiveTrip: boolean;
  setHasActiveTrip: React.Dispatch<React.SetStateAction<boolean>>;

  walletTransactions: WalletTransaction[];

  // 포인트 사용처 상품 교환 내역 (mock). 실제 u_dp/memberReward(서버)는 건드리지 않고,
  // 화면 표시용으로만 이 내역을 합산해 잔액을 계산하고 내역 리스트에 얹는다.
  pointRedemptions: PointRedemption[];
  redeemPointProduct: (product: { id: string; name: string; categoryId: string; dpCost: number }) => { success: boolean; voucherCode?: string };

  polyVotes: PolyVote[];
  polyMarkets: PolyMarketItem[];
  plmContentsLoading: boolean;
  refreshPlmContents: () => Promise<void>;
  selectedMarket: PolyMarketItem | null;
  setSelectedMarket: (market: PolyMarketItem | null) => void;
  castPolyVote: (marketId: string, title: string, category: string, choice: string, odds: string, amountDp?: number) => { success: boolean; isRevote: boolean; prevChoice?: string; prevAmount?: number; participationRewardDp?: number; msg?: string };
  earlyExitPolyVote: (voteId: string) => { success: boolean; returnDp: number };
  getUserVoteForMarket: (marketId: string) => PolyVote | undefined;

  // 💡 /jackpot/{countryIndex} API로 조회한 호텔+잭팟 목록(ALL 기준 전체 캐시).
  // JackpotMapScreen이 최초(countryIndex=0) 조회 성공 시 채워 넣고,
  // HotelJackpotDetailScreen은 이 캐시에서 hotelId로 실데이터를 찾아 사용한다.
  jackpotHotels: HotelJackpotData[];
  setJackpotHotels: React.Dispatch<React.SetStateAction<HotelJackpotData[]>>;
  refreshJackpotHotels: () => Promise<void>;

  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;

  // Booking Flow State
  booking: BookingFlowState;
  setBooking: React.Dispatch<React.SetStateAction<BookingFlowState>>;
  startBooking: (hotel: { name: string; location: string; roomType: string; pricePerNightDp: number; image: string }) => void;
  completePayment: () => void;

  // UI state
  showWriteModal: boolean;
  setShowWriteModal: (show: boolean) => void;
  selectedHotelId: string;
  setSelectedHotelId: (id: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // 💡 MyProfile state & updater
  myProfile: MyProfile;
  setMyProfile: (memberInfo?: any, memberShip?: any, memPickList?: any, memberReward?: any) => void;

  // 💡 로그인 세션 확인 및 DP 등 최신 회원 정보 갱신 (/member/uchk)
  refreshLogin: () => Promise<boolean>;

  // 💡 u_dp 등 지갑 정보를 포함한 전체 회원 정보 재조회 (/members/{uidx}).
  // uchk만으로는 비어 있을 수 있는 필드(u_dp 등)를 캐시가 지워진 상태에서도 다시 채워야 할 때 호출.
  refreshMemberProfile: () => Promise<boolean>;

  // 오늘의 로그인 보너스 지급 (mock: walletDp에 +150, 실제 정산 연동 아님)
  grantLoginBonus: () => void;

  // 연속 출석 스트릭 (myProfile.memberReward의 dp_index===1 출석 보너스 기록으로부터 계산)
  attendanceStreak: number;
  claimedStreakMilestones: number[];
  claimStreakReward: (days: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'jackpot' | 'poly' | 'home' | 'freeroom' | 'my'>('home');
  const [currentSubScreen, setCurrentSubScreen] = useState<string | null>(null);
  const [socialSignupInfo, setSocialSignupInfo] = useState<SocialSignupInfo | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('okada');
  const [posts, setPosts] = useState<Post[]>([]);
  const [polyMarkets, setPolyMarkets] = useState<PolyMarketItem[]>(INITIAL_POLY_MARKETS);
  const [plmContentsLoading, setPlmContentsLoading] = useState<boolean>(false);
  const [selectedMarket, setSelectedMarket] = useState<PolyMarketItem | null>(null);
  const [jackpotHotels, setJackpotHotels] = useState<HotelJackpotData[]>([]);

  // 💡 /jackpot/0(ALL) 조회로 jackpotHotels 캐시를 채운다. JackpotMapScreen을 거치지 않고
  // (예: 하단 네비 '프로그래시브' 탭에서) 바로 HotelJackpotDetailScreen으로 진입하는 경로에서
  // 캐시가 비어 있을 때 사용한다.
  const refreshJackpotHotels = useCallback(async (): Promise<void> => {
    try {
      const response = await apiCommonClient.post<CommonResponse<JackpotApiResponse>, { jp_index: number }>(
        '/jackpot/0',
        { jp_index: 0 },
        { suppressErrorToast: true }
      );
      if (response.result === ResultCode.SUCCESS && response.data) {
        const countries = [...response.data.country]
          .filter(country => country.jp_view !== 0)
          .sort((a, b) => a.jp_sort - b.jp_sort);
        setJackpotHotels(mapJackpotApiHotels({ ...response.data, country: countries }));
      }
    } catch (error) {
      console.error('/jackpot/0 API 통신 오류:', error);
    }
  }, []);

  const refreshPlmContents = useCallback(async (): Promise<void> => {
    try {
      setPlmContentsLoading(true);
      console.log('[PLM] fetch start -> /contents/plm-contents');

      const response = await apiCommonClient.post<any, {}>('/contents/plm-contents', {}, { suppressErrorToast: true });
      console.log('[PLM] raw response:', response?.data);

      // 서버 응답이 data(배열) 또는 data.data(배열) 두 형태로 올 수 있어 둘 다 안전하게 처리한다.
      const rawData = response?.data;
      const payload: PLMContentsResponse[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
      console.log('[PLM] parsed payload:', payload);

      if (payload.length > 0) {
        const mappedMarkets = payload.map(mapPlmContentsToMarket);
        console.log('[PLM] mapped markets:', mappedMarkets);
        setPolyMarkets(mappedMarkets);
      } else {
        console.log('[PLM] no payload, fallback to INITIAL_POLY_MARKETS');
        setPolyMarkets(INITIAL_POLY_MARKETS);
      }
    } catch (error) {
      console.error('[PLM] fetch failed:', error);
      setPolyMarkets(INITIAL_POLY_MARKETS);
    } finally {
      setPlmContentsLoading(false);
    }
  }, []);

  // 화면 진입 시점에서 명시적으로 불러오도록 유지한다.
  // 앱 최초 마운트 시 자동 호출은 제거하여 화면별 로딩 타이밍을 제어한다.

  // 💡 MyProfile 초기 상태 설정
  const [myProfile, setMyProfileState] = useState<MyProfile>({
    memberInfo: {},
    memberShip: {},
    memPickList: {},
    memberReward: {}
  });

  // 💡 [핵심] setMyProfile 핸들러 구현
  // 💡 setMyProfile 구현 부분 수정
  // 배열을 { ...arr } 로 복사하면 {0: ..., 1: ...} 형태의 일반 객체가 되어 배열성이 사라지므로,
  // 원본이 배열인지 여부에 따라 복사 방식을 분기한다.
  const cloneProfileField = (value: any) => (Array.isArray(value) ? [...value] : { ...value });

  const setMyProfile = (
    memberInfo: any = {},
    memberShip: any = {},
    memPickList: any = {},
    memberReward: any = {}
  ) => {
    console.log('📌 AppContext setMyProfile 호출됨:', memberInfo);

    // 💡 불변성(Immutability)을 지키기 위해 새로운 객체/배열 생성하여 state 갱신
    setMyProfileState({
      memberInfo: cloneProfileField(memberInfo),
      memberShip: cloneProfileField(memberShip),
      memPickList: cloneProfileField(memPickList),
      memberReward: cloneProfileField(memberReward)
    });
  };

  // 💡 로그인 세션 확인 + DP 등 최신 회원 정보 갱신 (/member/uchk)
  // Header, 앱 최초 마운트 등 로그인 상태를 다시 확인해야 하는 곳에서 공용으로 호출
  const refreshLogin = async (): Promise<boolean> => {
    const result = await checkLogin();

    if (result) {
      setIsLoggedIn(true);
      setMyProfile(result.memberInfo, result.memberShip, result.memPickList, result.memberReward);
      return true;
    }

    setIsLoggedIn(false);
    return false;
  };

  // 페이지 새로고침(웹) / 앱 재실행(Capacitor) 시 세션 유효성을 서버에 재확인
  // authChecked가 true가 되기 전까지는 isLoggedIn이 실제 로그인 상태를 반영하지 못하므로,
  // 화면단에서 "로그인 여부에 따라 다른 API를 호출"해야 하는 최초 요청은 이 값을 기다려야 한다.
  useEffect(() => {
    refreshLogin().finally(() => setAuthChecked(true));
  }, []);

  // 💡 u_dp 등 지갑/포인트를 포함한 "전체" 회원 정보 재조회 (/members/{uidx}).
  // uchk(refreshLogin)는 세션 유효성 확인 위주라 u_dp 등 일부 필드가 비어 있을 수 있어,
  // 캐시가 지워진 상태에서 DP가 0으로 보이는 문제를 해결하려면 이 함수로 다시 채워야 한다.
  // Header 등 myProfile.memberInfo.u_dp가 필요한데 비어 있는 곳에서 공용으로 호출한다.
  const refreshMemberProfile = useCallback(async (): Promise<boolean> => {
    let uidx = myProfile?.memberInfo?.uidx;
    let u_id = myProfile?.memberInfo?.u_id;

    // 세션 신원(uidx)조차 아직 없으면 uchk로 먼저 확보한다 (세션이 살아있는지도 같이 확인됨).
    if (!uidx) {
      const result = await checkLogin({ force: true });
      if (!result) return false;
      uidx = result.memberInfo?.uidx;
      u_id = result.memberInfo?.u_id;
      setMyProfile(result.memberInfo, result.memberShip, result.memPickList, result.memberReward);
    }

    if (!uidx) return false;

    try {
      const response = await apiCommonClient.post<any, { u_id: string }>(
        `/members/${Number(uidx)}`,
        { u_id: u_id || '' },
        { suppressErrorToast: true }
      );

      if (response && (response.result === ResultCode.SUCCESS || response.result === 0)) {
        const resData = response.data || response;
        const memberInfo = resData.memberInfo || resData.uinfo || {};
        const memberShip = resData.memberShip || {};
        const memPickList = resData.memPickList || [];
        const memberReward = resData.memberReward || [];
        setMyProfile(memberInfo, memberShip, memPickList, memberReward);
        return true;
      }
    } catch (error) {
      console.error('회원 정보 재조회 실패:', error);
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.memberInfo?.uidx, myProfile?.memberInfo?.u_id]);

  // Initial Persona Preset
  // 💡 walletDp / walletCoin 모두 mock 잔액입니다. 실제 결제/충전 연동이 아니라
  //    AppContext 메모리 시뮬레이션이며, 새로고침 시 초기값으로 리셋됩니다.
  //    - walletDp: 예측 챌린지 투표 전용 (무료 지급, 현금화 불가)
  //    - walletCoin: FreePlay 신청 디포짓 및 유료 결제용 (실결제 미연동)
  const [user, setUser] = useState<UserPersona>({
    name: 'Kevin',
    title: '',
    company: 'DOUBLING VIP',
    ageGroup: '50대',
    membership: 'Silver',
    membershipTier: 'ETERNITY',
    tierScore: 2150,
    tierExpiration: '2028년 1월 31일까지',
    walletDp: 20000,
    walletCoin: 5000,
    referralCode: 'KEVIN-VIP-2026',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  });

  // 현재 투숙(체크인) 상태 — IR 데모용 mock (초기값 false)
  const [hasActiveTrip, setHasActiveTrip] = useState<boolean>(false);

  // 멤버십 Tier Score 적립 내역 (mock)
  const [tierRecords, setTierRecords] = useState<TierAccrualRecord[]>(INITIAL_TIER_RECORDS);
  const addTierRecord = (record: Omit<TierAccrualRecord, 'id'>) => {
    const newRecord: TierAccrualRecord = { ...record, id: `tr-${Date.now()}` };
    setTierRecords(prev => [newRecord, ...prev]);
    setUser(prev => ({ ...prev, tierScore: prev.tierScore + record.score }));
  };

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    pushNotifications: true,
    marketingConsent: true,
    monthlyBookingLimit: 3,
    biometricAuth: true,
    autoCoinDeduction: true
  });

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // apiCommonClient의 result 코드 기반 공통 에러 토스트가 이 화면의 showToast를 사용하도록 등록
  useEffect(() => {
    setErrorToastHandler(showToast);
    return () => setErrorToastHandler(null);
  }, [showToast]);

  // 서버가 result 2(세션 없음/만료)를 응답하면 자동으로 로그아웃 처리 후 로그인 화면으로 이동한다.
  // (에러 메시지 토스트는 setErrorToastHandler 쪽에서 이미 띄워주므로 여기서는 상태 정리만 한다.)
  const handleSessionExpired = useCallback(() => {
    clearSession();
    setIsLoggedIn(false);
    setCurrentSubScreen('login');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
    return () => setSessionExpiredHandler(null);
  }, [handleSessionExpired]);

  const requireLogin = () => {
    if (isLoggedIn) return true;
    setCurrentSubScreen('login');
    showToast('로그인이 필요한 기능입니다.');
    return false;
  };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 💡 posts 목록과, 상세 화면에 별도로 보관 중인 selectedPost(동일 게시글의 스냅샷)를
  // 함께 갱신한다. selectedPost는 posts와 별개의 state라서 이걸 빠뜨리면 목록에서는
  // 좋아요/북마크가 반영되어도 상세 화면(PostDetailScreen)에는 반영되지 않는다.
  const applyPostPatch = (postId: number, patch: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.tb_index === postId ? { ...p, ...patch } : p)));
    setSelectedPost((prev) => (prev && prev.tb_index === postId ? { ...prev, ...patch } : prev));
  };

  // 💡 [1] 좋아요 토글 API 연동 (/sns/ulike)
  const toggleLikePost = async (postId: number) => {
    const targetPost = posts.find((p) => p.tb_index === postId);
    if (!targetPost) return;

    const currentStatus = targetPost.is_user_liked ? 1 : 0;
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const originalCount = targetPost.count_like;
    const nextCount = nextStatus === 1 ? originalCount + 1 : Math.max(0, originalCount - 1);

    // UI 선반영 (Optimistic Update)
    applyPostPatch(postId, { is_user_liked: nextStatus, count_like: nextCount });

    try {
      const response = await apiCommonClient.post<any, { content_index: number; status: number }>(
        '/sns/ulike',
        { content_index: postId, status: nextStatus }
      );

      // 실패 시 원래 상태로 롤백
      if (response?.message !== 'SUCCESS' && response?.result !== 0) {
        applyPostPatch(postId, { is_user_liked: currentStatus, count_like: originalCount });
      }
    } catch (error) {
      // 에러 발생 시 롤백
      applyPostPatch(postId, { is_user_liked: currentStatus, count_like: originalCount });
      console.error('좋아요 API 통신 오류:', error);
    }
  };

  // 💡 [2] 북마크 토글 API 연동 (/ubookmark)
  const toggleBookmarkPost = async (postId: number) => {
    const targetPost = posts.find((p) => p.tb_index === postId);
    if (!targetPost) return;

    const currentStatus = targetPost.is_user_bookmarked ? 1 : 0;
    const nextStatus = currentStatus === 1 ? 0 : 1;
    const originalCount = targetPost.count_bookmark;
    const nextCount = nextStatus === 1 ? originalCount + 1 : Math.max(0, originalCount - 1);

    // UI 선반영 (Optimistic Update)
    applyPostPatch(postId, { is_user_bookmarked: nextStatus, count_bookmark: nextCount });

    try {
      const response = await apiCommonClient.post<any, { content_index: number; status: number }>(
        '/sns/ubookmark',
        { content_index: postId, status: nextStatus }
      );
      console.log('[북마크] /sns/ubookmark 응답:', response);

      // 실패 시 원래 상태로 롤백
      if (response?.message !== 'SUCCESS' && response?.result !== 0) {
        applyPostPatch(postId, { is_user_bookmarked: currentStatus, count_bookmark: originalCount });
      }
    } catch (error) {
      // 에러 발생 시 롤백
      applyPostPatch(postId, { is_user_bookmarked: currentStatus, count_bookmark: originalCount });
      console.error('북마크 API 통신 오류:', error);
    }
  };

  // FreePlay 신청 내역 — 배포 기준: FreePlay 스위트 / 멤버십 게이밍룸 / 멤버십 다이닝 3종
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: 'RES-8921',
      benefitType: 'freeplay_suite',
      hotelName: 'Okada Manila (오카다 마닐라)',
      hotelLocation: 'Manila, Philippines',
      roomType: 'Executive Ocean View Suite',
      checkIn: '2026.08.15',
      checkOut: '2026.08.17',
      nights: 2,
      guests: 2,
      totalCoins: 1200,
      status: '확정',
      createdAt: '2026.08.01',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'RES-7412',
      benefitType: 'gaming_room',
      hotelName: 'Okada Manila (오카다 마닐라)',
      hotelLocation: 'Manila, Philippines',
      roomType: '프라이빗 VIP 살롱',
      checkIn: '2026.09.05',
      guests: 4,
      optionsList: ['하이리밋 테이블', 'VIP 케이터링', '전담 호스트 대기'],
      totalCoins: 0,
      status: '승인완료',
      createdAt: '2026.08.18',
      image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'RES-6190',
      benefitType: 'dining',
      hotelName: 'Okada Manila (La Piazza VIP Dining)',
      hotelLocation: 'Manila, Philippines',
      roomType: '미쉐린 VIP 파인다이닝',
      checkIn: '2026.09.12',
      timeSlot: '디너 1부 (18:00-20:00)',
      guests: 2,
      optionsList: ['VIP 프라이빗 룸', '스페셜 테이스팅 코스', '웰컴 샴페인 세트'],
      totalCoins: 0,
      status: '승인완료',
      createdAt: '2026.08.20',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
    }
  ]);

  const addReservation = (resData: Omit<Reservation, 'id' | 'createdAt'>) => {
    const newRes: Reservation = {
      ...resData,
      id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().split('T')[0].replace(/-/g, '.')
    };
    setReservations(prev => [newRes, ...prev]);
  };

  // Wallet Transactions (DP)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    {
      id: 'TX-001',
      type: '충전',
      title: 'DP 지갑 초기 잔액 충전',
      amount: 20000,
      date: '2026.08.01 14:32',
      txHash: '0x8f2a...91b4',
      status: '완료'
    }
  ]);

  // 포인트 사용처 상품 교환 내역 (mock).
  // 💡 실제 서버 잔액(myProfile.memberInfo.u_dp)이나 서버 내역(memberReward)은 절대 직접
  //    변형하지 않는다 — 대신 이 배열을 화면 표시 시점에 u_dp에서 차감·내역에 병합해서 보여준다
  //    (MyPageScreen의 '더블링 포인트' 화면 참고). 새로고침 시 초기화되는 세션 한정 mock 상태.
  const [pointRedemptions, setPointRedemptions] = useState<PointRedemption[]>([]);

  const redeemPointProduct = (
    product: { id: string; name: string; categoryId: string; dpCost: number }
  ): { success: boolean; voucherCode?: string } => {
    const totalRedeemedDp = pointRedemptions.reduce((sum, r) => sum + r.dpCost, 0);
    const availableDp = Math.max(0, (myProfile?.memberInfo?.u_dp || 0) - totalRedeemedDp);

    if (availableDp < product.dpCost) {
      showToast(`포인트가 부족합니다. (부족: ${(product.dpCost - availableDp).toLocaleString()} DP)`);
      return { success: false };
    }

    const voucherCode = `DBL-${product.categoryId.slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const record: PointRedemption = {
      id: `PR-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      categoryId: product.categoryId,
      dpCost: product.dpCost,
      voucherCode,
      redeemedAt: new Date().toLocaleString('ko-KR', { hour12: false })
    };

    setPointRedemptions(prev => [record, ...prev]);
    showToast(`${product.name} 교환 완료! 바우처 코드가 발급되었습니다.`);
    return { success: true, voucherCode };
  };

  // Poly Market Votes — 배포 기준: 100/500/1,000/5,000 DP 프리셋 중 선택하여 매수
  const [polyVotes, setPolyVotes] = useState<PolyVote[]>([
    {
      id: 'pv-1',
      marketId: 'pm-ent-2',
      title: '국내 대형 아이돌 그룹, 2026년 내 도쿄돔 단독 공연 성사',
      category: '연예',
      choice: 'YES',
      amountDp: 500,
      currentOdds: '68%',
      initialOdds: '62%',
      oddsChangeText: '매수 시 62% → 현재 68%',
      expectedPayoutDp: 735,
      unrealizedPnlDp: 85,
      status: '진행중',
      date: '2026.08.02'
    },
    {
      id: 'pv-2',
      marketId: 'pm-ent-1',
      title: '올해 연말 글로벌 팝 시상식, K-POP 아티스트 종합 대상 수상 여부',
      category: '연예',
      choice: 'NO',
      amountDp: 1000,
      currentOdds: '35%',
      initialOdds: '42%',
      oddsChangeText: '매수 시 42% → 현재 35%',
      expectedPayoutDp: 2850,
      unrealizedPnlDp: -140,
      status: '진행중',
      date: '2026.08.05'
    },
    {
      id: 'pv-3',
      marketId: 'pm-pol-1',
      title: '2027 차기 국제 기후정상회의(COP), 아시아 권역 개최국 확정 여부',
      category: '정치',
      choice: 'YES',
      amountDp: 500,
      currentOdds: '65%',
      initialOdds: '58%',
      oddsChangeText: '매수 시 58% → 현재 65%',
      expectedPayoutDp: 770,
      unrealizedPnlDp: 55,
      status: '진행중',
      date: '2026.08.10'
    },
    // 정산 완료된 포지션
    {
      id: 'pv-settled-1',
      marketId: 'pm-old-1',
      title: '2026 하반기 주요 금융 규제 완화 법안 국회 본회의 통과 여부',
      category: '사회',
      choice: 'YES',
      amountDp: 500,
      currentOdds: '78%',
      expectedPayoutDp: 640,
      status: '완료',
      settleType: 'MAJORITY_WIN',
      settledPayoutDp: 140,
      date: '2026.07.18',
      settledDate: '2026.07.28'
    },
    {
      id: 'pv-settled-2',
      marketId: 'pm-old-2',
      title: '글로벌 AI 컨퍼런스 기조연설자 깜짝 신모델 현장 공개',
      category: '연예',
      choice: 'YES',
      amountDp: 1000,
      currentOdds: '22%',
      expectedPayoutDp: 4540,
      status: '완료',
      settleType: 'MINORITY_WIN',
      settledPayoutDp: 3540,
      date: '2026.07.20',
      settledDate: '2026.07.25'
    },
    {
      id: 'pv-settled-3',
      marketId: 'pm-old-3',
      title: '여름 시즌 개봉 블록버스터 영화 첫 주 관객 500만 돌파 여부',
      category: '연예',
      choice: 'YES',
      amountDp: 500,
      currentOdds: '55%',
      expectedPayoutDp: 900,
      status: '완료',
      settleType: 'LOSS',
      settledPayoutDp: -500,
      date: '2026.07.15',
      settledDate: '2026.07.22'
    }
  ]);

 const getUserVoteForMarket = (marketId: string): PolyVote | undefined => {
    return polyVotes.find(v => v.marketId === marketId || v.title === marketId);
  };

  // 예측 챌린지 투표 로직 (배포 기준).
  // - 신규 투표: 선택한 프리셋 금액(amountDp) 차감 + 참여 즉시 보상 +50 DP 지급
  // - 재투표: 금액 증감분(netDiff)만 정산하고 선택/오즈/금액 갱신
  // 💡 walletDp는 AppContext mock 잔액이며 실제 정산 연동이 아닙니다.
  const castPolyVote = (
    marketId: string,
    title: string,
    category: string,
    choice: string,
    odds: string,
    amountDp: number = 100
  ): { success: boolean; isRevote: boolean; prevChoice?: string; prevAmount?: number; participationRewardDp?: number; msg?: string } => {
    const existingVoteIndex = polyVotes.findIndex(v => v.marketId === marketId || v.title === title);
    const PARTICIPATION_REWARD = 50; // 참여 즉시 보상 +50 DP

    // 오즈 기반 적중 시 예상 획득 DP 계산
    const oddsNum = parseInt(odds.replace(/[^0-9]/g, '')) || 50;
    const prob = Math.max(0.05, Math.min(0.95, oddsNum / 100));
    const calculatedPayout = Math.round(amountDp / prob);

    if (existingVoteIndex >= 0) {
      const existingVote = polyVotes[existingVoteIndex];
      const prevChoice = existingVote.choice;
      const prevAmount = existingVote.amountDp || 100;
      const newAmount = amountDp || prevAmount;
      const netDiff = newAmount - prevAmount;

      // 재투표 시 금액을 늘리면 추가 DP 필요 여부 확인
      if (netDiff > 0 && user.walletDp < netDiff) {
        showToast(`보유 DP가 부족합니다. (추가 필요: ${netDiff.toLocaleString()} DP)`);
        return { success: false, isRevote: true, prevChoice, prevAmount, msg: 'DP 부족' };
      }

      if (netDiff !== 0) {
        setUser(prev => ({ ...prev, walletDp: prev.walletDp - netDiff }));
      }

      setPolyVotes(prev => {
        const next = [...prev];
        next[existingVoteIndex] = {
          ...existingVote,
          choice,
          amountDp: newAmount,
          currentOdds: odds,
          expectedPayoutDp: calculatedPayout,
          date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
        };
        return next;
      });

      showToast(`투표가 [${choice}] (${newAmount.toLocaleString()} DP)로 성공적으로 변경되었습니다.`);
      return { success: true, isRevote: true, prevChoice, prevAmount };
    }

    // 신규 투표: 선택한 프리셋 금액만큼 보유 DP 확인
    if (user.walletDp < amountDp) {
      showToast(`보유 DP가 부족합니다. (${amountDp.toLocaleString()} DP 필요)`);
      return { success: false, isRevote: false, msg: 'DP 부족' };
    }

    // 최종 잔액 = 기존잔액 - 매수액 + 참여 즉시 보상(+50)
    const netDpChange = -amountDp + PARTICIPATION_REWARD;
    setUser(prev => ({ ...prev, walletDp: prev.walletDp + netDpChange }));

    const newVote: PolyVote = {
      id: `pv-${Date.now()}`,
      marketId,
      title,
      category,
      choice,
      amountDp,
      currentOdds: odds,
      initialOdds: odds,
      oddsChangeText: `매수 시 ${odds} → 현재 ${odds}`,
      expectedPayoutDp: calculatedPayout,
      unrealizedPnlDp: Math.round(amountDp * 0.08),
      status: '진행중',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
    };
    setPolyVotes(prev => [newVote, ...prev]);

    showToast(`예측 투표 완료! 참여 즉시 보상 +${PARTICIPATION_REWARD} DP가 지급되었습니다.`);
    return { success: true, isRevote: false, participationRewardDp: PARTICIPATION_REWARD };
  };

  // 진행중 포지션 조기 정리 (원금 + 잠재손익 즉시 반환, 정산 완료 처리)
  const earlyExitPolyVote = (voteId: string): { success: boolean; returnDp: number } => {
    const voteIndex = polyVotes.findIndex(v => v.id === voteId);
    if (voteIndex < 0) return { success: false, returnDp: 0 };

    const vote = polyVotes[voteIndex];
    if (vote.status !== '진행중') return { success: false, returnDp: 0 };

    const returnDp = Math.max(10, (vote.amountDp || 100) + (vote.unrealizedPnlDp || 0));
    setUser(prev => ({ ...prev, walletDp: prev.walletDp + returnDp }));

    setPolyVotes(prev => {
      const next = [...prev];
      next[voteIndex] = {
        ...vote,
        status: '완료',
        settleType: 'EARLY_EXIT',
        settledPayoutDp: vote.unrealizedPnlDp || 0,
        settledDate: new Date().toISOString().split('T')[0].replace(/-/g, '.')
      };
      return next;
    });

    showToast(`포지션이 조기 정리되어 ${returnDp.toLocaleString()} DP가 지갑에 환급되었습니다.`);
    return { success: true, returnDp };
  };

  // FreePlay(호텔) 신청 플로우 상태.
  // 💡 BookingFlowState의 pricePerNightDp / totalDp 필드는 레거시 명칭이며,
  //    실제로는 "코인" 결제 금액을 담습니다(결제 시 user.walletCoin에서 차감).
  const [booking, setBooking] = useState<BookingFlowState>({
    step: 'detail',
    hotelName: 'Okada Manila (오카다 마닐라)',
    location: 'New Manila Bay, Philippines',
    roomType: 'Executive Ocean Suite',
    pricePerNightDp: 600,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-08-15',
    endDate: '2026-08-17',
    nights: 2,
    guests: 2,
    options: {
      breakfast: true,
      loungeAccess: true,
      airportTransfer: false
    },
    totalDp: 1350
  });

  // Calculate live total for booking
  useEffect(() => {
    let optionsCost = 0;
    if (booking.options.breakfast) optionsCost += 50 * booking.nights * booking.guests;
    if (booking.options.loungeAccess) optionsCost += 100 * booking.nights;
    if (booking.options.airportTransfer) optionsCost += 80;

    const roomCost = booking.pricePerNightDp * booking.nights;
    setBooking(prev => ({
      ...prev,
      totalDp: roomCost + optionsCost
    }));
  }, [booking.nights, booking.guests, booking.options, booking.pricePerNightDp]);

  const startBooking = (hotel: { name: string; location: string; roomType: string; pricePerNightDp?: number; image: string }) => {
    const unitPrice = hotel.pricePerNightDp || 600; // 코인 단가
    setBooking({
      step: 'date',
      hotelName: hotel.name,
      location: hotel.location,
      roomType: hotel.roomType,
      pricePerNightDp: unitPrice,
      image: hotel.image,
      startDate: '2026-08-15',
      endDate: '2026-08-17',
      nights: 2,
      guests: 2,
      options: {
        breakfast: true,
        loungeAccess: true,
        airportTransfer: false
      },
      totalDp: unitPrice * 2 + 200
    });
    setCurrentSubScreen('freeroom-booking');
  };

  // FreePlay 신청 결제 완료 처리.
  // 💡 mock 잔액(user.walletCoin)에서 차감하는 시뮬레이션이며 실제 결제 연동이 아닙니다.
  const completePayment = () => {
    // 1. 코인 잔액 차감 (FreePlay 디포짓/결제는 코인으로만 처리)
    setUser(prev => ({
      ...prev,
      walletCoin: Math.max(0, prev.walletCoin - booking.totalDp)
    }));

    // 2. Add to Reservations with "확정" status
    addReservation({
      hotelName: booking.hotelName,
      hotelLocation: booking.location,
      roomType: booking.roomType,
      checkIn: booking.startDate.replace(/-/g, '.'),
      checkOut: booking.endDate.replace(/-/g, '.'),
      nights: booking.nights,
      guests: booking.guests,
      totalDp: booking.totalDp,
      status: '확정',
      image: booking.image
    });

    // 3. Add to Wallet Transactions
    const tx: WalletTransaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      type: '예약 결제',
      title: `오퍼 신청 (${booking.hotelName})`,
      amount: -booking.totalDp,
      date: new Date().toLocaleString('ko-KR', { hour12: false }),
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...f32a`,
      status: '완료'
    };
    setWalletTransactions(prev => [tx, ...prev]);

    setBooking(prev => ({ ...prev, step: 'success' }));
    showToast('신청 및 코인 결제가 완료되었습니다!');
  };
  
  // 오늘의 로그인 보너스.
  // 💡 mock: AppContext 메모리의 walletDp에만 +150 하는 시뮬레이션이며,
  //    실제 보너스 정산/서버 반영이 아닙니다. 새로고침 시 초기값으로 리셋됩니다.
  const LOGIN_BONUS_DP = 150;
  const grantLoginBonus = () => {
    setUser(prev => ({ ...prev, walletDp: prev.walletDp + LOGIN_BONUS_DP }));
  };

  // 연속 출석 스트릭.
  // myProfile.memberReward 중 dp_index === 1(출석 보너스) 기록의 날짜들로부터 실제 연속 출석일수를 계산한다.
  // 오늘 출석 기록이 아직 없어도 어제까지 이어져 있으면 스트릭이 끊기지 않은 것으로 간주한다.
  // pm_reg_timestamp는 이미 한국 시간(KST) 기준으로 내려오는 값이라 추가 타임존 보정 없이 그대로 day 번호로 환산한다.
  // 반면 Date.now()는 진짜 UTC 기준이므로, 서버 값과 같은 기준(KST)으로 맞추기 위해 "오늘" 계산에만 +9시간을 보정한다.
  const attendanceStreak = useMemo(() => {
    const rewards: any[] = Array.isArray(myProfile?.memberReward)
      ? myProfile.memberReward
      : Object.values(myProfile?.memberReward || {});

    const DAY_MS = 24 * 60 * 60 * 1000;
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const toDayNumber = (encodedSeconds: number) => Math.floor((encodedSeconds * 1000) / DAY_MS);

    const attendanceDays = new Set<number>();
    rewards.forEach((r) => {
      if (r?.dp_index !== 1) return;
      const ts = Number(r?.pm_reg_timestamp);
      if (!ts) return;
      attendanceDays.add(toDayNumber(ts));
    });

    if (attendanceDays.size === 0) return 0;

    const todayDayNumber = toDayNumber(Math.floor((Date.now() + KST_OFFSET_MS) / 1000));
    let cursorDay = attendanceDays.has(todayDayNumber) ? todayDayNumber : todayDayNumber - 1;

    let streak = 0;
    while (attendanceDays.has(cursorDay) && streak < STREAK_MAX_DAYS) {
      streak += 1;
      cursorDay -= 1;
    }

    console.log('[출석 스트릭] dp_index=1 기록 일자(KST day#):', Array.from(attendanceDays).sort(), '오늘(KST day#):', todayDayNumber, '계산된 연속일수:', streak);

    return streak;
  }, [myProfile?.memberReward]);

  // 💡 mock 상태입니다. AppContext 메모리에만 존재하며, 실제 보상 수령 서버 반영이 아니고
  //    새로고침 시 초기값으로 리셋됩니다.
  const [claimedStreakMilestones, setClaimedStreakMilestones] = useState<number[]>([3]); // 3일 보상은 수령했다고 가정

  // 도달한 마일스톤 보상 수령 → walletDp에 반영(mock), 마일스톤 1회만 수령 가능.
  const claimStreakReward = (days: number) => {
    const milestone = STREAK_MILESTONES.find(m => m.days === days);
    if (!milestone) return;
    if (attendanceStreak < milestone.days) {
      showToast(`아직 ${milestone.days}일 연속 출석 전이에요`);
      return;
    }
    if (claimedStreakMilestones.includes(days)) {
      showToast('이미 수령한 출석 보상이에요');
      return;
    }
    setUser(prev => ({ ...prev, walletDp: prev.walletDp + milestone.reward }));
    setClaimedStreakMilestones(prev => [...prev, days]);
    showToast(`${milestone.message} +${milestone.reward.toLocaleString()} DP 지급!`);
  };

  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        setIsLoggedIn,
        authChecked,
        currentTab,
        setCurrentTab,
        currentSubScreen,
        setCurrentSubScreen,
        requireLogin,
        socialSignupInfo,
        setSocialSignupInfo,
        posts,
        setPosts,
        selectedPost,
        setSelectedPost,
        toggleLikePost,
        toggleBookmarkPost, // 💡 내보내기 추가
        reservations,
        addReservation,
        tierRecords,
        addTierRecord,
        hasActiveTrip,
        setHasActiveTrip,
        walletTransactions,
        pointRedemptions,
        redeemPointProduct,
        polyVotes,
        polyMarkets,
        plmContentsLoading,
        refreshPlmContents,
        selectedMarket,
        setSelectedMarket,
        castPolyVote,
        earlyExitPolyVote,
        getUserVoteForMarket,
        jackpotHotels,
        setJackpotHotels,
        refreshJackpotHotels,
        settings,
        updateSettings,
        booking,
        setBooking,
        startBooking,
        completePayment,
        showWriteModal,
        setShowWriteModal,
        selectedHotelId,
        setSelectedHotelId,
        toastMessage,
        showToast,
        myProfile,
        setMyProfile,
        refreshLogin,
        refreshMemberProfile,
        grantLoginBonus,
        attendanceStreak,
        claimedStreakMilestones,
        claimStreakReward
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
