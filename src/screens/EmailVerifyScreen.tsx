import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiCommonClient, ResultCode } from '../utils/apiClient';

interface UAuthResponse {
  result: ResultCode | number;
  message?: string;
  sessionid?: string;
  data?: {
    loginfo?: { $session?: string };
    userinfo?: unknown;
  };
}

export const EmailVerifyScreen: React.FC = () => {
  const {
    currentSubScreen,
    setCurrentSubScreen,
    setIsLoggedIn,
    setCurrentTab,
    socialSignupInfo,
    setSocialSignupInfo,
    showToast,
  } = useApp();
  const [isStarting, setIsStarting] = useState(false);

  // Determine current active subscreen step: 'request' | 'receipt' | 'success' | 'fail'
  const getInitialStep = (): 'request' | 'receipt' | 'success' | 'fail' => {
    if (currentSubScreen === 'email-verify-receipt') return 'receipt';
    if (currentSubScreen === 'email-verify-success') return 'success';
    if (currentSubScreen === 'email-verify-fail') return 'fail';
    return 'request';
  };

  const [step, setStep] = useState<'request' | 'receipt' | 'success' | 'fail'>(getInitialStep);
  const [timerSeconds, setTimerSeconds] = useState(47);

  // Sync state if currentSubScreen changes externally
  useEffect(() => {
    if (currentSubScreen === 'email-verify-receipt') setStep('receipt');
    else if (currentSubScreen === 'email-verify-success') setStep('success');
    else if (currentSubScreen === 'email-verify-fail') setStep('fail');
    else setStep('request');
    // 임시 : 회원 가입 처리 완료를 그냥 시켜라.
    setStep('success')
  }, [currentSubScreen]);

  // Timer countdown simulation for request step
  useEffect(() => {
    if (step === 'request' && timerSeconds > 0) {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timerSeconds]);

  const handleStartApp = async () => {
    if (!socialSignupInfo) {
      setIsLoggedIn(true);
      setCurrentTab('home');
      setCurrentSubScreen(null);
      showToast('Kevin 님 환영합니다! 더블링 서비스가 시작되었습니다.');
      return;
    }

    setIsStarting(true);
    try {
      const response = await apiCommonClient.post<UAuthResponse, {}>('/members/uAuth', {userid:socialSignupInfo.platformUid, upass:"123456"}, {
        platform: {
          _platform_uid: socialSignupInfo.platformUid,
          _platform_gid: socialSignupInfo.platformGid,
          _platform_bid: socialSignupInfo.platformBid,
        },
        suppressErrorToast: true,
      });
      const sessionId = response.data?.loginfo?.$session || response.sessionid;

      if (response.result !== ResultCode.SUCCESS || !sessionId) {
        throw new Error(response.message || '자동 로그인에 실패했습니다.');
      }

      localStorage.setItem('sessionid', sessionId);
      localStorage.setItem('user_info', JSON.stringify(response.data?.userinfo ?? {
        email: socialSignupInfo.platformUid,
        sub: socialSignupInfo.platformGid,
        u_profile: socialSignupInfo.profileImage,
      }));
      setSocialSignupInfo(null);
      setIsLoggedIn(true);
      setCurrentTab('home');
      setCurrentSubScreen(null);
      showToast('회원가입 및 자동 로그인이 완료되었습니다.');
    } catch (error) {
      console.error('회원가입 후 자동 로그인 오류:', error);
      showToast(error instanceof Error ? error.message : '자동 로그인에 실패했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col min-h-[85vh] justify-between max-w-sm mx-auto py-4">
      
      {/* Step Quick Switcher Demo Pills for Evaluators 
      <div className="bg-[#162639]/80 border border-[#1F334D] rounded-full p-1 flex items-center justify-between gap-1 mb-2">
        <button 
          onClick={() => { setStep('request'); setCurrentSubScreen('email-verify-request'); }}
          className={`flex-1 py-1 rounded-full text-[10px] font-bold transition ${
            step === 'request' ? 'bg-[#C5A059] text-[#0D1B2A]' : 'text-slate-400 hover:text-white'
          }`}
        >
          2. 요청
        </button>
        <button 
          onClick={() => { setStep('receipt'); setCurrentSubScreen('email-verify-receipt'); }}
          className={`flex-1 py-1 rounded-full text-[10px] font-bold transition ${
            step === 'receipt' ? 'bg-[#C5A059] text-[#0D1B2A]' : 'text-slate-400 hover:text-white'
          }`}
        >
          3. 수신함
        </button>
        <button 
          onClick={() => { setStep('success'); setCurrentSubScreen('email-verify-success'); }}
          className={`flex-1 py-1 rounded-full text-[10px] font-bold transition ${
            step === 'success' ? 'bg-[#C5A059] text-[#0D1B2A]' : 'text-slate-400 hover:text-white'
          }`}
        >
          4. 성공
        </button>
        <button 
          onClick={() => { setStep('fail'); setCurrentSubScreen('email-verify-fail'); }}
          className={`flex-1 py-1 rounded-full text-[10px] font-bold transition ${
            step === 'fail' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          5. 실패
        </button>
      </div>
        */}
      {/* Top Back Header (Only Back Button for Request, Back button or title for others) */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1F334D]">
        <button 
          onClick={() => {
            if (step === 'request') setCurrentSubScreen('signup');
            else if (step === 'receipt') setStep('request');
            else setCurrentSubScreen('login');
          }}
          className="w-8 h-8 rounded-full bg-[#162639] border border-[#1F334D] flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        {step === 'receipt' && (
          <span className="text-xs font-bold text-white">이메일 수신함</span>
        )}
        <div className="w-8"></div>
      </div>

      {/* Main View Area by Step */}
      <div className="flex-1 my-auto flex flex-col justify-center items-center py-6">

        {/* ---------------- SCREEN 2. 이메일 인증 요청 ---------------- */}
        {step === 'request' && (
          <div className="w-full flex flex-col items-center text-center space-y-6">
            {/* Square Frame with Envelope Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#162639] border-2 border-[#C5A059] p-3 flex items-center justify-center shadow-lg shadow-[#C5A059]/10">
              <span className="material-symbols-outlined text-3xl text-[#C5A059]">
                mail
              </span>
            </div>

            {/* Headline & Target Email */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                인증 메일을 발송했습니다
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[260px] mx-auto">
                <span className="text-[#C5A059] font-bold">kevin@antigravity.vc</span>
                <span>로 발송되었습니다</span>
              </p>
            </div>

            {/* Countdown Timer & Resend Option */}
            <div className="pt-4 text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <span>메일을 받지 못하셨나요?</span>
              <button 
                type="button"
                onClick={() => {
                  setTimerSeconds(60);
                  showToast('인증 메일이 재발송되었습니다.');
                }}
                className="text-[#C5A059] font-bold hover:underline"
              >
                재전송 {formatTimer(timerSeconds)}
              </button>
            </div>

            {/* Primary Button */}
            <button
              onClick={() => {
                setStep('receipt');
                setCurrentSubScreen('email-verify-receipt');
              }}
              className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition"
            >
              메일함 열기
            </button>
          </div>
        )}


        {/* ---------------- SCREEN 3. 이메일 인증 수령 화면 (데모 시뮬레이션) ---------------- */}
        {step === 'receipt' && (
          <div className="w-full flex flex-col items-center space-y-4 text-left">
            {/* Top Demo Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E2C28E] text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-ping"></span>
              <span>데모: 수신 메일함 미리보기</span>
            </div>

            {/* Smartphone Frame Email Mockup */}
            <div className="w-full bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-2xl space-y-3.5">
              {/* Mail Header */}
              <div className="border-b border-[#1F334D] pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">발신자</span>
                  <span className="text-[10px] text-slate-400">방금 전</span>
                </div>
                <p className="text-xs font-bold text-white">
                  DOUBLING <span className="text-slate-400 font-normal">&lt;no-reply@doubling.com&gt;</span>
                </p>
                <h2 className="text-sm font-extrabold text-[#E2C28E] pt-1">
                  이메일 인증을 완료해주세요
                </h2>
              </div>

              {/* Mail Body Paragraph */}
              <div className="text-xs text-slate-300 leading-relaxed space-y-3 py-1">
                <p>
                  안녕하세요. DOUBLING 서비스 가입을 환영합니다.
                </p>
                <p>
                  가입 절차를 완료하고 안전하게 서비스를 이용하시려면 아래 버튼을 눌러 이메일 주소를 인증해 주세요.
                </p>
              </div>

              {/* Mail Inside Primary Button */}
              <button
                onClick={() => {
                  setStep('success');
                  setCurrentSubScreen('email-verify-success');
                }}
                className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition my-2"
              >
                인증하기
              </button>

              {/* Mail Footer Notice */}
              <p className="text-[10px] text-slate-400 leading-normal border-t border-[#1F334D] pt-2.5">
                본 요청은 24시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시해 주세요.
              </p>
            </div>
          </div>
        )}


        {/* ---------------- SCREEN 4. 이메일 인증 성공 ---------------- */}
        {step === 'success' && (
          <div className="w-full flex flex-col items-center text-center space-y-6">
            {/* 3-Tier Nested Frame (Square -> Circular Gold Badge -> Checkmark) */}
            <div className="w-20 h-20 bg-[#162639] border-2 border-[#C5A059]/60 rounded-2xl p-2 flex items-center justify-center shadow-2xl shadow-[#C5A059]/20">
              <div className="w-14 h-14 bg-[#C5A059] rounded-full flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl text-[#0D1B2A] font-extrabold">
                  check
                </span>
              </div>
            </div>

            {/* Headline & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                회원가입이 완료되었습니다
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[260px] mx-auto">
                이제 더블링의 모든 기능을 이용하실 수 있습니다
              </p>
            </div>

            {/* Primary Button: 시작하기 */}
            <button
              onClick={handleStartApp}
              disabled={isStarting}
              className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition pt-3"
              >
              {isStarting ? '로그인 중...' : '시작하기'}
            </button>
          </div>
        )}


        {/* ---------------- SCREEN 5. 이메일 인증 실패 ---------------- */}
        {step === 'fail' && (
          <div className="w-full flex flex-col items-center text-center space-y-6">
            {/* 3-Tier Nested Frame (Square -> Circular Gold Badge -> Warning Icon) */}
            <div className="w-20 h-20 bg-[#162639] border-2 border-[#C5A059]/60 rounded-2xl p-2 flex items-center justify-center shadow-2xl shadow-rose-900/20">
              <div className="w-14 h-14 bg-[#C5A059] rounded-full flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl text-[#0D1B2A] font-extrabold">
                  priority_high
                </span>
              </div>
            </div>

            {/* Headline & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                인증에 실패했습니다
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[260px] mx-auto">
                인증 링크가 만료되었거나 올바르지 않습니다. 새로운 인증 링크를 요청해 주세요.
              </p>
            </div>

            {/* Primary Button & Sub Link */}
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  setStep('request');
                  setCurrentSubScreen('email-verify-request');
                }}
                className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition"
              >
                재인증 요청
              </button>

              <button
                type="button"
                onClick={() => setCurrentSubScreen('login')}
                className="text-xs text-slate-400 hover:text-[#C5A059] transition block mx-auto pt-1"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
