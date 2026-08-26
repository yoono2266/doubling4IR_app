import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const JackpotBanner: React.FC = () => {
  const { setCurrentTab } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  const banners = [
    {
      id: 'jackpot-okada',
      title: 'Okada Manila Mega Jackpot',
      category: 'LIVE JACKPOT',
      amount: '$12,458,920',
      subtitle: '누적 잭팟 시상금 실시간 집계 중',
      badge: 'HOT 잭팟',
      bgImage: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1200&auto=format&fit=crop&q=80',
      type: 'jackpot'
    },
    {
      id: 'jackpot-solaire',
      title: 'Solaire Resort Mega Pot',
      category: 'LIVE JACKPOT',
      amount: '$8,230,450',
      subtitle: '솔레어 리조트 마닐라 VIP 슬롯 누적금',
      badge: 'LIVE',
      bgImage: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1200&auto=format&fit=crop&q=80',
      type: 'jackpot'
    }
  ];

  // Auto rolling ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleBannerClick = () => {
    setCurrentTab('jackpot');
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#C5A059]/30 shadow-lg shadow-[#000]/40 group cursor-pointer">
      {/* Banner Viewport */}
      <div 
        onClick={handleBannerClick}
        className="relative h-24 w-full bg-[#162639] transition-all duration-700 ease-in-out"
      >
        {/* Background Image with Overlay */}
        <img 
          src={banners[currentIndex].bgImage} 
          alt={banners[currentIndex].title}
          className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A]/95 via-[#0D1B2A]/70 to-[#0D1B2A]/40"></div>

        {/* Banner Content */}
        <div className="relative z-10 px-3.5 py-2.5 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#C5A059] text-[#0D1B2A] shadow-sm shrink-0">
                {banners[currentIndex].badge}
              </span>
              <span className="text-[11px] font-medium text-slate-300 truncate max-w-[200px]">
                {banners[currentIndex].title}
              </span>
            </div>
            <span className="text-[9px] font-semibold text-[#E2C28E] flex items-center gap-1 bg-[#0D1B2A]/80 px-1.5 py-0.5 rounded border border-[#C5A059]/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              {banners[currentIndex].category}
            </span>
          </div>

          <div className="flex items-end justify-between pr-14">
            <div>
              <p className="text-base font-extrabold text-[#FFF0D0] gold-gradient-text tracking-tight font-mono leading-tight">
                {banners[currentIndex].amount}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 truncate max-w-[240px]">
                <span>{banners[currentIndex].subtitle}</span>
                <span className="material-symbols-outlined text-[11px] text-[#C5A059]">arrow_forward</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Dots Indicator */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-[#0D1B2A]/80 px-1.5 py-0.5 rounded-full border border-[#1F334D]">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'w-3.5 bg-[#C5A059]' : 'w-1.5 bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
