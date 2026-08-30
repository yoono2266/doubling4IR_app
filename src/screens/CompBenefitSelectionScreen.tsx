import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COMP_BENEFITS, CompBenefitItem } from '../data/compBenefitData';

export const CompBenefitSelectionScreen: React.FC = () => {
  const { user, setCurrentSubScreen, startBooking, showToast } = useApp();
  const [selectedCompNotice, setSelectedCompNotice] = useState<CompBenefitItem | null>(null);

  const handleBenefitClick = (benefit: CompBenefitItem) => {
    if (benefit.id === 'freeplay_suite') {
      startBooking({
        name: 'Okada Manila (오카다 마닐라)',
        location: 'New Manila Bay, Philippines',
        roomType: 'Executive Ocean View Suite',
        pricePerNightDp: 600,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
      });
    } else if (benefit.id === 'gaming_room') {
      setCurrentSubScreen('gaming-room-booking');
    } else if (benefit.id === 'dining') {
      setCurrentSubScreen('dining-booking');
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#162639] border border-[#C9CBCF]/40">
          <span className="w-2 h-2 rounded-full bg-[#C9CBCF] shadow-[0_0_8px_#C9CBCF]"></span>
          <span className="text-[11px] font-extrabold text-[#C9CBCF] tracking-wider">
            {user.membershipTier} COMP
          </span>
        </div>
      </div>

      {/* Concierge Welcome Header Box */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#1E2E44] via-[#162639] to-[#0A1422] border-2 border-[#C5A059]/60 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-1.5 text-[#C5A059]">
            <span className="material-symbols-outlined text-base">concierge</span>
            <span className="text-[11px] font-black uppercase tracking-widest">
              VIP Concierge Exclusive
            </span>
          </div>

          <h1 className="text-xl font-black text-white leading-tight">
            이번 방문에 무엇을 <br />
            <span className="gold-gradient-text text-2xl">준비해드릴까요?</span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            <strong className="text-white font-semibold">{user.name}</strong> 파트너님의{' '}
            <strong className="text-[#C9CBCF] font-semibold">{user.membershipTier}</strong> 등급 권한에 맞춘 
            3대 VIP 전용 혜택(Comp)을 준비했습니다. 원하시는 혜택을 선택하여 즉시 신청하세요.
          </p>
        </div>
      </div>

      {/* 3 Comp Benefit Cards List */}
      <div className="space-y-4">
        {COMP_BENEFITS.map((item) => (
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

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#C5A059] text-[#0D1B2A] shadow-md uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">diamond</span>
                  {item.badge}
                </span>
              </div>

              {/* Icon Overlay Badge */}
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
                  {item.id === 'freeplay_suite' ? 'king_bed' : item.id === 'gaming_room' ? 'casino' : 'restaurant'}
                </span>
                <span>
                  {`${item.title} 신청하기`}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Concierge Coming Soon Modal */}
      {selectedCompNotice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1E2E44] via-[#162639] to-[#0D1B2A] border-2 border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-[0_0_35px_rgba(197,160,89,0.3)] animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059] text-2xl shadow-md">
              <span className="material-symbols-outlined text-3xl">{selectedCompNotice.icon}</span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-wider bg-[#C5A059]/15 px-2 py-0.5 rounded-full border border-[#C5A059]/30 inline-block mb-1">
                COMP SERVICE NOTICE
              </span>
              <h3 className="text-base font-black text-white">
                {selectedCompNotice.title} 신청 안내
              </h3>
            </div>

            <div className="bg-[#0D1B2A] p-4 rounded-2xl border border-[#1F334D] text-left text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-200 leading-relaxed">
                현재 <strong className="text-[#E2C28E]">{selectedCompNotice.title}</strong> 온라인 다이렉트 신청 시스템을 고도화하고 있습니다.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                곧 정식 런칭될 예정이며, 현재는 전담 VIP 컨시어지 1:1 라인을 통해 우선 배정 문의를 도와드리고 있습니다.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCompNotice(null);
                showToast('컨시어지 상담 요청이 접수되었습니다.');
              }}
              className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-md hover:brightness-110 active:scale-98 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
