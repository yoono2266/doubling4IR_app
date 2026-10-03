import React from 'react';
import { useGnbPin } from '../hooks/useGnbPin';

// 2026-10-03: 마이페이지 > 앱 설정의 "하단 메뉴 항상 표시" 스위치 (알림 수신 스위치와 같은 모양).
// 내비게이터 핀 버튼과 같은 값(useGnbPin). 저장: 이 기기 계정별 — 서버 필드는 BE 요청서 REQ-261003-03.

export const GnbPinSettingRow: React.FC = () => {
  const [isPinned, setPinned] = useGnbPin();

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-[#C5A059]">push_pin</span>
        <span>화면</span>
      </h3>
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl">
        <button
          type="button"
          role="switch"
          aria-checked={isPinned}
          onClick={() => setPinned(!isPinned)}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[#1F334D]/30 transition rounded-2xl"
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-white">하단 메뉴 항상 표시</span>
            <span className="block mt-0.5 text-xs text-slate-400 break-keep">끄면 스크롤하는 동안 하단 메뉴가 잠시 숨어요</span>
          </span>
          <span
            aria-hidden="true"
            className={`shrink-0 w-12 h-7 rounded-full p-1 border transition-colors ${
              isPinned ? 'bg-[#C5A059] border-[#C5A059]' : 'bg-slate-600/50 border-slate-500/40'
            }`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${isPinned ? 'translate-x-5' : 'translate-x-0'}`} />
          </span>
        </button>
      </div>
    </div>
  );
};
