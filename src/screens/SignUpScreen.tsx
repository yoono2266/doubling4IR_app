import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const SignUpScreen: React.FC = () => {
  const { setCurrentSubScreen, showToast } = useApp();

  // Form State
  const [email, setEmail] = useState('kevin@antigravity.vc');
  const [nickname, setNickname] = useState('Kevin');
  const [birthdate, setBirthdate] = useState('1976-08-15');
  const [gender, setGender] = useState<'male' | 'female' | 'none'>('male');
  const [referralCode, setReferralCode] = useState('DOUBLING-777');

  // Agreements State
  const [termsRequired1, setTermsRequired1] = useState(true);
  const [termsRequired2, setTermsRequired2] = useState(true);
  const [termsMarketing, setTermsMarketing] = useState(false);

  const allChecked = termsRequired1 && termsRequired2 && termsMarketing;
  const requiredChecked = termsRequired1 && termsRequired2;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredChecked) {
      showToast('필수 이용약관에 동의하셔야 합니다.');
      return;
    }
    showToast('회원가입 정보가 입력되었습니다. 인증 메일이 발송됩니다.');
    setCurrentSubScreen('email-verify-request');
  };

  return (
    <div className="flex flex-col min-h-[85vh] justify-between max-w-sm mx-auto py-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1F334D]">
        <button 
          onClick={() => setCurrentSubScreen('login')}
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

          {/* 3. 생년월일 */}
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

          {/* 4. 성별 Segmented Control */}
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
