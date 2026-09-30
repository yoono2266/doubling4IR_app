import React, { useEffect, useRef, useState } from 'react';
import { apiCommonClient, ApiError, ResultCode } from '../../utils/apiClient';

// 2026-09-30: 로그인 화면 "Forgot Password?" → 비밀번호 재설정 3단계 흐름.
//   ① 이메일 입력 → 인증번호 발송 (SNS 가입 계정이면 해당 소셜 로그인 안내)
//   ② 인증번호 입력 (유효 5분, 재발송은 60초 간격)
//   ③ 새 비밀번호 저장 → 로그인 화면으로 이동
//
// ⚠️ 아래 3개 엔드포인트는 BE 미제공 상태의 FE 제안 경로·필드입니다 (tools/patch/BE_API_REQUESTS.md
//    REQ-260927-01). BE가 경로·필드명을 확정하면 이 파일의 RESET_API와 응답 타입만 맞추면 됩니다.
//
// 개발용 미리보기(mock): 서버 API가 생기기 전 화면 확인용. localhost 개발 서버(import.meta.env.DEV)에서
//   주소에 ?pwreset_preview=1 을 붙여 열었을 때만 켜지며, 라이브 빌드에서는 동작하지 않습니다.
//   미리보기는 서버 호출 없이 단계 전환만 흉내 내고, 로그인 처리는 하지 않습니다.
//   - 이메일이 google@ / kakao@ 로 시작하면 SNS 가입 계정 응답
//   - 인증번호 123456 만 통과

const RESET_API = {
  sendCode: '/members/upass-reset-send',
  verifyCode: '/members/upass-reset-verify',
  resetPassword: '/members/upass-reset',
} as const;

const CODE_LENGTH = 6;
const CODE_TTL_SEC = 5 * 60;
const RESEND_COOLDOWN_SEC = 60;
// 임시 규칙: 서버 비밀번호 규칙 확정 전까지 길이만 검사 (BE_API_REQUESTS.md REQ-260927-01에 규칙 확정 요청)
const MIN_PASSWORD_LENGTH = 8;
// 이메일 형식: 아이디@도메인.최상위도메인 (공백 불가)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const IS_PREVIEW_MODE = (() => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocalHost && new URLSearchParams(window.location.search).get('pwreset_preview') === '1';
})();

type SocialPlatform = 'google' | 'kakao' | string;

// 인증번호 발송 응답 (FE 제안) — SNS 가입 계정이면 data.platform에 가입 방식이 담겨 온다
interface SendCodeResponse {
  result: ResultCode;
  message?: string;
  data?: { platform?: SocialPlatform | null; expire_sec?: number; resend_sec?: number };
}

// 인증번호 검증 응답 (FE 제안) — 새 비밀번호 저장에 쓸 1회용 토큰
interface VerifyCodeResponse {
  result: ResultCode;
  message?: string;
  data?: { reset_token?: string };
}

interface ResetPasswordResponse {
  result: ResultCode;
  message?: string;
}

type Step = 'email' | 'code' | 'password';

const PLATFORM_LABEL: Record<string, string> = { google: 'Google', kakao: '카카오' };

const previewDelay = () => new Promise((resolve) => setTimeout(resolve, 600));

const formatRemain = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const INPUT_CLASS =
  'w-full bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition disabled:opacity-60';
const PRIMARY_BUTTON_CLASS =
  'w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed';

interface PasswordResetFlowProps {
  initialEmail?: string;
  onBackToLogin: (email?: string) => void;
  onCompleted: (email: string) => void;
}

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({ initialEmail = '', onBackToLogin, onCompleted }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  // 입력창을 한 번 벗어났거나 발송을 눌렀을 때부터 형식 오류를 표시 (타이핑 도중에는 빨간 표시를 띄우지 않음)
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const isEmailFormatError = isEmailTouched && email.trim() !== '' && !EMAIL_PATTERN.test(email.trim());
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  // SNS 가입 계정으로 확인된 경우의 가입 방식 (이 경우 인증번호를 보내지 않는다)
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform | null>(null);

  // 인증번호 만료·재발송 가능 시각 (epoch ms) + 1초 단위 갱신용 현재 시각
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 'code') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const remainSec = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendRemainSec = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  const isCodeExpired = step === 'code' && remainSec === 0;

  const describeError = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) return `${fallback} (상태 코드: ${error.status})`;
    return fallback;
  };

  // ① 인증번호 발송 (최초 발송과 재발송 공용)
  const requestCode = async (isResend: boolean) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('이메일을 입력해 주세요.');
      return;
    }
    // 2026-09-30: @ 없는 값 등 형식이 틀린 이메일은 서버 호출 전에 막는다 (서버 "발송 실패"로 오인되지 않도록)
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setIsEmailTouched(true);
      setErrorMsg(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    setSocialPlatform(null);

    try {
      let response: SendCodeResponse;
      if (IS_PREVIEW_MODE) {
        await previewDelay();
        const prefix = trimmedEmail.split('@')[0].toLowerCase();
        response = { result: ResultCode.SUCCESS, data: { platform: prefix === 'google' || prefix === 'kakao' ? prefix : null } };
      } else {
        response = await apiCommonClient.post<SendCodeResponse, { userid: string }>(
          RESET_API.sendCode,
          { userid: trimmedEmail },
          { suppressErrorToast: true }
        );
      }

      switch (response.result) {
        case ResultCode.SUCCESS: {
          const platform = response.data?.platform;
          if (platform) {
            setSocialPlatform(platform);
            setStep('email');
            break;
          }
          const ttl = response.data?.expire_sec ?? CODE_TTL_SEC;
          const cooldown = response.data?.resend_sec ?? RESEND_COOLDOWN_SEC;
          const sentAt = Date.now();
          setExpiresAt(sentAt + ttl * 1000);
          setResendAvailableAt(sentAt + cooldown * 1000);
          setNow(sentAt);
          setCode('');
          setStep('code');
          setInfoMsg(isResend ? '인증번호를 다시 보냈습니다. 새 번호를 입력해 주세요.' : '해당 이메일로 인증번호가 발송되었습니다.');
          window.setTimeout(() => codeInputRef.current?.focus(), 50);
          break;
        }
        case ResultCode.USER_NOT_FOUND:
        case ResultCode.INVALID_ID:
          setErrorMsg('가입되지 않았거나 유효하지 않은 이메일입니다.');
          break;
        default:
          // 서버 message는 영문 기술 문구일 수 있어 화면에는 한국어 안내만, 원문은 콘솔에 남긴다
          console.error('[upass-reset-send] 실패:', response.result, response.message);
          setErrorMsg(`인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요. (에러 코드: ${response.result})`);
          break;
      }
    } catch (error) {
      console.error('비밀번호 재설정 인증번호 발송 오류:', error);
      setErrorMsg(describeError(error, '인증번호 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ② 인증번호 검증
  const verifyCode = async () => {
    if (isCodeExpired) {
      setErrorMsg('인증번호 유효 시간이 지났습니다. 재발송을 눌러 주세요.');
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setErrorMsg(`인증번호 ${CODE_LENGTH}자리를 입력해 주세요.`);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      let response: VerifyCodeResponse;
      if (IS_PREVIEW_MODE) {
        await previewDelay();
        response = code === '123456'
          ? { result: ResultCode.SUCCESS, data: { reset_token: 'preview-token' } }
          : { result: ResultCode.FAILURE, message: '인증번호가 일치하지 않습니다.' };
      } else {
        response = await apiCommonClient.post<VerifyCodeResponse, { userid: string; code: string }>(
          RESET_API.verifyCode,
          { userid: email.trim(), code },
          { suppressErrorToast: true }
        );
      }

      const token = response.data?.reset_token;
      if (response.result === ResultCode.SUCCESS && token) {
        setResetToken(token);
        setInfoMsg(null);
        setStep('password');
      } else {
        console.error('[upass-reset-verify] 실패:', response.result, response.message);
        setErrorMsg('인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 인증번호 검증 오류:', error);
      setErrorMsg(describeError(error, '인증번호 확인 중 오류가 발생했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ③ 새 비밀번호 저장
  const submitNewPassword = async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setErrorMsg('두 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      let response: ResetPasswordResponse;
      if (IS_PREVIEW_MODE) {
        await previewDelay();
        response = { result: ResultCode.SUCCESS };
      } else {
        response = await apiCommonClient.post<ResetPasswordResponse, { userid: string; reset_token: string; upass: string }>(
          RESET_API.resetPassword,
          { userid: email.trim(), reset_token: resetToken, upass: newPassword },
          { suppressErrorToast: true }
        );
      }

      if (response.result === ResultCode.SUCCESS) {
        onCompleted(email.trim());
      } else {
        console.error('[upass-reset] 실패:', response.result, response.message);
        setErrorMsg(`비밀번호 변경에 실패했습니다. 처음부터 다시 시도해 주세요. (에러 코드: ${response.result})`);
      }
    } catch (error) {
      console.error('비밀번호 재설정 저장 오류:', error);
      setErrorMsg(describeError(error, '비밀번호 변경 중 오류가 발생했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (step === 'email') requestCode(false);
    else if (step === 'code') verifyCode();
    else submitNewPassword();
  };

  const stepIndex = step === 'email' ? 0 : step === 'code' ? 1 : 2;
  const STEP_LABELS = ['이메일 확인', '인증번호', '새 비밀번호'];

  const heading =
    step === 'email' ? '비밀번호 재설정' : step === 'code' ? '인증번호 입력' : '새 비밀번호 설정';
  const description =
    step === 'email'
      ? '가입한 이메일로 인증번호를 보내 드립니다.'
      : step === 'code'
        ? `${email.trim()} 으로 받은 인증번호 ${CODE_LENGTH}자리를 입력해 주세요.`
        : '로그인에 사용할 새 비밀번호를 입력해 주세요.';

  return (
    <div className="flex flex-col gap-5">
      {/* 상단: 뒤로가기 + 단계 표시 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onBackToLogin(email.trim())}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          로그인으로
        </button>
        {IS_PREVIEW_MODE && (
          <span className="text-[10px] font-bold text-amber-300 border border-amber-300/40 rounded-md px-1.5 py-0.5">
            미리보기 (mock)
          </span>
        )}
      </div>

      <ol className="grid grid-cols-3 gap-2" aria-label="비밀번호 재설정 진행 단계">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className="flex flex-col gap-1.5">
            <span className={`h-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-[#C5A059]' : 'bg-[#1F334D]'}`} />
            <span className={`text-[10px] font-semibold ${i === stepIndex ? 'text-[#E2C28E]' : 'text-slate-500'}`}>{label}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-black text-white">{heading}</h2>
        <p className="text-[11px] text-slate-400 leading-relaxed break-all">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {step === 'email' && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-300" htmlFor="reset-email">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSocialPlatform(null);
              }}
              onBlur={() => setIsEmailTouched(true)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={isEmailFormatError}
              aria-describedby="reset-email-help"
              className={`${INPUT_CLASS} ${isEmailFormatError ? 'border-rose-400/70 focus:border-rose-400' : ''}`}
              disabled={isLoading}
              autoFocus
            />
            <p
              id="reset-email-help"
              className={`text-[10px] font-medium ${isEmailFormatError ? 'text-rose-300' : 'text-slate-500'}`}
            >
              {isEmailFormatError
                ? '올바른 이메일 형식이 아닙니다. @를 포함한 전체 주소를 입력해 주세요. (예: name@example.com)'
                : '올바른 형식의 이메일 주소만 입력할 수 있습니다. (예: name@example.com)'}
            </p>
          </div>
        )}

        {step === 'code' && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300" htmlFor="reset-code">
                인증번호
              </label>
              <span
                className={`text-[11px] font-bold font-mono tabular-nums ${isCodeExpired ? 'text-rose-300' : 'text-[#E2C28E]'}`}
                aria-live="polite"
              >
                {isCodeExpired ? '시간 만료' : formatRemain(remainSec)}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                id="reset-code"
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                placeholder={'0'.repeat(CODE_LENGTH)}
                className={`${INPUT_CLASS} font-mono tracking-[0.4em] text-sm`}
                disabled={isLoading || isCodeExpired}
              />
              <button
                type="button"
                onClick={() => requestCode(true)}
                disabled={isLoading || resendRemainSec > 0}
                className="shrink-0 px-3 rounded-xl border border-[#C5A059]/60 text-[#E2C28E] text-[11px] font-bold hover:bg-[#C5A059]/10 active:scale-[0.98] transition disabled:border-[#1F334D] disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {resendRemainSec > 0 ? `재발송 ${resendRemainSec}s` : '재발송'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              인증번호는 5분간 유효하며, 재발송은 1분에 한 번 가능합니다.
            </p>
          </div>
        )}

        {step === 'password' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300" htmlFor="reset-new-password">
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={`${MIN_PASSWORD_LENGTH}자 이상 입력`}
                  autoComplete="new-password"
                  className={`${INPUT_CLASS} pr-10`}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                >
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-300" htmlFor="reset-new-password-confirm">
                새 비밀번호 확인
              </label>
              <input
                id="reset-new-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="한 번 더 입력"
                autoComplete="new-password"
                className={INPUT_CLASS}
                disabled={isLoading}
              />
              {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                <p className="text-[10px] font-semibold text-rose-300">두 비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
          </>
        )}

        {/* SNS 가입 계정 안내 — 인증번호를 보내지 않고 해당 소셜 로그인으로 안내 */}
        {socialPlatform && (
          <div className="flex flex-col gap-2 rounded-xl border border-[#C5A059]/40 bg-[#C5A059]/10 px-3.5 py-3">
            <p className="text-[11px] font-semibold text-[#FFF0D0] leading-relaxed">
              {PLATFORM_LABEL[socialPlatform] ?? socialPlatform} 계정으로 가입된 이메일입니다.
              <br />
              {PLATFORM_LABEL[socialPlatform] ?? socialPlatform} 로그인을 이용해 주세요.
            </p>
            <button
              type="button"
              onClick={() => onBackToLogin(email.trim())}
              className="self-start text-[11px] font-bold text-[#E2C28E] hover:underline"
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        )}

        {infoMsg && !errorMsg && (
          <p className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            {infoMsg}
          </p>
        )}

        {errorMsg && (
          <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        {!socialPlatform && (
          <button
            type="submit"
            disabled={isLoading || (step === 'code' && (isCodeExpired || code.length !== CODE_LENGTH))}
            className={`${PRIMARY_BUTTON_CLASS} mt-1`}
          >
            {isLoading
              ? '처리 중...'
              : step === 'email'
                ? '인증번호 발송'
                : step === 'code'
                  ? '인증하기'
                  : '비밀번호 변경'}
          </button>
        )}

        {step === 'code' && (
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setInfoMsg(null);
              setErrorMsg(null);
            }}
            className="text-[11px] font-semibold text-slate-400 hover:text-white transition"
          >
            이메일 다시 입력
          </button>
        )}
      </form>
    </div>
  );
};
