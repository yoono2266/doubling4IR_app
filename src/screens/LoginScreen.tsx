import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { apiCommonClient, ApiError, ResultCode } from '../utils/apiClient';
import { getStoredUserInfo } from '../utils/auth';
import { getLoginBonusAmount, getLoginBonusTitle } from '../data/streakData';

// /members/uAuth API 응답 타입 (소셜 로그인 서버 인증 체크)
interface UAuthResponse {
  result: ResultCode;
  message?: string;
  sessionid?: string;
  data?: {
    loginfo?: { $session?: string };
    userinfo?: unknown;
  };
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

// 웹 환경 Google Identity Services 스크립트는 한 번만 로드
let googleScriptPromise: Promise<void> | null = null;
const loadGoogleIdentityScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Google 로그인 SDK를 불러오지 못했습니다.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google 로그인 SDK를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Google 사용자 정보를 확인하지 못했습니다.');
  return response.json() as Promise<GoogleUserInfo>;
};

// 네이티브 앱에서도 Android/iOS 전용 OAuth 클라이언트 없이 "웹 애플리케이션" 타입 Client ID만으로
// 로그인할 수 있도록, 시스템 브라우저(Custom Tabs)를 띄워 OAuth 2.0 구현 흐름(implicit flow)을 직접 수행한다.
// 리다이렉트는 HTTPS App Link(https://doubling.wildwynn.com/oauth2redirect)로 받아 앱으로 되돌아온다.
// (Google은 "웹 애플리케이션" 클라이언트의 리다이렉트 URI로 커스텀 스킴을 허용하지 않고 HTTPS만 허용한다.)
const GOOGLE_OAUTH_REDIRECT_URI = 'https://doubling.wildwynn.com/oauth2redirect';
const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state';

const startNativeGoogleOAuth = (webClientId: string): Promise<{ accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', webClientId);
    authUrl.searchParams.set('redirect_uri', GOOGLE_OAUTH_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');

    let settled = false;
    let listenerHandle: { remove: () => void } | null = null;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      Browser.close().catch(() => {});
      listenerHandle?.remove();
      fn();
    };

    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      if (!url.startsWith(GOOGLE_OAUTH_REDIRECT_URI)) return;

      const fragment = url.split('#')[1] || '';
      const params = new URLSearchParams(fragment);
      const returnedState = params.get('state');
      const accessToken = params.get('access_token');
      const error = params.get('error');

      if (error) {
        finish(() => reject(new Error(`Google 인증이 취소되었거나 실패했습니다. (${error})`)));
        return;
      }
      if (returnedState !== localStorage.getItem(GOOGLE_OAUTH_STATE_KEY)) {
        finish(() => reject(new Error('인증 상태 값이 일치하지 않습니다. 다시 시도해 주세요.')));
        return;
      }
      if (!accessToken) {
        finish(() => reject(new Error('Google access token을 받지 못했습니다.')));
        return;
      }

      finish(() => resolve({ accessToken }));
    }).then((handle) => {
      listenerHandle = handle;
    });

    Browser.open({ url: authUrl.toString() }).catch((err) => {
      finish(() => reject(err));
    });
  });
};

// 오늘의 로그인 보너스 모달 하루 1회(계정별) 노출 여부 판단용
const getTodayDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getLoginBonusStorageKey = (uid: string): string => `login_bonus_claimed_${uid}`;

// 로그인 응답(userinfo)에서 create_date를 뽑아온다. 응답에 없으면 apiClient가 자동 동기화한
// localStorage user_info에서라도 확인한다. 값이 없으면 빈 문자열을 반환한다.
const getCreateDateFromResponse = (data?: { userinfo?: unknown }): string => {
  const fromResponse = (data?.userinfo as Record<string, any> | undefined)?.create_date;
  if (typeof fromResponse === 'string' && fromResponse.trim() !== '') return fromResponse;

  const fromStorage = getStoredUserInfo()?.create_date;
  return typeof fromStorage === 'string' ? fromStorage : '';
};

// /members/ulogin API 요청/응답 타입
interface LoginParam {
  userid: string;
  upass: string;
}

interface LoginResponse {
  result: ResultCode;
  message?: string;
  sessionid?: string;
  data?: {
    loginfo?: { $session?: string };
    userinfo?: unknown;
  };
}

const SOCIAL_PROVIDERS = [
  {
    key: 'Google',
    label: 'Continue with Google',
    className: 'bg-white hover:bg-slate-100 text-slate-800',
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    ),
  },
  // 2026-09-15 비활성화 (삭제하지 않고 주석 보존).
  // 사유: 추후 실제 연동 개발 완료되는 순서대로 하나씩 재활성화 예정.
  // {
  //   key: 'X',
  //   label: 'Continue with X',
  //   className: 'bg-black hover:bg-slate-900 border border-slate-700 text-white',
  //   icon: (
  //     <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
  //       <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'Facebook',
  //   label: 'Continue with Facebook',
  //   className: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
  //   icon: (
  //     <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
  //       <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  //     </svg>
  //   ),
  // },
  // {
  //   key: 'Apple',
  //   label: 'Continue with Apple',
  //   className: 'bg-[#0D1B2A] border border-[#1F334D] hover:bg-[#162639] text-white',
  //   icon: (
  //     <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
  //       <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.76 1.05-1.82.93-2.88-.91.04-2.03.61-2.68 1.37-.58.67-1.09 1.76-.95 2.8.1.01 2.08-.53 2.7-1.29z" />
  //     </svg>
  //   ),
  // },
  {
    // 카카오 로그인 공식 디자인 가이드 기준
    // (https://developers.kakao.com/docs/ko/kakaologin/design-guide):
    // 배경 #FEE500 고정(타사 버튼을 상대적으로 강조하지 않도록 반드시 이 색을 지정할 것 — 임의 변경 금지),
    // 심볼 #000000(불투명), 레이블 #000000 85% 불투명도, 컨테이너 radius 12px(기존 rounded-xl과 일치).
    // 레이블 문구는 가이드가 허용하는 완성형 "카카오 로그인"/"Login with Kakao" 또는
    // 축약형 "로그인"/"Login" 중에서만 선택 가능 — "카카오로 시작하기"는 가이드에 없는 문구라 사용하지 않음.
    // 카카오 SDK 연동 전이라 클릭 시 다른 미연동 버튼과 동일하게 Coming Soon 토스트만 노출.
    key: 'Kakao',
    label: '카카오 로그인',
    className: 'bg-[#FEE500] hover:brightness-95 text-black/85',
    icon: (
      // 실제 카카오 공식 심볼(말풍선) 에셋으로 교체 필요 — 가이드상 심볼 형태·비율·색상 임의 변형 금지,
      // 현재는 lucide-react MessageCircle로 임시 대체(색상만 가이드 기준 #000000 고정 적용).
      <MessageCircle className="w-4 h-4 shrink-0" fill="#000000" stroke="#000000" />
    ),
  },
];

export const LoginScreen: React.FC = () => {
  const {
    setIsLoggedIn,
    setCurrentTab,
    setCurrentSubScreen,
    setSocialSignupInfo,
    showToast,
    grantLoginBonus,
    attendanceStreak,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 로그인 성공 후 보너스 모달 노출 여부 (홈 이동은 모달 확인 시점에)
  const [bonusVisible, setBonusVisible] = useState(false);
  // 모달 확인 시 "수령 완료"로 기록할 create_date 값
  const [pendingBonusDate, setPendingBonusDate] = useState('');

  // 로그인 성공 공통 처리: create_date(계정별 출석 기준일)가 없으면 모달 없이 바로 홈으로 이동하고,
  // 이미 해당 create_date로 보너스를 받았으면 역시 모달 없이 홈으로 이동한다.
  // 그 외에는 보너스 모달을 띄운다 (화면 전환은 모달 확인 시점으로 미룸).
  const openLoginBonus = (createDate: string) => {
    setErrorMsg(null);

    const uid = getStoredUserInfo()?.u_id || 'guest';
    const alreadyClaimed = !!createDate && localStorage.getItem(getLoginBonusStorageKey(uid)) === createDate;

    if (!createDate || alreadyClaimed) {
      setIsLoggedIn(true);
      setCurrentTab('home');
      setCurrentSubScreen(null);
      return;
    }

    setPendingBonusDate(createDate);
    setBonusVisible(true);
  };

  // 보너스 확인 → DP 지급(mock) → 홈 이동 → 토스트 (create_date + u_id로 수령 기록)
  const confirmBonusAndGoHome = () => {
    const uid = getStoredUserInfo()?.u_id || 'guest';
    if (pendingBonusDate) {
      localStorage.setItem(getLoginBonusStorageKey(uid), pendingBonusDate);
    }

    grantLoginBonus();
    setBonusVisible(false);
    setIsLoggedIn(true);
    setCurrentTab('home');
    setCurrentSubScreen(null);
    showToast(`${getLoginBonusTitle(attendanceStreak)} ${getLoginBonusAmount(attendanceStreak).toLocaleString()} DP가 지급되었어요`);
    confetti({ particleCount: 90, spread: 72, origin: { y: 0.5 } });
  };

  // 이메일/비밀번호 로그인 — 실제 백엔드(/members/ulogin) 인증
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMsg('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiCommonClient.post<LoginResponse, LoginParam>(
        '/members/ulogin',
        { userid: email.trim(), upass: password },
        { suppressErrorToast: true }
      );

      switch (response.result) {
        case ResultCode.SUCCESS: {
          const session = response.data?.loginfo?.['$session'];
          if (session) {
            console.log('[ulogin] userinfo:', response.data?.userinfo);
            localStorage.setItem('sessionid', session);
            localStorage.setItem('user_info', JSON.stringify(response.data?.userinfo ?? {}));
            openLoginBonus(getCreateDateFromResponse(response.data));
          } else {
            setErrorMsg('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
          }
          break;
        }
        case ResultCode.INVALID_PASSWORD:
          setErrorMsg('비밀번호가 올바르지 않습니다.');
          break;
        case ResultCode.USER_NOT_FOUND:
        case ResultCode.INVALID_ID:
          setErrorMsg('존재하지 않거나 유효하지 않은 이메일 계정입니다.');
          break;
        case ResultCode.SESSION_NOT_EXISTS:
          setErrorMsg('세션이 만료되었습니다. 다시 시도해 주세요.');
          break;
        default:
          setErrorMsg(response.message || `로그인 실패 (에러 코드: ${response.result})`);
          break;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMsg(error.message || `로그인 실패 (상태 코드: ${error.status})`);
      } else {
        setErrorMsg('로그인 통신 중 오류가 발생했습니다.');
      }
      console.error('로그인 API 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2026-09-08 비활성화 (삭제하지 않고 주석 보존).
  // 사유: X/Facebook/Apple 소셜 버튼을 "Coming Soon" 안내(showToast)로 대체 → 이 mock 핸들러의
  //       호출부가 사라짐. 실제 소셜 OAuth 연동 시 이 로직을 참고하거나 복구할 것.
  // 소셜 로그인 — 실제 OAuth 연동 없음. 데모(체험) 모드 mock 로그인.
  // 실제 서버 create_date가 없는 mock 흐름이므로 오늘 날짜로 대체한다.
  // const handleMockSocial = (provider: string) => {
  //   showToast(`(데모) ${provider} 계정으로 체험 로그인합니다`);
  //   openLoginBonus(getTodayDateKey());
  // };

  // Google 로그인 — 네이티브(Capacitor)/웹 OAuth 후 /members/uAuth로 서버 계정 존재 여부 확인.
  // 서버에 이미 가입된 계정이면 로그인 처리, 없으면 구글 정보를 들고 회원가입 화면으로 이동.
  const handleGoogleLogin = async () => {
    // 네이티브/웹 모두 "웹 애플리케이션" 타입 Client ID 하나만 사용합니다.
    // 네이티브는 Android 전용 OAuth client(package + SHA-1) 없이 시스템 브라우저 OAuth로 처리합니다.
    const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!webClientId) {
      showToast('Google Web Client ID가 설정되지 않았습니다.');
      return;
    }

    setIsGoogleLoading(true);

    let platformUid = '';
    let platformGid = '';
    let profileImage: string | undefined;
    let googleProfile: Record<string, unknown> = {};
    let googleAuthenticated = false;

    try {
      if (Capacitor.isNativePlatform()) {
        const { accessToken } = await startNativeGoogleOAuth(webClientId);
        const nativeUser = await fetchGoogleUserInfo(accessToken);

        platformUid = nativeUser.email;
        platformGid = nativeUser.sub;
        profileImage = nativeUser.picture;
        googleProfile = { ...nativeUser };
      } else {
        await loadGoogleIdentityScript();
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) throw new Error('Google 로그인 기능을 사용할 수 없습니다.');

        const userInfo = await new Promise<GoogleUserInfo>((resolve, reject) => {
          const tokenClient = oauth2.initTokenClient({
            client_id: webClientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse.error || !tokenResponse.access_token) {
                reject(new Error('Google 로그인이 취소되었거나 실패했습니다.'));
                return;
              }
              try {
                resolve(await fetchGoogleUserInfo(tokenResponse.access_token));
              } catch (err) {
                reject(err);
              }
            },
          });
          tokenClient.requestAccessToken();
        });

        platformUid = userInfo.email;
        platformGid = userInfo.sub;
        profileImage = userInfo.picture;
        googleProfile = { ...userInfo };
      }

      googleAuthenticated = true;

      // 구글 인증 성공 → 서버에 이미 가입된 계정인지 /members/uAuth로 확인
      const response = await apiCommonClient.post<UAuthResponse, {}>(
        '/members/uAuth',
        { userid: platformUid, upass: '123456' },
        {
          platform: {
            _platform_uid: platformUid,
            _platform_gid: platformGid,
            _platform_bid: 'google',
          },
          // 미가입 사용자 확인용 호출이라 result!=0(미존재)이 정상 흐름이므로 에러 토스트를 띄우지 않는다.
          suppressErrorToast: true,
        }
      );

      const sessionId = response.data?.loginfo?.['$session'] || response.sessionid;

      if (response.result === ResultCode.SUCCESS && sessionId) {
        localStorage.setItem('sessionid', sessionId);
        localStorage.setItem(
          'user_info',
          JSON.stringify(response.data?.userinfo ?? { email: platformUid, sub: platformGid })
        );
        openLoginBonus(getCreateDateFromResponse(response.data));
      } else {
        // 서버에 매칭되는 계정이 없음 → 구글 정보를 들고 회원가입 화면으로 이동
        setSocialSignupInfo({ platformUid, platformGid, platformBid: 'google', profileImage, googleProfile });
        setCurrentSubScreen('signup');
      }
    } catch (error) {
      if (googleAuthenticated) {
        // 구글 인증은 됐지만 서버 확인(/members/uAuth) 실패 → 회원가입으로 유도
        setSocialSignupInfo({ platformUid, platformGid, platformBid: 'google', profileImage, googleProfile });
        setCurrentSubScreen('signup');
        showToast('Google 인증은 완료되었습니다. 회원가입을 진행해 주세요.');
      } else {
        console.error('Google 로그인 오류:', error);
        showToast(error instanceof Error ? error.message : 'Google 로그인에 실패했습니다.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 2026-09-08 비활성화 (삭제하지 않고 주석 보존).
  // 사유: 로그인 화면에서 "데모 계정으로 체험하기" 버튼을 숨김 → 유일한 호출부가 사라져 미사용.
  //       데모/mock 진입 경로를 되살릴 때 아래 JSX(데모 계정 버튼)와 함께 주석 해제할 것.
  // 데모 계정 체험 — 실제 가입/인증 없이 앱을 둘러보기 위한 mock 진입.
  // 실제 서버 create_date가 없는 mock 흐름이므로 오늘 날짜로 대체한다.
  // const handleDemoLogin = () => {
  //   showToast('데모 계정으로 체험을 시작합니다 (mock)');
  //   openLoginBonus(getTodayDateKey());
  // };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6">
      <div className="w-full max-w-sm bg-[#162639] border border-[#1F334D] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">

        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0D1B2A] border-2 border-[#C5A059] p-2 flex items-center justify-center shadow-lg">
            <img src={LOGO_BASE64} alt="DOUBLE RING" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest font-mono">DOUBLE RING</h1>
          <p className="text-[11px] text-[#C5A059] font-medium tracking-wide">
            ASIA&apos;S LARGEST INTEGRATED RESORT TRAVEL PLATFORM
          </p>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                className="w-full bg-[#0D1B2A] border border-[#1F334D] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => {
                setCurrentSubScreen('email-verify-request');
                showToast('비밀번호 재설정 이메일 안내로 이동합니다.');
              }}
              className="text-[11px] font-semibold text-[#C5A059] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : 'Log In'}
          </button>
        </form>

        {/*
          2026-09-08 비활성화 (삭제하지 않고 주석 보존).
          사유: 로그인 화면에서 "데모 계정으로 체험하기" 버튼 + 하위 설명("실제 가입·인증 없이
                둘러보기 (mock)")을 노출하지 않기로 함. 되살릴 경우 위 handleDemoLogin 함수도 함께 해제.
          [원본 JSX]
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-xl bg-[#0D1B2A] border border-dashed border-[#C5A059]/60 text-[#E2C28E] font-bold text-xs hover:border-[#C5A059] hover:bg-[#0D1B2A]/70 active:scale-[0.98] transition flex flex-col items-center gap-0.5"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              데모 계정으로 체험하기
            </span>
            <span className="text-[10px] font-medium text-slate-400">실제 가입·인증 없이 둘러보기 (mock)</span>
          </button>
        */}

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-[#1F334D] w-full"></div>
          <span className="bg-[#162639] px-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider absolute">
            or continue with
          </span>
        </div>

        {/* Social buttons — Google만 실제 OAuth 연동. Kakao는 연동 전까지 "Coming Soon" 안내
            (X/Facebook/Apple은 2026-09-15부로 주석 처리, SOCIAL_PROVIDERS 정의부 참고). */}
        <div className="flex flex-col gap-2">
          {SOCIAL_PROVIDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={p.key === 'Google' && isGoogleLoading}
              onClick={() => {
                if (p.key === 'Google') {
                  handleGoogleLogin();
                  return;
                }
                // Google 외 provider(현재 Kakao)는 실제 연동 전까지 "Coming Soon" 안내만 노출.
                // 실제 연동 시 아래 원래 동작으로 되돌릴 것: handleMockSocial(p.key)
                //   (또는 provider별 실제 OAuth 핸들러 연결)
                showToast(`${p.key} 로그인은 준비 중입니다 (Coming Soon)`);
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow transition disabled:opacity-50 disabled:cursor-not-allowed ${p.className}`}
            >
              {p.icon}
              <span>{p.key === 'Google' && isGoogleLoading ? '로그인 중...' : p.label}</span>
            </button>
          ))}
        </div>

        {/* Sign Up */}
        <div className="text-center pt-2 border-t border-[#1F334D]">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account?
            <button
              type="button"
              onClick={() => setCurrentSubScreen('signup')}
              className="text-[#C5A059] font-bold hover:underline ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      {/* 오늘의 로그인 보너스 모달 */}
      {bonusVisible && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059] rounded-3xl p-6 w-full max-w-xs flex flex-col items-center gap-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#C5A059]/20 border-2 border-[#C5A059] flex items-center justify-center text-[#E2C28E] shadow-lg">
              <span className="material-symbols-outlined text-3xl">redeem</span>
            </div>

            <div>
              <h3 className="text-base font-black text-white">{getLoginBonusTitle(attendanceStreak)}</h3>
              <p className="text-3xl font-extrabold text-[#FFF0D0] gold-gradient-text font-mono mt-1">
                +{getLoginBonusAmount(attendanceStreak).toLocaleString()} <span className="text-3xl">DP</span>
              </p>
            </div>

            <button
              type="button"
              onClick={confirmBonusAndGoHome}
              className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition"
            >
              확인하고 홈으로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
