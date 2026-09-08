import React, { useEffect, useState } from 'react';
import { Video, Newspaper, Vote, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStoredUserInfo } from '../utils/auth';

interface LandingScreenProps {
  onStart: () => void;
}

const FEATURES = [
  { Icon: Video, title: '실시간 콘텐츠', desc: '지금 이 순간을 놓치지 않고 바로 확인' },
  { Icon: Newspaper, title: '다양한 콘텐츠와 뉴스', desc: '취향 따라 골라보는 다채로운 이야기' },
  { Icon: Vote, title: '예측 챌린지', desc: '사회·연예·정치 이슈, 오늘의 촉을 시험해보세요' },
  { Icon: Award, title: '혜택형 여행', desc: '다닐수록 커지는 특별한 대우' },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  // 앱 전역에서 상시 갱신되는 로그인 상태(AppContext의 refreshLogin)를 그대로 활용
  const { isLoggedIn } = useApp();
  const [uinfo, setUinfo] = useState<Record<string, any>>(() => getStoredUserInfo());

  useEffect(() => {
    let cancelled = false;

    // 세션이 없으면 checkLogin이 네트워크 호출 없이 바로 null을 반환하므로 항상 호출해도 안전하다.
    getStoredUserInfo('server').then((fresh) => {
      if (!cancelled) setUinfo(fresh);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = uinfo?.u_name || uinfo?.email;

  return (
    <div className="h-full overflow-y-auto no-scrollbar flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-12 pb-8 text-center">
        <div className="w-20 h-20 rounded-2xl gold-button-gradient flex items-center justify-center text-[#0D1B2A] font-black text-2xl shadow-lg shadow-[#C5A059]/100 mb-5">
          <img src="/icons/icon-512-maskable.png" className='rounded-2xl'/>
        </div>
        <span className="font-black tracking-[0.2em] gold-gradient-text text-lg mb-3">DOUBLING</span>

        {isLoggedIn && (
          <span className="text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 px-2.5 py-1 rounded-full border border-[#C5A059]/30 mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">how_to_reg</span>
            {displayName ? `${displayName}님, 로그인 중입니다` : '로그인 중입니다'}
          </span>
        )}

        <h1 className="text-2xl font-black leading-snug mb-3">
          하나의 멤버십으로 연결되는,<br />
          <span className="gold-gradient-text">아시아 5성 복합리조트 여행</span>
        </h1>
        <p className="text-slate-400 text-xs leading-relaxed mb-8 max-w-[280px]">
          다양하고 재미있는 정보를 실시간으로 한눈에, 복합리조트 혜택까지 챙기는 가성비 끝판왕 여행
        </p>

        <div className="w-full flex flex-col gap-2.5 mb-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="w-full flex items-center gap-3 bg-[#122030] gold-card-border rounded-xl px-4 py-3 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C5A059]/15 flex items-center justify-center shrink-0">
                <Icon className="w-[18px] h-[18px] text-[#E2C28E]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8F9FA]">{title}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 고지 문구 (다른 안내 문구와 톤 통일: 작은 회색 텍스트) */}
        <div className="w-full text-left space-y-1">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ※ 예측 챌린지는 만 19세 이상 이용 가능합니다.
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            ※ 포인트(DP)는 현금으로 구매·환전할 수 없습니다.
          </p>
        </div>

        {/*
          2026-09-08 시안 교체로 비활성화 (삭제하지 않고 주석 보존).
          사유: 새 랜딩 시안에 "안전한 구글 계정 연동" 안내 박스가 없음.
          [원본 JSX]
          <div className="w-full bg-[#122030] gold-card-border rounded-xl px-4 py-4 text-left mb-2">
            <p className="text-[11px] font-bold text-[#E2C28E] mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">lock</span>
              안전한 구글 계정 연동
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Google 로그인은 간편 로그인과 좋아요·북마크 동기화 목적으로만 사용되며, 로그인 없이도 앱을 둘러볼 수 있습니다.
            </p>
          </div>
        */}
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
