import React from 'react';

interface LandingScreenProps {
  onStart: () => void;
}

const FEATURES = [
  { icon: 'casino', title: '실시간 호텔 영상 컨텐츠', desc: '실시간 호텔 정보를 영상으로 확인' },
  { icon: 'query_stats', title: '예측 커뮤니티', desc: '여행 트렌드 예측에 참여하고 결과 확인' },
  { icon: 'workspace_premium', title: '프리룸', desc: '호텔 무료 객실 응모 및 당첨 확인' },
  { icon: 'movie', title: '커뮤니티', desc: '실시간 호텔 영상을 즐기고 공유 및 스크랩' },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  return (
    <div className="h-full overflow-y-auto no-scrollbar flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-8 text-center">
        <div className="w-20 h-20 rounded-2xl gold-button-gradient flex items-center justify-center text-[#0D1B2A] font-black text-2xl shadow-lg shadow-[#C5A059]/100 mb-5">
          <img src="/icons/icon-512-maskable.png" className='rounded-2xl'/>
        </div>
        <span className="font-black tracking-[0.2em] gold-gradient-text text-lg mb-3">DOUBLING</span>
        <h1 className="text-2xl font-black leading-snug mb-3">
          재미있는 컨텐츠로로 만나는<br />
          <span className="gold-gradient-text">여행 커뮤니티 & 플랫폼</span>
        </h1>
        <p className="text-slate-400 text-xs leading-relaxed mb-8 max-w-[280px]">
          여행 트렌드 및 호텔의 실시간 정보 및 숏폼 영상 커뮤니티, 박터지는 yes/no 대화로 또 다른 놀꺼리를 하나의 앱에서 경험하세요.
        </p>

        <div className="w-full flex flex-col gap-2.5 mb-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="w-full flex items-center gap-3 bg-[#122030] gold-card-border rounded-xl px-4 py-3 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C5A059]/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#E2C28E] text-lg">{f.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F9FA]">{f.title}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full bg-[#122030] gold-card-border rounded-xl px-4 py-4 text-left mb-2">
          <p className="text-[11px] font-bold text-[#E2C28E] mb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">lock</span>
            안전한 구글 계정 연동
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Google 로그인은 간편 로그인과 좋아요·북마크 동기화 목적으로만 사용되며, 로그인 없이도 앱을 둘러볼 수 있습니다.
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <button
          onClick={onStart}
          className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm shadow-lg hover:brightness-110 active:scale-[0.98] transition"
        >
          지금 시작하기
        </button>
        <a
          href="/landing.html#privacy"
          target="_blank"
          rel="noreferrer"
          className="block text-center text-[11px] text-slate-500 hover:text-slate-300 mt-4"
        >
          이용약관 및 개인정보처리방침 보기
        </a>
      </div>
    </div>
  );
};
