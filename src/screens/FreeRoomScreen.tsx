import React from 'react';
import { useApp } from '../context/AppContext';

export const FreeRoomScreen: React.FC = () => {
  const { startBooking, requireLogin } = useApp();

  const hotel = {
    id: 'okada',
    name: 'Okada Manila (오카다 마닐라)',
    subtitle: 'Luxury Oceanfront Resort & Casino Suite',
    location: 'New Manila Bay, Paranaque, Metro Manila',
    roomType: 'Executive Ocean View Suite (110m²)',
    pricePerNightUsdt: 600,
    rating: 4.9,
    reviewsCount: 328,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80'
    ],
    amenities: [
      { name: '24시간 VIP 전담 버틀러', icon: 'person_filled' },
      { name: '프라이빗 킹 베드 & 오션뷰', icon: 'king_bed' },
      { name: 'VIP 전용 라운지 무료 이용', icon: 'local_bar' },
      { name: '공항 VIP 픽업 & 샌딩', icon: 'airport_shuttle' },
      { name: '조식 뷔페 2인 무료', icon: 'restaurant' },
      { name: '초속 자쿠지 스파 시설', icon: 'hot_tub' }
    ]
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">workspace_premium</span>
            FreeRoom VIP 호텔 바우처
          </h2>
          <p className="text-xs text-slate-400">더블링 멤버십 프리미엄 호텔 스위트룸 카탈로그</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
          SILVER MEMBER
        </span>
      </div>

      {/* Main Showcase Hero */}
      <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl overflow-hidden shadow-xl flex flex-col gap-4">
        {/* Gallery Image */}
        <div className="relative h-52 w-full">
          <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-transparent to-transparent"></div>

          <div className="absolute top-3 left-3 bg-[#C5A059] text-[#0D1B2A] font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase shadow">
            FreeRoom 추천 1위
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <span className="text-[10px] text-[#E2C28E] font-semibold tracking-wider uppercase">
                {hotel.subtitle}
              </span>
              <h3 className="text-lg font-extrabold text-white">{hotel.name}</h3>
            </div>
            <div className="flex items-center gap-1 bg-[#0D1B2A]/90 px-2.5 py-1 rounded-xl border border-[#C5A059]/40 text-amber-400 font-bold text-xs">
              <span className="material-symbols-outlined text-xs fill-1">star</span>
              <span>{hotel.rating}</span>
            </div>
          </div>
        </div>

        {/* Suite Info & Price Header */}
        <div className="px-4 flex items-center justify-between border-b border-[#1F334D] pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-200">{hotel.roomType}</h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs text-[#C5A059]">location_on</span>
              <span>{hotel.location}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">박당 디포짓</span>
            <span className="text-base font-extrabold text-[#E2C28E] font-mono">
              {hotel.pricePerNightUsdt} <span className="text-xs text-slate-400">USDT</span>
            </span>
          </div>
        </div>

        {/* Included VIP Amenities */}
        <div className="px-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            포함된 VIP 스페셜 혜택
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {hotel.amenities.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D]">
                <span className="material-symbols-outlined text-base text-[#C5A059]">{item.icon}</span>
                <span className="text-xs text-slate-200 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Launch FreeRoom Booking Flow */}
        <div className="p-4 pt-1">
          <button
            onClick={() => {
              if (!requireLogin()) return;
              startBooking({
                name: hotel.name,
                location: hotel.location,
                roomType: hotel.roomType,
                pricePerNightUsdt: hotel.pricePerNightUsdt,
                image: hotel.images[0]
              });
            }}
            className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm shadow-xl hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>일정 선택 및 FreeRoom 예약하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
