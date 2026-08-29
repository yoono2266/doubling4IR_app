import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { apiCommonClient, ApiError, ResultCode, CommonResponse } from '../utils/apiClient';

// /members/ulogin API 요청/응답 타입 정의
interface LoginParam {
  userid: string;
  upass: string;
}

interface LoginResponse {
  result: ResultCode;
  message?: string;
  sessionid?: string;
  data?: any;
}

interface UAuthResponse {
  result: ResultCode | number;
  message?: string;
  sessionid?: string;
  data?: {
    loginfo?: {
      $session?: string;
    };
    userinfo?: any;
  };
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  picture?: string;
}

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

const decodeGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Google 사용자 정보를 확인하지 못했습니다.');
  return response.json() as Promise<GoogleUserInfo>;
};

export const LoginScreen: React.FC = () => {
  const { setIsLoggedIn, setCurrentTab, setCurrentSubScreen, setSocialSignupInfo, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 제출 핸들러 (API 호출 연동)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // /members/ulogin API 호출 (a, b, c 공용 규격 자동 적용)
      const response = await apiCommonClient.post<LoginResponse, LoginParam>(
        '/members/ulogin',
        {
          userid: email.trim(),
          upass: password,
        }
      );

      console.log('/members/ulogin 응답 결과:', response);

      // 💡 ResultCode 상수를 활용한 분기 처리
    switch (response.result) {
      case ResultCode.SUCCESS: // 0: 성공
        //console.log('sessionid', response.data?.loginfo?.['$session']);
        if (response.data?.loginfo?.['$session']) {
          localStorage.setItem('sessionid', response.data?.loginfo?.['$session']);
          localStorage.setItem('user_info', JSON.stringify(response.data?.userinfo));
          console.log('response.getItem?.userInfo 응답 결과:', response.data);

          setIsLoggedIn(true);
          setCurrentTab('home');
          setCurrentSubScreen(null);
          showToast(response.message || '로그인되었습니다.');
          break;
        }else{
          alert('로그인에 실패했습니다.');
          break;
        }
        

      case ResultCode.INVALID_PASSWORD: // 12: 비밀번호 불일치
        alert('비밀번호가 올바르지 않습니다.');
        break;

      case ResultCode.USER_NOT_FOUND: // 10: 존재하지 않는 계정
      case ResultCode.INVALID_ID:     // 11: 유효하지 않은 ID
        alert('존재하지 않거나 유효하지 않은 이메일 계정입니다.');
        break;

      case ResultCode.SESSION_NOT_EXISTS: // 2: 세션 정보 없음/만료
        alert('세션이 만료되었습니다. 다시 시도해 주세요.');
        break;

      default:
        // 서버에서 전달된 message 출력
        alert(response.message || `로그인 실패 (에러 코드: ${response.result})`);
        break;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // 서버 HTTP 에러 (400, 401, 500 등) 메시지 알럿
        alert(error.message || `로그인 실패 (상태 코드: ${error.status})`);
      } else {
        alert('로그인 통신 중 오류가 발생했습니다.');
      }
      console.error('로그인 API 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      showToast('Google Client ID가 설정되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    let googleAuthenticated = false;
    let platformUid = '';
    let platformGid = '';
    let profileImage = '';
    let googleProfile: Record<string, unknown> = {};
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleSignIn.initialize({ clientId });
        const nativeUser = await GoogleSignIn.signIn();
        if (!nativeUser.email) throw new Error('Google 계정 이메일을 확인하지 못했습니다.');
        platformUid = nativeUser.email;
        platformGid = nativeUser.userId;
        profileImage = nativeUser.imageUrl ?? '';
        googleProfile = {
          userId: nativeUser.userId,
          email: nativeUser.email,
          displayName: nativeUser.displayName,
          givenName: nativeUser.givenName,
          familyName: nativeUser.familyName,
          imageUrl: nativeUser.imageUrl,
        };
      } else {
        await loadGoogleIdentityScript();
        const google = window.google;
        const oauth2 = google?.accounts?.oauth2;
        if (!oauth2) throw new Error('Google 로그인 기능을 사용할 수 없습니다.');

        const userInfo = await new Promise<GoogleUserInfo>((resolve, reject) => {
          const tokenClient = oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (tokenResponse.error || !tokenResponse.access_token) {
                reject(new Error('Google 로그인이 취소되었거나 실패했습니다.'));
                return;
              }

              try {
                resolve(await decodeGoogleUserInfo(tokenResponse.access_token));
              } catch (error) {
                reject(error);
              }
            },
          });
          tokenClient.requestAccessToken();
        });
        platformUid = userInfo.email;
        platformGid = userInfo.sub;
        profileImage = userInfo.picture ?? '';
        googleProfile = { ...userInfo };
      }
      googleAuthenticated = true;

      const response = await apiCommonClient.post<UAuthResponse, {}>('/members/uAuth', {"userid":platformUid, "upass":"123456"}, {
        platform: {
          _platform_uid: platformUid,
          _platform_gid: platformGid,
          _platform_bid: 'google',
        },
      });

      const sessionId = response.data?.loginfo?.$session || response.sessionid;
      if (response.result === ResultCode.SUCCESS && sessionId) {
        localStorage.setItem('sessionid', sessionId);
        localStorage.setItem('user_info', JSON.stringify(response.data?.userinfo ?? {
          email: platformUid,
          sub: platformGid,
        }));
        setIsLoggedIn(true);
        setCurrentTab('home');
        setCurrentSubScreen(null);
        showToast(response.message || 'Google 계정으로 로그인되었습니다.');
      } else {
        console.log('회원가입 진입 - Google 인증 데이터:', {
          platformUid,
          platformGid,
          platformBid: 'google',
          profileImage,
          googleProfile,
        });
        setSocialSignupInfo({ platformUid, platformGid, platformBid: 'google', profileImage, googleProfile });
        setCurrentSubScreen('signup');
        showToast('회원가입을 완료해 주세요.');
      }
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      if (googleAuthenticated) {
        console.log('회원가입 진입 - Google 인증 데이터:', {
          platformUid,
          platformGid,
          platformBid: 'google',
          profileImage,
          googleProfile,
        });
        setSocialSignupInfo({ platformUid, platformGid, platformBid: 'google', profileImage, googleProfile });
        setCurrentSubScreen('signup');
        showToast('Google 인증은 완료되었습니다. 회원가입을 진행해 주세요.');
      } else {
        showToast(error instanceof Error ? error.message : 'Google 로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Google') {
      void handleGoogleLogin();
      return;
    }

    setIsLoggedIn(true);
    setCurrentTab('home');
    setCurrentSubScreen(null);
    showToast(`${provider} 계정으로 로그인 되었습니다.`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6">
      <div className="w-full max-w-sm bg-[#162639] border border-[#1F334D] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        
        {/* Top Logo & Brand Header */}
        <div className="text-center flex flex-col items-center gap-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#0D1B2A] border-2 border-[#C5A059] p-2 flex items-center justify-center shadow-lg">
            <img src={LOGO_BASE64} alt="DOUBLING" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest font-mono">DOUBLING</h1>
          <p className="text-[11px] text-[#C5A059] font-medium tracking-wide">
            VIP CASINO & HOTEL FREEROOM PLATFORM
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3">
          {/* Email Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-[#0D1B2A] border border-[#1F334D] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
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

          {/* Primary Log In Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loggin in...' : 'Log In'}
          </button>
        </form>

        {/* Divider: or continue with */}
        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-[#1F334D] w-full"></div>
          <span className="bg-[#162639] px-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider absolute">
            or continue with
          </span>
        </div>

        {/* Social Login Buttons in strict order: Google -> X -> Facebook -> Apple */}
        <div className="flex flex-col gap-2">
          {/* 1) Google */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow transition"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* 2) X */}
          <button
            type="button"
            onClick={() => handleSocialLogin('X')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#000000] hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow transition"
          >
            <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Continue with X</span>
          </button>

          {/* 3) Facebook */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow transition"
          >
            <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Continue with Facebook</span>
          </button>

          {/* 4) Apple */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Apple')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0D1B2A] border border-[#1F334D] hover:bg-[#162639] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow transition"
          >
            <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.76 1.05-1.82.93-2.88-.91.04-2.03.61-2.68 1.37-.58.67-1.09 1.76-.95 2.8.1.01 2.08-.53 2.7-1.29z"/>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-[#1F334D]">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button 
              onClick={() => setCurrentSubScreen('signup')}
              className="text-[#C5A059] font-bold hover:underline ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};