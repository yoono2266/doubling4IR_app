import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_BASE64 } from '../assets/logoBase64';

export const LoginScreen: React.FC = () => {
  const { setIsLoggedIn, setCurrentTab, setCurrentSubScreen, showToast } = useApp();
  const [email, setEmail] = useState('kevin@antigravity.vc');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setCurrentTab('home');
    setCurrentSubScreen(null);
    showToast('Kevin 님으로 정상 로그인되었습니다.');
  };

  const handleSocialLogin = (provider: string) => {
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
            VIP CASINO & HOTEL FREEPLAY PLATFORM
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
            className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition mt-1"
          >
            Log In
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

