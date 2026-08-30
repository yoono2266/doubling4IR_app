import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { apiCommonClient, ApiError, ResultCode } from '../utils/apiClient';

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
  {
    key: 'X',
    label: 'Continue with X',
    className: 'bg-black hover:bg-slate-900 border border-slate-700 text-white',
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: 'Facebook',
    label: 'Continue with Facebook',
    className: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: 'Apple',
    label: 'Continue with Apple',
    className: 'bg-[#0D1B2A] border border-[#1F334D] hover:bg-[#162639] text-white',
    icon: (
      <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.76 1.05-1.82.93-2.88-.91.04-2.03.61-2.68 1.37-.58.67-1.09 1.76-.95 2.8.1.01 2.08-.53 2.7-1.29z" />
      </svg>
    ),
  },
];

export const LoginScreen: React.FC = () => {
  const {
    setIsLoggedIn,
    setCurrentTab,
    setCurrentSubScreen,
    showToast,
    grantLoginBonus,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 로그인 성공 후 보너스 모달 노출 여부 (홈 이동은 모달 확인 시점에)
  const [bonusVisible, setBonusVisible] = useState(false);

  // 로그인 성공 공통 처리: 화면 전환은 미루고 보너스 모달부터 띄운다.
  const openLoginBonus = () => {
    setErrorMsg(null);
    setBonusVisible(true);
  };

  // 보너스 확인 → DP 지급(mock) → 홈 이동 → 토스트
  const confirmBonusAndGoHome = () => {
    grantLoginBonus();
    setBonusVisible(false);
    setIsLoggedIn(true);
    setCurrentTab('home');
    setCurrentSubScreen(null);
    showToast('오늘의 로그인 보너스 150 DP가 지급되었어요');
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
        { userid: email.trim(), upass: password }
      );

      switch (response.result) {
        case ResultCode.SUCCESS: {
          const session = response.data?.loginfo?.['$session'];
          if (session) {
            localStorage.setItem('sessionid', session);
            localStorage.setItem('user_info', JSON.stringify(response.data?.userinfo ?? {}));
            openLoginBonus();
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

  // 소셜 로그인 — 실제 OAuth 연동 없음. 데모(체험) 모드 mock 로그인.
  const handleMockSocial = (provider: string) => {
    showToast(`(데모) ${provider} 계정으로 체험 로그인합니다`);
    openLoginBonus();
  };

  // 데모 계정 체험 — 실제 가입/인증 없이 앱을 둘러보기 위한 mock 진입.
  const handleDemoLogin = () => {
    showToast('데모 계정으로 체험을 시작합니다 (mock)');
    openLoginBonus();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6">
      <div className="w-full max-w-sm bg-[#162639] border border-[#1F334D] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">

        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0D1B2A] border-2 border-[#C5A059] p-2 flex items-center justify-center shadow-lg">
            <img src={LOGO_BASE64} alt="DOUBLING" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest font-mono">DOUBLING</h1>
          <p className="text-[11px] text-[#C5A059] font-medium tracking-wide">
            VIP CASINO &amp; HOTEL FREEROOM PLATFORM
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

        {/* Demo Account (mock) */}
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

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-[#1F334D] w-full"></div>
          <span className="bg-[#162639] px-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider absolute">
            or continue with
          </span>
        </div>

        {/* Social buttons (mock — no real OAuth) */}
        <div className="flex flex-col gap-2">
          {SOCIAL_PROVIDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleMockSocial(p.key)}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow transition ${p.className}`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}
          <p className="text-[10px] text-slate-500 text-center mt-1">
            소셜 로그인은 현재 데모(체험) 모드입니다 · 실제 계정 연동 없음
          </p>
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
              <h3 className="text-base font-black text-white">오늘의 로그인 보너스</h3>
              <p className="text-3xl font-extrabold text-[#FFF0D0] gold-gradient-text font-mono mt-1">
                +150 <span className="text-lg">DP</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                예측 챌린지 투표에 사용할 수 있는 DP가 지급됩니다.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">* 데모 지급(mock)이며 현금 환전은 불가합니다.</p>
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
