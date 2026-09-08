import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiCommonClient, ApiError, ResultCode, CommonResponse } from '../utils/apiClient';

// /members/ulogin API 요청/응답 타입 정의
interface MemberParam {
  u_id: string;
  u_pass?: string;
  u_profile?: string;
  u_name: string;
  u_require_1: boolean;
  u_require_2: boolean;
  u_require_3: boolean;
  u_select_1: boolean;
}

interface MemberResponse {
  result: ResultCode;
  message?: string;
    data?: any;
}

export const SignUpScreen: React.FC = () => {
  const { setIsLoggedIn, setCurrentTab, setCurrentSubScreen, socialSignupInfo, setSocialSignupInfo, showToast } = useApp();
  const isSocialSignup = socialSignupInfo !== null;

  useEffect(() => {
    if (socialSignupInfo?.platformBid === 'google') {
      //console.log('회원가입 화면 진입 - Google 프로필 전체 데이터:', socialSignupInfo);
    }
  }, [socialSignupInfo]);

  // Form State
  const [email, setEmail] = useState(socialSignupInfo?.platformUid ?? '');
  const [nickname, setNickname] = useState('');
  //const [birthdate, setBirthdate] = useState('');
  //const [gender, setGender] = useState<'male' | 'female' | 'none'>('male');
  const [referralCode, setReferralCode] = useState('');

  // Agreements State
  const [termsRequired1, setTermsRequired1] = useState(true);
  const [termsRequired2, setTermsRequired2] = useState(true);
  const [termsMarketing, setTermsMarketing] = useState(false);

  const allChecked = termsRequired1 && termsRequired2 && termsMarketing;
  const requiredChecked = termsRequired1 && termsRequired2;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleAll = () => {
    if (allChecked) {
      setTermsRequired1(false);
      setTermsRequired2(false);
      setTermsMarketing(false);
    } else {
      setTermsRequired1(true);
      setTermsRequired2(true);
      setTermsMarketing(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredChecked) {
      showToast('필수 이용약관에 동의하셔야 합니다.');
      return;
    }

    if (!isSocialSignup && password !== passwordConfirm) {
      showToast('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
          // /members/ulogin API 호출 (a, b, c 공용 규격 자동 적용)
          const response = await apiCommonClient.post<MemberResponse, MemberParam>(
            '/members/ucreate',
            {
              u_id: email.trim(),
              ...(!isSocialSignup ? { u_pass: password } : {u_pass: '123456'}),
              ...(isSocialSignup && socialSignupInfo?.profileImage
                ? { u_profile: socialSignupInfo.profileImage }
                : {}),
              u_name: nickname.trim(),
              u_require_1: termsRequired1,
              u_require_2: termsRequired2,
              u_require_3: true, 
              u_select_1: termsMarketing,
            },
            isSocialSignup && socialSignupInfo
              ? {
                  platform: {
                    _platform_uid: socialSignupInfo.platformUid,
                    _platform_gid: socialSignupInfo.platformGid,
                    _platform_bid: socialSignupInfo.platformBid,
                  },
                  suppressErrorToast: true,
                }
              : { suppressErrorToast: true }
          );
    
          //console.log('/members/ucreate 응답 결과:', response);
    
          // 💡 ResultCode 상수를 활용한 분기 처리
        switch (response.result) {
          case ResultCode.SUCCESS: // 0: 성공
              setIsLoggedIn(false);
              setCurrentTab('home');
              setCurrentSubScreen('login');
              showToast('회원가입 정보가 입력되었습니다. 인증 메일이 발송됩니다.');
              setCurrentSubScreen('email-verify-request');
              break;
            
    
          case ResultCode.DUPLICATED_ID: // 12: 중복된 ID
            alert('이미 사용 중인 이메일 주소입니다.');
            break;
    
          case ResultCode.INVALID_PASSWORD: // 10: 존재하지 않는 계정
            alert('유효하지 패스워드 입니다.');
            break;
          case ResultCode.INVALID_ID:     // 11: 유효하지 않은 ID
            alert('유효하지 않은 이메일 입니다.');
            break;
          
          case ResultCode.INVALID_NAME:     // 18: 유효하지 않은 닉네임
            alert('유효하지 않은 닉네임 입니다.');
            break;
          
          case ResultCode.DUPLICATED_NICKNAME:     // 17: 중복된 닉네임
            alert('이미 사용 중인 닉네임입니다.');
            break;
    
          default:
            // 서버에서 전달된 message 출력
            alert(response.message || `회원가입 실패 (에러 코드: ${response.result})`);
            break;
          }
        } catch (error) {
          if (error instanceof ApiError) {
            // 서버 HTTP 에러 (400, 401, 500 등) 메시지 알럿
            alert(error.message || `회원가입 실패 (상태 코드: ${error.status})`);
          } else {
            alert('회원가입 통신 중 오류가 발생했습니다.');
          }
          //console.error('회원가입 API 오류:', error);
        } finally {
          setIsLoading(false);
        }

    
  };

  return (
    <div className="flex flex-col min-h-[85vh] justify-between max-w-sm mx-auto py-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1F334D]">
        <button 
          onClick={() => {
            setSocialSignupInfo(null);
            setCurrentSubScreen('login');
          }}
          className="w-8 h-8 rounded-full bg-[#162639] border border-[#1F334D] flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <h2 className="text-base font-bold text-white tracking-wide">회원가입</h2>
        <div className="w-8"></div> {/* Spacer for symmetry */}
      </div>

      {/* Main Content */}
      <div className="flex-1 my-4 space-y-5 overflow-y-auto pr-0.5 no-scrollbar">
        {/* Headline Header */}
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            기본 정보를 입력해주세요
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            DOUBLING의 모든 서비스를 이용하기 위해 필요합니다
          </p>
        </div>

        {/* Input Fields Stack */}
        <form id="signup-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* 1. 이메일 */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              이메일 주소
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              readOnly={isSocialSignup}
              disabled={isSocialSignup}
              className="w-full bg-[#162639] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
              required
            />
          </div>

          {/* 2. 닉네임 */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              닉네임
            </label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용하실 닉네임을 입력하세요"
              className="w-full bg-[#162639] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
              required
            />
          </div>

          {/* 3. 생년월일 
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              생년월일
            </label>
            <div className="relative">
              <input 
                type="date" 
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                placeholder="연도-월-일"
                className="w-full bg-[#162639] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition [color-scheme:dark]"
                required
              />
            </div>
          </div>
            */}
          {/* 4. 성별 Segmented Control 
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              성별
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#162639] border border-[#1F334D] rounded-xl">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  gender === 'male'
                    ? 'bg-[#C5A059] text-[#0D1B2A] shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  gender === 'female'
                    ? 'bg-[#C5A059] text-[#0D1B2A] shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                여성
              </button>
              <button
                type="button"
                onClick={() => setGender('none')}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  gender === 'none'
                    ? 'bg-[#C5A059] text-[#0D1B2A] shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                선택안함
              </button>
            </div>
            
          </div>
          */}
          {!isSocialSignup && (
            <>
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
          {/* Password Confirm Input with Show/Hide Toggle */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Password Confirm
            </label>
            <div className="relative">
              <input 
                type={showPasswordConfirm ? 'text' : 'password'} 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Password Confirm"
                className="w-full bg-[#0D1B2A] border border-[#1F334D] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPasswordConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
            </>
          )}
          {/* 5. 추천인코드 (선택) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-300">
                추천인 코드
              </label>
              <span className="text-[10px] text-[#C5A059] font-medium">선택 사항</span>
            </div>
            <input 
              type="text" 
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="추천인 코드를 입력하세요"
              className="w-full bg-[#162639] border border-[#1F334D] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-medium focus:border-[#C5A059] focus:outline-none transition uppercase"
            />
          </div>
        </form>

        {/* Agreement Checkboxes Section */}
        <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-3.5 space-y-3">
          {/* 전체 동의 */}
          <label className="flex items-center gap-2.5 cursor-pointer pb-2 border-b border-[#1F334D]">
            <input 
              type="checkbox"
              checked={allChecked}
              onChange={handleToggleAll}
              className="w-4 h-4 rounded border-[#1F334D] text-[#C5A059] focus:ring-[#C5A059] bg-[#0D1B2A] accent-[#C5A059]"
            />
            <span className="text-xs font-extrabold text-white">전체 동의하기</span>
          </label>

          {/* 하위 항목들 */}
          <div className="space-y-2 text-xs">
            {/* [필수] 서비스 이용약관 */}
            <div className="flex items-center justify-between text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={termsRequired1}
                  onChange={(e) => setTermsRequired1(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#1F334D] text-[#C5A059] focus:ring-[#C5A059] bg-[#0D1B2A] accent-[#C5A059]"
                />
                <span className="text-[11px]">
                  <span className="text-[#C5A059] font-bold">[필수]</span> 서비스 이용약관 동의
                </span>
              </label>
              <button 
                type="button" 
                onClick={() => showToast('서비스 이용약관 상세 내용')}
                className="text-slate-500 hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            {/* [필수] 개인정보 수집 및 이용 */}
            <div className="flex items-center justify-between text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={termsRequired2}
                  onChange={(e) => setTermsRequired2(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#1F334D] text-[#C5A059] focus:ring-[#C5A059] bg-[#0D1B2A] accent-[#C5A059]"
                />
                <span className="text-[11px]">
                  <span className="text-[#C5A059] font-bold">[필수]</span> 개인정보 수집 및 이용 동의
                </span>
              </label>
              <button 
                type="button" 
                onClick={() => showToast('개인정보 수집 및 이용 방침 상세')}
                className="text-slate-500 hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            {/* [선택] 마케팅 정보 수신 */}
            <div className="flex items-center justify-between text-slate-300">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={termsMarketing}
                  onChange={(e) => setTermsMarketing(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#1F334D] text-[#C5A059] focus:ring-[#C5A059] bg-[#0D1B2A] accent-[#C5A059]"
                />
                <span className="text-[11px]">
                  <span className="text-slate-400 font-medium">[선택]</span> 마케팅 정보 수신 동의
                </span>
              </label>
              <button 
                type="button" 
                onClick={() => showToast('마케팅 정보 수신 안내')}
                className="text-slate-500 hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Primary Button */}
      <div className="pt-2">
        <button
          form="signup-form"
          type="submit"
          disabled={!requiredChecked}
          className={`w-full py-3.5 rounded-xl text-xs font-extrabold shadow-lg transition ${
            requiredChecked 
              ? 'gold-button-gradient text-[#0D1B2A] hover:brightness-110 active:scale-[0.98]'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          가입하기
        </button>
      </div>
    </div>
  );
};
