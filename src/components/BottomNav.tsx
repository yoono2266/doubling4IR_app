import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setCurrentSubScreen } = useApp();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const height = navRef.current.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty('--bottom-nav-height', `${height}px`);
        }
      }
    };

    updateNavHeight();

    const observer = new ResizeObserver(() => {
      updateNavHeight();
    });

    if (navRef.current) {
      observer.observe(navRef.current);
    }

    window.addEventListener('resize', updateNavHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateNavHeight);
    };
  }, []);

  const handleTabClick = (tab: 'jackpot' | 'poly' | 'home' | 'freeroom' | 'my') => {
    setCurrentTab(tab);
    setCurrentSubScreen(null);
  };

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-[#0D1B2A]/95 backdrop-blur-xl border-t border-[#1F334D] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around"
    >
      {/* 1. Jackpot */}
      <button
        onClick={() => handleTabClick('jackpot')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          currentTab === 'jackpot'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentTab === 'jackpot' ? 'fill-1' : ''}`}>
          casino
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">잭팟</span>
      </button>

      {/* 2. Challenge (Prediction) */}
      <button
        onClick={() => handleTabClick('poly')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          currentTab === 'poly'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentTab === 'poly' ? 'fill-1' : ''}`}>
          query_stats
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">챌린지</span>
      </button>

      {/* 3. Home (Center Highlight) */}
      <button
        onClick={() => handleTabClick('home')}
        className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          currentTab === 'home'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          currentTab === 'home'
            ? 'bg-gradient-to-tr from-[#C5A059] to-[#E2C28E] text-[#0D1B2A] shadow-lg shadow-[#C5A059]/30 -mt-4 border-2 border-[#0D1B2A]'
            : 'bg-[#162639] border border-[#1F334D]'
        }`}>
          <span className={`material-symbols-outlined text-2xl ${currentTab === 'home' ? 'fill-1' : ''}`}>
            home
          </span>
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight">홈</span>
      </button>

      {/* 4. FreeRoom */}
      <button
        onClick={() => handleTabClick('freeroom')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          currentTab === 'freeroom'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentTab === 'freeroom' ? 'fill-1' : ''}`}>
          workspace_premium
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">Free</span>
      </button>

      {/* 5. My */}
      <button
        onClick={() => handleTabClick('my')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          currentTab === 'my'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${currentTab === 'my' ? 'fill-1' : ''}`}>
          person
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">마이</span>
      </button>
    </nav>
  );
};
