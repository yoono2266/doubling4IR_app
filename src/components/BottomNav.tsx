import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { resetMainScrollTop } from '../utils/scrollMemory';
import { useGnbPin } from '../hooks/useGnbPin';

// 2026-10-03: 스크롤 중에는 내비게이터를 아래로 숨기고, 스크롤이 멈추고 GNB_SHOW_DELAY_MS 뒤 다시 올림(오버레이 방식).
// 핀(고정)을 켜면 자동 숨김 없이 항상 표시 — 핀 버튼(내비게이터 오른쪽 위) / 마이페이지 > 앱 설정 스위치 공용(useGnbPin).
const GNB_SHOW_DELAY_MS = 400;

export const BottomNav: React.FC = () => {
  const { currentTab, currentSubScreen, setCurrentTab, setCurrentSubScreen, setSelectedHotelId, requireLogin, showToast } = useApp();
  const navRef = useRef<HTMLElement>(null);

  // ── 2026-10-03: 스크롤 자동 숨김 + 핀 ──
  const [isPinned, setPinned] = useGnbPin();
  const [isHidden, setIsHidden] = useState(false);
  const pinnedRef = useRef(isPinned);
  const hiddenRef = useRef(false);

  useEffect(() => {
    pinnedRef.current = isPinned;
    if (isPinned) {
      hiddenRef.current = false;
      setIsHidden(false);
    }
  }, [isPinned]);

  useEffect(() => {
    // 앱은 <main>(overflow-y-auto)이 스크롤된다. 스크롤 이벤트마다 상태를 바꾸지 않고 "숨김 시작"과 "멈춤 후 표시" 두 시점에만 갱신.
    const main = document.querySelector('main');
    if (!main) return;
    let timer: number | undefined;
    const handleScroll = () => {
      if (pinnedRef.current) return;
      if (!hiddenRef.current) {
        hiddenRef.current = true;
        setIsHidden(true);
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        hiddenRef.current = false;
        setIsHidden(false);
      }, GNB_SHOW_DELAY_MS);
    };
    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      main.removeEventListener('scroll', handleScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const handleTogglePin = () => {
    const next = !isPinned;
    setPinned(next);
    showToast(next ? '하단 메뉴를 고정했어요. 스크롤해도 숨지 않아요.' : '고정을 풀었어요. 스크롤하면 하단 메뉴가 잠시 숨어요.');
  };

  // 잭팟 관련 화면(상세 'hotel-jackpot-detail' / 히스토리 'jackpot-history')에서는
  // 목록 탭이 아니어도 '잭팟'을 항상 활성 상태로 표시한다.
  const isJackpotSubScreen =
    currentSubScreen === 'hotel-jackpot-detail' || currentSubScreen === 'jackpot-history';
  const isJackpotActive = currentTab === 'jackpot' || isJackpotSubScreen;

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
    if (tab === 'my' && !requireLogin()) return;

    // 2026-09-27: 탭 이동은 항상 최상단에서 시작 (이전 화면 스크롤 위치·게시글 복원값이 넘어오지 않도록)
    resetMainScrollTop();

    // 2026-09-30: GNB '프로그래시브' 탭은 솔레어 상세가 아니라 프로그래시브 리스트(JackpotMapScreen)로 이동하도록 변경.
    // 아래 솔레어 상세(SREC) 직행 분기는 요청에 따라 주석 처리 — 다시 상세로 직행해야 하면 주석 해제.
    // (홈의 라이브 잭팟 배너 클릭은 기존대로 솔레어 상세로 이동)
    // // '잭팟' 탭은 잭팟 목록(JackpotMapScreen)이 아니라
    // // 실제 잭팟 데이터가 등록된 "솔레어 엔터테인먼트 시티"(jp_index=19, hotel_code=SREC) 상세 화면
    // // (HotelJackpotDetailScreen)으로 바로 진입한다. id는 mapJackpotApiHotels()가 쓰는 것과 동일하게
    // // hotel_code 기준('SREC')이어야 jackpotHotels 캐시에서 정상적으로 매칭된다.
    // if (tab === 'jackpot') {
    //   setCurrentTab('jackpot');
    //   setSelectedHotelId('SREC');
    //   setCurrentSubScreen('hotel-jackpot-detail');
    //   return;
    // }

    setCurrentTab(tab);
    setCurrentSubScreen(null);
  };

  return (
    <nav
      ref={navRef}
      // 2026-10-03: 자동 숨김용 transition·translate 추가 (숨길 때 핀 버튼까지 화면 밖으로: 높이 + 3rem)
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-[#0D1B2A]/95 backdrop-blur-xl border-t border-[#1F334D] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] grid grid-cols-5 items-center transition-transform duration-300 ease-out ${
        isHidden ? 'translate-y-[calc(100%+3rem)] pointer-events-none' : 'translate-y-0'
      }`}
      aria-hidden={isHidden}
    >
      {/* 2026-10-03: 핀(고정) 버튼 — 내비게이터 오른쪽 위. 켜면 자동 숨김 끔 */}
      <button
        type="button"
        onClick={handleTogglePin}
        aria-pressed={isPinned}
        aria-label={isPinned ? '하단 메뉴 고정 해제' : '하단 메뉴 고정'}
        title={isPinned ? '하단 메뉴 고정 해제' : '하단 메뉴 고정'}
        className={`absolute -top-10 right-3 flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-xl transition active:scale-95 ${
          isPinned
            ? 'border-[#C5A059] bg-[#C5A059] text-[#0D1B2A]'
            : 'border-[#1F334D] bg-[#0D1B2A]/90 text-slate-400 hover:text-[#E2C28E]'
        }`}
      >
        <span className={`material-symbols-outlined text-[18px] ${isPinned ? 'fill-1' : ''}`}>push_pin</span>
      </button>

      {/* 1. Jackpot */}
      <button
        onClick={() => handleTabClick('jackpot')}
        className={`w-full flex flex-col items-center justify-center py-1 px-0 rounded-xl transition-all ${
          isJackpotActive
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${isJackpotActive ? 'fill-1' : ''}`}>
          casino
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight whitespace-nowrap">프로그래시브</span>
      </button>

      {/* 2. Poly Market */}
      <button
        onClick={() => handleTabClick('poly')}
        className={`w-full flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          !isJackpotSubScreen && currentTab === 'poly'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${!isJackpotSubScreen && currentTab === 'poly' ? 'fill-1' : ''}`}>
          query_stats
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">챌린지</span>
      </button>

      {/* 3. Home (Center Highlight) */}
      <button
        onClick={() => handleTabClick('home')}
        className={`w-full relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          !isJackpotSubScreen && currentTab === 'home'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          !isJackpotSubScreen && currentTab === 'home'
            ? 'bg-gradient-to-tr from-[#C5A059] to-[#E2C28E] text-[#0D1B2A] shadow-lg shadow-[#C5A059]/30 -mt-4 border-2 border-[#0D1B2A]'
            : 'bg-[#162639] border border-[#1F334D]'
        }`}>
          <span className={`material-symbols-outlined text-2xl ${!isJackpotSubScreen && currentTab === 'home' ? 'fill-1' : ''}`}>
            home
          </span>
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight">홈</span>
      </button>

      {/* 4. FreeRoom */}
      <button
        onClick={() => handleTabClick('freeroom')}
        className={`w-full flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          !isJackpotSubScreen && currentTab === 'freeroom'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${!isJackpotSubScreen && currentTab === 'freeroom' ? 'fill-1' : ''}`}>
          workspace_premium
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">오퍼</span>
      </button>

      {/* 5. My */}
      <button
        onClick={() => handleTabClick('my')}
        className={`w-full flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          !isJackpotSubScreen && currentTab === 'my'
            ? 'text-[#C5A059] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${!isJackpotSubScreen && currentTab === 'my' ? 'fill-1' : ''}`}>
          person
        </span>
        <span className="text-[11px] mt-0.5 tracking-tight">마이</span>
      </button>
    </nav>
  );
};
