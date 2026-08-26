import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserPersona,
  Post,
  Reservation,
  WalletTransaction,
  PolyVote,
  SettingsState,
  BookingFlowState,
  TierAccrualRecord,
  AttendanceStreakState
} from '../types';
import { PolyMarketItem, INITIAL_POLY_MARKETS } from '../data/polyMarketData';
import { INITIAL_TIER_RECORDS } from '../data/membershipData';

interface AppContextType {
  user: UserPersona;
  setUser: React.Dispatch<React.SetStateAction<UserPersona>>;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  currentTab: 'jackpot' | 'poly' | 'home' | 'freeroom' | 'my';
  setCurrentTab: (tab: 'jackpot' | 'poly' | 'home' | 'freeroom' | 'my') => void;
  currentSubScreen: string | null;
  setCurrentSubScreen: (screen: string | null) => void;
  
  // Membership Tier Records
  tierRecords: TierAccrualRecord[];
  addTierRecord: (record: Omit<TierAccrualRecord, 'id'>) => void;

  // Active Trip & Check-in State (for IR Demo)
  hasActiveTrip: boolean;
  setHasActiveTrip: React.Dispatch<React.SetStateAction<boolean>>;

  // Streak & Daily Login Bonus State
  streakState: AttendanceStreakState;
  showLoginBonusModal: boolean;
  setShowLoginBonusModal: (show: boolean) => void;
  claimDailyLoginBonus: () => void;
  claimStreakMilestone: (day: number) => void;

  // Data State
  posts: Post[];
  addPost: (title: string, content: string, category: string) => void;
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  toggleLikePost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;

  reservations: Reservation[];
  addReservation: (res: Omit<Reservation, 'id' | 'createdAt'>) => void;

  walletTransactions: WalletTransaction[];
  polyVotes: PolyVote[];
  polyMarkets: PolyMarketItem[];
  selectedMarket: PolyMarketItem | null;
  setSelectedMarket: (market: PolyMarketItem | null) => void;
  castPolyVote: (marketId: string, title: string, category: string, choice: string, odds: string, amountDp?: number) => { success: boolean; isRevote: boolean; prevChoice?: string; prevAmount?: number; participationRewardDp?: number; msg?: string };
  earlyExitPolyVote: (voteId: string) => { success: boolean; returnDp: number };
  getUserVoteForMarket: (marketId: string) => PolyVote | undefined;

  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;

  // Booking Flow State
  booking: BookingFlowState;
  setBooking: React.Dispatch<React.SetStateAction<BookingFlowState>>;
  startBooking: (hotel: { name: string; location: string; roomType: string; pricePerNightCoins?: number; pricePerNightDp?: number; pricePerNightUsdt?: number; image: string }) => void;
  completePayment: () => void;

  // UI state
  showWriteModal: boolean;
  setShowWriteModal: (show: boolean) => void;
  selectedHotelId: string;
  setSelectedHotelId: (id: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'jackpot' | 'poly' | 'home' | 'freeroom' | 'my'>('home');
  const [currentSubScreen, setCurrentSubScreen] = useState<string | null>('login');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('okada');
  const [polyMarkets] = useState<PolyMarketItem[]>(INITIAL_POLY_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState<PolyMarketItem | null>(null);

  // Active Trip (Check-in) State for IR Demo - Initial state is false
  const [hasActiveTrip, setHasActiveTrip] = useState<boolean>(false);

  // Initial Persona Preset - Kevin, 50s, ETERNITY Membership (2,150 Tier Score, expires 2028.01.31), 20,000 Coins (Coin Wallet) & 2,480 DP (Prediction Challenge)
  const [user, setUser] = useState<UserPersona>({
    name: 'Kevin',
    title: '',
    company: 'DOUBLING VIP',
    ageGroup: '50대',
    membershipTier: 'ETERNITY',
    tierScore: 2150,
    tierExpiration: '2028년 1월 31일까지',
    walletCoin: 20000,
    walletDp: 2480,
    referralCode: 'KEVIN-VIP-2026',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  });

  // Attendance & Streak state (Preset: 7-day streak)
  const [streakState, setStreakState] = useState<AttendanceStreakState>({
    currentStreakDays: 7,
    lastAttendanceDate: '2026-08-25',
    loginBonusClaimedToday: false,
    milestones: [
      { day: 3, dpBonus: 100, claimed: true },
      { day: 7, dpBonus: 250, claimed: false }, // Preset unclaimed for demo!
      { day: 14, dpBonus: 500, claimed: false },
      { day: 30, dpBonus: 1500, claimed: false }
    ]
  });

  // Modal popup for 150 DP daily login bonus
  const [showLoginBonusModal, setShowLoginBonusModal] = useState<boolean>(false);

  // Trigger login bonus popup when user logs in or lands on screen if not claimed
  useEffect(() => {
    if (isLoggedIn && !streakState.loginBonusClaimedToday) {
      const timer = setTimeout(() => {
        setShowLoginBonusModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, streakState.loginBonusClaimedToday]);

  const claimDailyLoginBonus = () => {
    setUser(prev => ({
      ...prev,
      walletDp: prev.walletDp + 150
    }));
    setStreakState(prev => ({
      ...prev,
      loginBonusClaimedToday: true
    }));
    setShowLoginBonusModal(false);
    showToast('🎉 오늘의 로그인 보너스 +150 DP가 지급되었습니다!');
  };

  const claimStreakMilestone = (day: number) => {
    const milestone = streakState.milestones.find(m => m.day === day);
    if (!milestone || milestone.claimed || streakState.currentStreakDays < day) {
      return;
    }

    setUser(prev => ({
      ...prev,
      walletDp: prev.walletDp + milestone.dpBonus
    }));

    setStreakState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.day === day ? { ...m, claimed: true } : m)
    }));

    showToast(`🔥 ${day}일 연속 출석 달성! +${milestone.dpBonus} DP가 지급되었습니다.`);
  };

  // Doubling Membership Tier Accrual Records
  const [tierRecords, setTierRecords] = useState<TierAccrualRecord[]>(INITIAL_TIER_RECORDS);

  const addTierRecord = (record: Omit<TierAccrualRecord, 'id'>) => {
    const newRecord: TierAccrualRecord = {
      ...record,
      id: `tr-${Date.now()}`
    };
    setTierRecords(prev => [newRecord, ...prev]);
    setUser(prev => ({
      ...prev,
      tierScore: prev.tierScore + record.score
    }));
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
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Community Posts
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'p-promo-okada',
      postType: 'video_promo',
      author: '더블링 공식',
      authorRole: 'Official',
      avatar: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=150&auto=format&fit=crop&q=80',
      timeAgo: '방금 전',
      publishedAt: '2026-08-12 10:01:58',
      title: '오카다 프로모션',
      content: '오카다 마닐라 리조트 VIP 프로모션 공식 영상',
      category: '더블링뉴스',
      hashtags: ['뉴스', '더블링뉴스', '뉴스', '더블링'],
      likes: 84,
      bookmarks: 36,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
      videoThumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-promo-solaire',
      postType: 'video_promo',
      author: '더블링 공식',
      authorRole: 'Official',
      avatar: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=150&auto=format&fit=crop&q=80',
      timeAgo: '방금 전',
      publishedAt: '2026-08-13 14:22:10',
      title: '솔레어 프로모션',
      content: '솔레어 리조트 마닐라 VIP 슬롯 프로모션 안내 영상',
      category: '더블링뉴스',
      hashtags: ['뉴스', '더블링뉴스', '뉴스', '더블링'],
      likes: 67,
      bookmarks: 21,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
      videoThumbnail: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1000&auto=format&fit=crop&q=80'
    },
    {
      id: 'p-promo-cod',
      postType: 'video_promo',
      author: '더블링 공식',
      authorRole: 'Official',
      avatar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&auto=format&fit=crop&q=80',
      timeAgo: '방금 전',
      publishedAt: '2026-08-14 09:15:33',
      title: '시티오브드림즈 프로모션',
      content: '시티오브드림즈 마닐라 럭셔리 호텔 & VIP 라운지 혜택 영상',
      category: '더블링뉴스',
      hashtags: ['뉴스', '더블링뉴스', '뉴스', '더블링'],
      likes: 52,
      bookmarks: 18,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
      videoThumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=80'
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const addPost = (title: string, content: string, category: string) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      author: user.name,
      authorRole: user.title,
      avatar: user.avatar,
      timeAgo: '방금 전',
      title,
      content,
      likes: 0,
      commentsCount: 0,
      category: category || '자유게시판',
      isLiked: false,
      isNew: true
    };
    setPosts(prev => [newPost, ...prev]);
    showToast('커뮤니티에 포스트가 등록되었습니다!');
  };

  const toggleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const toggleBookmarkPost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isB = !p.isBookmarked;
        const count = p.bookmarks ?? 36;
        return {
          ...p,
          isBookmarked: isB,
          bookmarks: isB ? count + 1 : Math.max(0, count - 1)
        };
      }
      return p;
    }));
    showToast('북마크가 변경되었습니다.');
  };

  // Reservations with Coin Wallet (Comp 3 types: FreePlay Suite, Gaming Room, Dining)
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

  // Coin Wallet Transactions (FreeRoom Real Payment & Deposit)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    {
      id: 'TX-001',
      type: '충전',
      title: '코인 지갑 초기 잔액 충전',
      amount: 20000,
      date: '2026.08.01 14:32',
      txHash: '0x8f2a...91b4',
      status: '완료'
    }
  ]);

  // Poly Market Votes Portfolio (DP Exclusive - Free Currency)
  const [polyVotes, setPolyVotes] = useState<PolyVote[]>([
    {
      id: 'pv-1',
      marketId: 'pm-society-1',
      title: '주 4일 근무제, 2027년 내 국내 공공기관 시범 도입 여부',
      category: '사회',
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
      title: '국회 본회의, 2027년도 디지털 자산 기본법 2단계 제정안 연내 통과',
      category: '정치',
      choice: 'YES',
      amountDp: 500,
      currentOdds: '54%',
      initialOdds: '48%',
      oddsChangeText: '매수 시 48% → 현재 54%',
      expectedPayoutDp: 925,
      unrealizedPnlDp: 55,
      status: '진행중',
      date: '2026.08.10'
    },
    // Completed / Settled Positions
    {
      id: 'pv-settled-1',
      marketId: 'pm-pol-old-1',
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
      marketId: 'pm-tech-old-2',
      title: '글로벌 AI 컨퍼런스 기조연설자 깜짝 신모델 현장 공개',
      category: '사회',
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
      marketId: 'pm-ent-old-3',
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

  // Variable DP preset vote logic (100 / 500 / 1,000 / 5,000 DP) supporting re-voting (Operates strictly on walletDp, never touches walletCoin)
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

    // Calculate approx payout based on odds
    const oddsNum = parseInt(odds.replace(/[^0-9]/g, '')) || 50;
    const prob = Math.max(0.05, Math.min(0.95, oddsNum / 100));
    const calculatedPayout = Math.round(amountDp / prob);

    if (existingVoteIndex >= 0) {
      const existingVote = polyVotes[existingVoteIndex];
      const prevChoice = existingVote.choice;
      const prevAmount = existingVote.amountDp || 100;
      const newAmount = amountDp || prevAmount;
      const netDiff = newAmount - prevAmount;

      // If user increased amount during revote, check if they have enough additional DP
      if (netDiff > 0 && user.walletDp < netDiff) {
        showToast(`보유 DP가 부족합니다. (추가 필요: ${netDiff.toLocaleString()} DP)`);
        return { success: false, isRevote: true, prevChoice, prevAmount, msg: 'DP 부족' };
      }

      // Adjust walletDp by netDiff (deduct if increased, refund if decreased)
      if (netDiff !== 0) {
        setUser(prev => ({ ...prev, walletDp: prev.walletDp - netDiff }));
      }

      // Re-voting updates choice, odds, and amount
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

    // New vote: check DP balance against selected preset amount
    if (user.walletDp < amountDp) {
      showToast(`보유 DP가 부족합니다. (${amountDp.toLocaleString()} DP 필요)`);
      return { success: false, isRevote: false, msg: 'DP 부족' };
    }

    // Net DP calculation: Deduct preset amount + Add instant participation reward (+50 DP)
    // 최종 잔액 = 기존잔액 - 매수액 + 50
    const netDpChange = -amountDp + PARTICIPATION_REWARD;
    setUser(prev => ({ ...prev, walletDp: prev.walletDp + netDpChange }));

    // Add new vote record
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
      unrealizedPnlDp: Math.round(amountDp * 0.08), // small positive initial unrealized gain
      status: '진행중',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
    };
    setPolyVotes(prev => [newVote, ...prev]);

    showToast(`예측 투표 완료! 참여 즉시 보상 +${PARTICIPATION_REWARD} DP가 지급되었습니다.`);
    return { success: true, isRevote: false, participationRewardDp: PARTICIPATION_REWARD };
  };

  // Early Exit (Cash Out / 지금 정리하기) for Open Positions
  const earlyExitPolyVote = (voteId: string): { success: boolean; returnDp: number } => {
    const voteIndex = polyVotes.findIndex(v => v.id === voteId);
    if (voteIndex < 0) return { success: false, returnDp: 0 };

    const vote = polyVotes[voteIndex];
    if (vote.status !== '진행중') return { success: false, returnDp: 0 };

    // Calculate return amount: principal + unrealized profit/loss
    const returnDp = Math.max(10, (vote.amountDp || 100) + (vote.unrealizedPnlDp || 0));

    // Credit user's walletDp
    setUser(prev => ({ ...prev, walletDp: prev.walletDp + returnDp }));

    // Mark as settled / completed
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

  // FreeRoom Interactive Booking State Flow with Coin Wallet
  const [booking, setBooking] = useState<BookingFlowState>({
    step: 'detail',
    hotelName: 'Okada Manila (오카다 마닐라)',
    location: 'New Manila Bay, Philippines',
    roomType: 'Executive Ocean Suite',
    pricePerNightCoins: 600,
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
    totalCoins: 1350
  });

  // Calculate live total for booking in Coins
  useEffect(() => {
    let optionsCost = 0;
    if (booking.options.breakfast) optionsCost += 50 * booking.nights * booking.guests;
    if (booking.options.loungeAccess) optionsCost += 100 * booking.nights;
    if (booking.options.airportTransfer) optionsCost += 80;

    const roomCost = booking.pricePerNightCoins * booking.nights;
    setBooking(prev => ({
      ...prev,
      totalCoins: roomCost + optionsCost
    }));
  }, [booking.nights, booking.guests, booking.options, booking.pricePerNightCoins]);

  const startBooking = (hotel: { name: string; location: string; roomType: string; pricePerNightCoins?: number; pricePerNightDp?: number; pricePerNightUsdt?: number; image: string }) => {
    const unitPrice = hotel.pricePerNightCoins || hotel.pricePerNightUsdt || hotel.pricePerNightDp || 600;
    setBooking({
      step: 'date',
      hotelName: hotel.name,
      location: hotel.location,
      roomType: hotel.roomType,
      pricePerNightCoins: unitPrice,
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
      totalCoins: unitPrice * 2 + 200
    });
    setCurrentSubScreen('freeroom-booking');
  };

  // Complete Payment: Deducts ONLY from Coin Wallet (walletCoin), never touches walletDp
  const completePayment = () => {
    // 1. Deduct Coin Wallet balance
    setUser(prev => ({
      ...prev,
      walletCoin: Math.max(0, prev.walletCoin - booking.totalCoins)
    }));

    // 2. Add to Reservations with "확정" status
    addReservation({
      benefitType: 'freeplay_suite',
      hotelName: booking.hotelName,
      hotelLocation: booking.location,
      roomType: booking.roomType,
      checkIn: booking.startDate.replace(/-/g, '.'),
      checkOut: booking.endDate.replace(/-/g, '.'),
      nights: booking.nights,
      guests: booking.guests,
      totalCoins: booking.totalCoins,
      status: '확정',
      image: booking.image
    });

    // 3. Add to Wallet Transactions (Coin Wallet)
    const tx: WalletTransaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      type: '신청 결제',
      title: `FreePlay 신청 (${booking.hotelName})`,
      amount: -booking.totalCoins,
      date: new Date().toLocaleString('ko-KR', { hour12: false }),
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...f32a`,
      status: '완료'
    };
    setWalletTransactions(prev => [tx, ...prev]);

    setBooking(prev => ({ ...prev, step: 'success' }));
    // Automatically activate In-House Stay (hasActiveTrip = true) upon booking completion
    setHasActiveTrip(true);
    showToast('예약 및 코인 결제가 완료되었습니다!');
  };

  const [showWriteModal, setShowWriteModal] = useState<boolean>(false);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        currentTab,
        setCurrentTab,
        currentSubScreen,
        setCurrentSubScreen,
        hasActiveTrip,
        setHasActiveTrip,
        tierRecords,
        addTierRecord,
        streakState,
        showLoginBonusModal,
        setShowLoginBonusModal,
        claimDailyLoginBonus,
        claimStreakMilestone,
        posts,
        addPost,
        selectedPost,
        setSelectedPost,
        toggleLikePost,
        toggleBookmarkPost,
        reservations,
        addReservation,
        walletTransactions,
        polyVotes,
        polyMarkets,
        selectedMarket,
        setSelectedMarket,
        castPolyVote,
        earlyExitPolyVote,
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
        showToast
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
