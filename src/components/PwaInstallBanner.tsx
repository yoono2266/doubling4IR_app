import React, { useEffect, useState } from 'react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode already
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Already installed as PWA
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user dismissed it earlier in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (!isDismissed && iosDevice) {
      // Show iOS instruction banner if not standalone
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted PWA install');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-[#162639] via-[#1D314A] to-[#162639] border-b border-[#C5A059]/40 px-4 py-2.5 flex items-center justify-between text-xs shadow-lg relative z-50 animate-fadeIn">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#0D1B2A] border border-[#C5A059] p-1 flex items-center justify-center shrink-0">
          <img src="/icons/icon-512-maskable.png" alt="DOUBLE RING" className="w-full h-full object-contain rounded-lg" />
        </div>
        <div>
          <p className="font-extrabold text-white flex items-center gap-1.5">
            DOUBLE RING 앱 설치
            <span className="text-[9px] bg-[#C5A059] text-[#0D1B2A] font-black px-1.5 py-0.2 rounded uppercase">PWA</span>
          </p>
          <p className="text-[10px] text-slate-300">
            {isIos ? '사파리 공유 버튼 → "홈 화면에 추가"' : '홈 화면에 추가하고 더 빠르게 만나보세요'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg gold-button-gradient text-[#0D1B2A] font-extrabold text-[11px] shadow hover:brightness-110 active:scale-95 transition"
          >
            설치하기
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg bg-[#0D1B2A] border border-[#1F334D] text-slate-400 hover:text-white flex items-center justify-center transition"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};
