import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCommonClient } from '../utils/apiClient'; // 💡 apiCommonClient 임포트 추가
import { checkLogin } from '../utils/auth';
import {
  MyProfile,
  UserPersona,
  Post,
  Reservation,
  WalletTransaction,
  PolyVote,
  SettingsState,
  BookingFlowState,
  SocialSignupInfo
} from '../types';
import { PolyMarketItem, INITIAL_POLY_MARKETS } from '../data/polyMarketData';

interface AppContextType {
  user: UserPersona;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
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

  walletTransactions: WalletTransaction[];
  polyVotes: PolyVote[];polyMarkets: PolyMarketItem[];
  selectedMarket: PolyMarketItem | null;
  setSelectedMarket: (market: PolyMarketItem | null) => void;
  castPolyVote: (marketId: string, title: string, category: string, choice: string, odds: string) => { success: boolean; isRevote: boolean; prevChoice?: string; msg?: string };
  getUserVoteForMarket: (marketId: string) => PolyVote | undefined;

  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;

  // Booking Flow State
  booking: BookingFlowState;
  setBooking: React.Dispatch<React.SetStateAction<BookingFlowState>>;
  startBooking: (hotel: { name: string; location: string; roomType: string; pricePerNightUsdt: number; image: string }) => void;
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
  setMyProfile: (memberInfo?: any, memberShip?: any, memberPoly?: any, memberReward?: any) => void;

  // 💡 로그인 세션 확인 및 DP 등 최신 회원 정보 갱신 (/member/uchk)
  refreshLogin: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'jackpot' | 'poly' | 'home' | 'freeroom' | 'my'>('home');
  const [currentSubScreen, setCurrentSubScreen] = useState<string | null>(null);
  const [socialSignupInfo, setSocialSignupInfo] = useState<SocialSignupInfo | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('okada');
  const [posts, setPosts] = useState<Post[]>([]);
  const [polyMarkets] = useState<PolyMarketItem[]>(INITIAL_POLY_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState<PolyMarketItem | null>(null);

  // 💡 MyProfile 초기 상태 설정
  const [myProfile, setMyProfileState] = useState<MyProfile>({
    memberInfo: {},
    memberShip: {},
    memberPoly: {},
    memberReward: {}
  });

  // 💡 [핵심] setMyProfile 핸들러 구현
  // 💡 setMyProfile 구현 부분 수정
  const setMyProfile = (
    memberInfo: any = {}, 
    memberShip: any = {}, 
    memberPoly: any = {}, 
    memberReward: any = {}
  ) => {
    console.log('📌 AppContext setMyProfile 호출됨:', memberInfo);
    
    // 💡 불변성(Immutability)을 지키기 위해 새로운 객체 생성하여 state 갱신
    setMyProfileState({
      memberInfo: { ...memberInfo },
      memberShip: { ...memberShip },
      memberPoly: { ...memberPoly },
      memberReward: { ...memberReward }
    });
  };

  // 💡 로그인 세션 확인 + DP 등 최신 회원 정보 갱신 (/member/uchk)
  // Header, 앱 최초 마운트 등 로그인 상태를 다시 확인해야 하는 곳에서 공용으로 호출
  const refreshLogin = async (): Promise<boolean> => {
    const result = await checkLogin();

    if (result) {
      setIsLoggedIn(true);
      setMyProfile(result.memberInfo, result.memberShip, result.memberPoly, result.memberReward);
      return true;
    }

    setIsLoggedIn(false);
    return false;
  };

  // 페이지 새로고침(웹) / 앱 재실행(Capacitor) 시 세션 유효성을 서버에 재확인
  useEffect(() => {
    refreshLogin();
  }, []);

  // Initial Persona Preset
  const [user, setUser] = useState<UserPersona>({
    name: 'Kevin',
    title: '',
    company: 'DOUBLING VIP',
    ageGroup: '50대',
    membership: 'Silver',
    walletDp: 20000,
    referralCode: 'KEVIN-VIP-2026',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  });

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
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const requireLogin = () => {
    if (isLoggedIn) return true;
    setCurrentSubScreen('login');
    showToast('로그인이 필요한 기능입니다.');
    return false;
  };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // 💡 [1] 좋아요 토글 API 연동 (/sns/ulike)
  const toggleLikePost = async (postId: number) => {
    const targetPost = posts.find((p) => p.tb_index === postId);
    if (!targetPost) return;

    const currentStatus = targetPost.is_user_liked ? 1 : 0;
    const nextStatus = currentStatus === 1 ? 0 : 1;

    // UI 선반영 (Optimistic Update)
    setPosts((prev) =>
      prev.map((p) => {
        if (p.tb_index === postId) {
          return {
            ...p,
            is_user_liked: nextStatus,
            count_like: nextStatus === 1 ? p.count_like + 1 : Math.max(0, p.count_like - 1),
          };
        }
        return p;
      })
    );

    try {
      const response = await apiCommonClient.post<any, { content_index: number; status: number }>(
        '/sns/ulike',
        { content_index: postId, status: nextStatus }
      );

      // 실패 시 원래 상태로 롤백
      if (response?.message !== 'SUCCESS' && response?.result !== 0) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.tb_index === postId) {
              return {
                ...p,
                is_user_liked: currentStatus,
                count_like: currentStatus === 1 ? p.count_like + 1 : Math.max(0, p.count_like - 1),
              };
            }
            return p;
          })
        );
        showToast('좋아요 처리 실패');
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setPosts((prev) =>
        prev.map((p) => {
          if (p.tb_index === postId) {
            return {
              ...p,
              is_user_liked: currentStatus,
              count_like: currentStatus === 1 ? p.count_like + 1 : Math.max(0, p.count_like - 1),
            };
          }
          return p;
        })
      );
      console.error('좋아요 API 통신 오류:', error);
    }
  };

  // 💡 [2] 북마크 토글 API 연동 (/ubookmark)
  const toggleBookmarkPost = async (postId: number) => {
    const targetPost = posts.find((p) => p.tb_index === postId);
    if (!targetPost) return;

    const currentStatus = targetPost.is_user_bookmarked ? 1 : 0;
    const nextStatus = currentStatus === 1 ? 0 : 1;

    // UI 선반영 (Optimistic Update)
    setPosts((prev) =>
      prev.map((p) => {
        if (p.tb_index === postId) {
          return {
            ...p,
            is_user_bookmarked: nextStatus,
            count_bookmark: nextStatus === 1 ? p.count_bookmark + 1 : Math.max(0, p.count_bookmark - 1),
          };
        }
        return p;
      })
    );

    try {
      const response = await apiCommonClient.post<any, { content_index: number; status: number }>(
        '/sns/ubookmark',
        { content_index: postId, status: nextStatus }
      );

      // 실패 시 원래 상태로 롤백
      if (response?.message !== 'SUCCESS' && response?.result !== 0) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.tb_index === postId) {
              return {
                ...p,
                is_user_bookmarked: currentStatus,
                count_bookmark: currentStatus === 1 ? p.count_bookmark + 1 : Math.max(0, p.count_bookmark - 1),
              };
            }
            return p;
          })
        );
        showToast('북마크 처리 실패');
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setPosts((prev) =>
        prev.map((p) => {
          if (p.tb_index === postId) {
            return {
              ...p,
              is_user_bookmarked: currentStatus,
              count_bookmark: currentStatus === 1 ? p.count_bookmark + 1 : Math.max(0, p.count_bookmark - 1),
            };
          }
          return p;
        })
      );
      console.error('북마크 API 통신 오류:', error);
    }
  };

  // Reservations with DP
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: 'RES-8921',
      hotelName: 'Okada Manila (오카다 마닐라)',
      hotelLocation: 'Manila, Philippines',
      roomType: 'Executive Ocean View Suite',
      checkIn: '2026.07.10',
      checkOut: '2026.07.12',
      nights: 2,
      guests: 2,
      totalDp: 1200,
      status: '확정',
      createdAt: '2026.07.01',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
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

  // Poly Market Votes with 100 DP fixed amount
  const [polyVotes, setPolyVotes] = useState<PolyVote[]>([
    {
      id: 'pv-1',
      marketId: 'pm-social-1',
      title: '비트코인(BTC) 2026 Q3 내 $100,000 도달 여부',
      category: 'Crypto',
      choice: 'YES',
      amountDp: 100,
      currentOdds: '68%',
      status: '진행중',
      date: '2026.08.02'
    },
    {
      id: 'pv-2',
      marketId: 'pm-social-2',
      title: '미 연준(Fed) 차기 FOMC 기준금리 50bp 빅컷 단행 여부',
      category: 'Macro',
      choice: 'NO',
      amountDp: 100,
      currentOdds: '58%',
      status: '진행중',
      date: '2026.08.05'
    }
  ]);

 const getUserVoteForMarket = (marketId: string): PolyVote | undefined => {
    return polyVotes.find(v => v.marketId === marketId || v.title === marketId);
  };

  // Fixed 100 DP vote logic supporting re-voting
  const castPolyVote = (
    marketId: string,
    title: string,
    category: string,
    choice: string,
    odds: string
  ): { success: boolean; isRevote: boolean; prevChoice?: string; msg?: string } => {
    const existingVoteIndex = polyVotes.findIndex(v => v.marketId === marketId || v.title === title);

    if (existingVoteIndex >= 0) {
      const existingVote = polyVotes[existingVoteIndex];
      const prevChoice = existingVote.choice;

      // Re-voting replaces choice without deducting extra DP (or maintains 100 DP position)
      setPolyVotes(prev => {
        const next = [...prev];
        next[existingVoteIndex] = {
          ...existingVote,
          choice,
          currentOdds: odds,
          date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
        };
        return next;
      });

      // Add a re-vote transaction log
      const tx: WalletTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        type: '배팅',
        title: `폴리마켓 투표 변경: [${prevChoice}] → [${choice}]`,
        amount: 0,
        date: new Date().toLocaleString('ko-KR', { hour12: false }),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
        status: '완료'
      };
      setWalletTransactions(prev => [tx, ...prev]);

      showToast(`투표가 [${choice}]로 성공적으로 변경되었습니다.`);
      return { success: true, isRevote: true, prevChoice };
    }

    // New vote: check DP balance
    if (user.walletDp < 100) {
      showToast('보유 DP가 부족합니다. (최소 100 DP 필요)');
      return { success: false, isRevote: false, msg: 'DP 부족' };
    }

    // Deduct 100 DP
    setUser(prev => ({ ...prev, walletDp: prev.walletDp - 100 }));

    // Add transaction
    const tx: WalletTransaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: '배팅',
      title: `폴리마켓 투표 참여: ${choice} (${title.slice(0, 16)}...)`,
      amount: -100,
      date: new Date().toLocaleString('ko-KR', { hour12: false }),
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
      status: '완료'
    };
    setWalletTransactions(prev => [tx, ...prev]);

    // Add new vote record
    const newVote: PolyVote = {
      id: `pv-${Date.now()}`,
      marketId,
      title,
      category,
      choice,
      amountDp: 100,
      currentOdds: odds,
      status: '진행중',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
    };
    setPolyVotes(prev => [newVote, ...prev]);

    showToast(`폴리마켓 [${choice}]에 100 DP 투표가 완료되었습니다!`);
    return { success: true, isRevote: false };
  };

  // FreeRoom Interactive Booking State Flow with DP
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

  const startBooking = (hotel: { name: string; location: string; roomType: string; pricePerNightUsdt?: number; pricePerNightDp?: number; image: string }) => {
    const unitPrice = hotel.pricePerNightDp || hotel.pricePerNightUsdt || 600;
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

  // Complete Payment: Immediate state updates to Reservations & Coin Wallet (DP)
  const completePayment = () => {
    // 1. Deduct DP balance
    setUser(prev => ({
      ...prev,
      walletDp: Math.max(0, prev.walletDp - booking.totalDp)
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
      title: `FreeRoom 예약 (${booking.hotelName})`,
      amount: -booking.totalDp,
      date: new Date().toLocaleString('ko-KR', { hour12: false }),
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...f32a`,
      status: '완료'
    };
    setWalletTransactions(prev => [tx, ...prev]);

    setBooking(prev => ({ ...prev, step: 'success' }));
    showToast('예약 및 DP 결제가 완료되었습니다!');
  };
  
  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);

  return (
    <AppContext.Provider
      value={{
        user,
        isLoggedIn,
        setIsLoggedIn,
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
        walletTransactions,
        polyVotes,
        polyMarkets,
        selectedMarket,
        setSelectedMarket,
        castPolyVote,
        getUserVoteForMarket,
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
        refreshLogin
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