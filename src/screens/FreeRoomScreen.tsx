import React from 'react';
import { useApp } from '../context/AppContext';
import { COMP_BENEFITS, CompBenefitItem } from '../data/compBenefitData';

// 카드1(오퍼 스위트) — 잭팟 상세(HotelJackpotDetailScreen) / jackpotData.ts의 솔레어 리조트 데이터·이미지 재사용.
// 히어로 레이아웃과 "포함된 VIP 스페셜 혜택" 6개 그리드 구성은 기존 그대로 유지하고, 내용만 솔레어로 교체한다.
const SUITE_HOTEL = {
  nameKo: '솔레어 리조트 앤 카지노',
  nameEn: 'Solaire Resort & Casino',
  subtitle: 'Luxury Integrated Resort & Casino Suite',
  location: '필리핀 마닐라 · 엔터테인먼트 시티',
  roomType: 'Executive Ocean View Suite (110m²)',
  pricePerNightDp: 600, // 오퍼 카탈로그 박당 디포짓 (코인)
  // 2026-09-08 별점 뱃지 제거 요청으로 미사용 (삭제하지 않고 주석 보존). 뱃지를 되살릴 때 함께 해제할 것.
  // rating: 4.8,
  image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&auto=format&fit=crop&q=80',
  amenities: [
    { name: '24시간 전담 VIP 버틀러 서비스', icon: 'person_filled' },
    { name: '프라이빗 킹 베드 & 오션뷰 스위트', icon: 'king_bed' },
    { name: 'VIP 전용 라운지 무료 이용', icon: 'local_bar' },
    { name: '공항 VIP 리무진 픽업 & 샌딩', icon: 'airport_shuttle' },
    { name: '조식 뷔페 2인 무료', icon: 'restaurant' },
    { name: '전용 자쿠지 & 스파 시설', icon: 'hot_tub' }
  ]
};

export const FreeRoomScreen: React.FC = () => {
  const { startBooking, setCurrentSubScreen, requireLogin } = useApp();

  // 카드2·3(게이밍룸/다이닝) 신청 라우팅 — CompBenefitSelectionScreen.handleBenefitClick 로직 그대로 재사용.
  const handleBenefitClick = (benefit: CompBenefitItem) => {
    if (benefit.id === 'gaming_room') {
      setCurrentSubScreen('gaming-room-booking');
    } else if (benefit.id === 'dining') {
      setCurrentSubScreen('dining-booking');
    }
  };

  // 카드2·3은 CompBenefitSelectionScreen과 동일한 소스(COMP_BENEFITS)를 공유한다.
  const extraBenefits = COMP_BENEFITS.filter((b) => b.id === 'gaming_room' || b.id === 'dining');

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">workspace_premium</span>
            오퍼 VIP 호텔 바우처
          </h2>
          <p className="text-xs text-slate-400">더블링 멤버십 등급 전용 스위트 · 게이밍 · 다이닝 오퍼</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30">
          SILVER MEMBER
        </span>
      </div>

      {/* Card 1 — 오퍼 스위트 (솔레어) : 히어로 레이아웃 + 6개 혜택 그리드 유지 */}
      <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl overflow-hidden shadow-xl flex flex-col gap-4">
        {/* Gallery Image */}
        <div className="relative h-52 w-full">
          <img src={SUITE_HOTEL.image} alt={`${SUITE_HOTEL.nameKo} (${SUITE_HOTEL.nameEn})`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-transparent to-transparent"></div>

          <div className="absolute top-3 left-3 bg-[#C5A059] text-[#0D1B2A] font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase shadow">
            오퍼 추천 1위
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <span className="text-[10px] text-[#E2C28E] font-semibold tracking-wider uppercase">
                {SUITE_HOTEL.subtitle}
              </span>
              <h3 className="text-lg font-extrabold text-white leading-tight">{SUITE_HOTEL.nameKo}</h3>
              <p className="text-xs text-slate-300 font-medium">{SUITE_HOTEL.nameEn}</p>
            </div>
            {/*
              2026-09-08 제거 요청으로 비활성화 (삭제하지 않고 주석 보존).
              사유: 이미지 우측 상단 별점 뱃지("★ 4.8")를 노출하지 않기로 함. 되살릴 경우 위 SUITE_HOTEL.rating 주석도 함께 해제.
              [원본 JSX]
              <div className="flex items-center gap-1 bg-[#0D1B2A]/90 px-2.5 py-1 rounded-xl border border-[#C5A059]/40 text-amber-400 font-bold text-xs">
                <span className="material-symbols-outlined text-xs fill-1">star</span>
                <span>{SUITE_HOTEL.rating}</span>
              </div>
            */}
          </div>
        </div>

        {/* Description — CompBenefitSelectionScreen 카드 톤에 맞춘 설명 문단 */}
        <div className="px-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            마닐라 엔터테인먼트 시티를 대표하는 초럭셔리 통합 리조트, 솔레어 리조트 앤 카지노의
            이그제큐티브 스위트룸을 멤버십 등급 오퍼로 우선 배정받으세요.
          </p>
        </div>

        {/* Suite Info & Price Header */}
        <div className="px-4 flex items-center justify-between border-b border-[#1F334D] pb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-200">{SUITE_HOTEL.roomType}</h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs text-[#C5A059]">location_on</span>
              <span>{SUITE_HOTEL.location}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">박당 디포짓</span>
            <span className="text-base font-extrabold text-[#E2C28E] font-mono">
              {SUITE_HOTEL.pricePerNightDp.toLocaleString()} <span className="text-xs text-slate-400">코인</span>
            </span>
          </div>
        </div>

        {/* Included VIP Amenities */}
        <div className="px-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            포함된 VIP 스페셜 혜택
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {SUITE_HOTEL.amenities.map((item, idx) => (
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
                name: `${SUITE_HOTEL.nameKo} (${SUITE_HOTEL.nameEn})`,
                location: SUITE_HOTEL.location,
                roomType: SUITE_HOTEL.roomType,
                pricePerNightDp: SUITE_HOTEL.pricePerNightDp,
                image: SUITE_HOTEL.image
              });
            }}
            className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm shadow-xl hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>일정 선택 및 오퍼 신청하기</span>
          </button>
        </div>
      </div>

      {/* Cards 2·3 — 멤버십 게이밍룸 / 멤버십 다이닝 : CompBenefitSelectionScreen 카드 구조·데이터·라우팅 재사용 */}
      {extraBenefits.map((item) => (
        <div
          key={item.id}
          className="bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/60 transition-all rounded-3xl overflow-hidden shadow-xl flex flex-col group"
        >
          {/* Card Hero Image & Top Badges */}
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#162639] via-[#162639]/40 to-transparent"></div>

            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#C5A059] text-[#0D1B2A] shadow-md uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">diamond</span>
                {item.badge}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0D1B2A]/90 border border-[#C5A059]/60 flex items-center justify-center text-[#C5A059] shadow-lg">
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="text-[11px] text-[#E2C28E] font-medium">{item.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              {item.description}
            </p>

            {/* Highlights List */}
            <div className="bg-[#0D1B2A] p-3 rounded-2xl border border-[#1F334D] space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                포함된 VIP 의전 혜택
              </span>
              {item.highlights.map((hl, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                  <span className="material-symbols-outlined text-xs text-[#C5A059]">check_circle</span>
                  <span>{hl}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleBenefitClick(item)}
              className="w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] gold-button-gradient text-[#0D1B2A] hover:brightness-110"
            >
              <span className="material-symbols-outlined text-base">
                {item.id === 'gaming_room' ? 'casino' : 'restaurant'}
              </span>
              <span>{`${item.title} 신청하기`}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
