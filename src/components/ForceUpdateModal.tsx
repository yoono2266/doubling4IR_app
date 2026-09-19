import React from 'react';
import { Browser } from '@capacitor/browser';

interface ForceUpdateModalProps {
  currentVersion: string;
  requiredVersion: string;
}

// 안드로이드 앱의 패키지명(build.gradle의 applicationId)과 동일해야 스토어 링크가 정확히 연결된다.
const ANDROID_PACKAGE_ID = 'com.spoodds.prod';

// 앱 버전(build.gradle versionName)이 서버(/support/cVersion)의 up_version과 다를 때
// 전체 화면을 덮어 업데이트를 강제하는 모달. 닫기 버튼이 없어 업데이트 전까지 앱 사용이 불가능하다.
export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({ currentVersion, requiredVersion }) => {
  const handleUpdateClick = () => {
    Browser.open({ url: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}` }).catch(() => {
      // ignore — 스토어 앱/브라우저를 열 수 없는 예외 상황
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0D1B2A] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#162639] border-2 border-[#C5A059] p-3 flex items-center justify-center shadow-lg shadow-[#C5A059]/10">
        <span className="material-symbols-outlined text-3xl text-[#C5A059]">system_update</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          새로운 버전이 출시되었습니다
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-[280px] mx-auto">
          더 나은 서비스 이용을 위해 최신 버전으로 업데이트가 필요합니다.
        </p>
        <p className="text-[10px] text-slate-500 font-mono pt-1">
          현재 버전 {currentVersion} → 최신 버전 {requiredVersion}
        </p>
      </div>

      <button
        onClick={handleUpdateClick}
        className="w-full max-w-xs py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition"
      >
        지금 업데이트하기
      </button>
    </div>
  );
};
