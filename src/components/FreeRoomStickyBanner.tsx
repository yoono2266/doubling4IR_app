import React, { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const FreeRoomStickyBanner: React.FC = () => {
  const { setCurrentTab, setCurrentSubScreen, currentSubScreen } = useApp();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateBannerHeight = () => {
      if (currentSubScreen === 'comp-benefits' || currentSubScreen === 'current-trip-summary') {
        document.documentElement.style.setProperty('--freeroom-banner-height', '0px');
        return;
      }
      if (bannerRef.current) {
        const height = bannerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty('--freeroom-banner-height', `${height}px`);
        }
      }
    };

    updateBannerHeight();

    const observer = new ResizeObserver(() => {
      updateBannerHeight();
    });

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [currentSubScreen]);

  // Hide sticky banner completely when inside Comp 3 selection screen or Current Trip Summary screen
  if (currentSubScreen === 'comp-benefits' || currentSubScreen === 'current-trip-summary') {
    return null;
  }

  const handleBannerClick = () => {
    setCurrentTab('my');
    setCurrentSubScreen('comp-benefits');
  };

  return (
    <div
      ref={bannerRef}
      style={{ bottom: 'calc(var(--bottom-nav-height, 68px) + 14px)' }}
      className="fixed left-0 right-0 z-30 max-w-[430px] mx-auto px-3 pointer-events-auto transition-[bottom] duration-150"
    >
      <div 
        onClick={handleBannerClick}
        className="bg-gradient-to-r from-[#162639] via-[#1f334d] to-[#0D1B2A] border border-[#C5A059]/80 rounded-2xl p-3 shadow-[0_12px_32px_rgba(0,0,0,0.85),0_0_18px_rgba(197,160,89,0.3)] flex items-center justify-between cursor-pointer hover:border-[#C5A059] active:scale-[0.99] transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#E2C28E] text-[#0D1B2A] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">diamond</span>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C5A059] text-[#0D1B2A] font-extrabold uppercase tracking-tight">
                멤버십 혜택 받기
              </span>
              <span className="text-[10px] text-[#E2C28E] font-medium font-mono">Comp 3종 특별 의전</span>
            </div>
            <h4 className="text-xs font-extrabold text-white truncate mt-0.5 group-hover:text-[#E2C28E] transition">
              이번 방문에 준비된 3대 VIP 혜택을 확인하세요
            </h4>
          </div>
        </div>

        <button className="flex-shrink-0 px-3 py-1.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-md group-hover:brightness-110 transition">
          혜택 보기
        </button>
      </div>
    </div>
  );
};
