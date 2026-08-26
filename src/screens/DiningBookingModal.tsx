import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export const DiningBookingModal: React.FC = () => {
  const {
    user,
    addReservation,
    setCurrentSubScreen,
    setCurrentTab,
    showToast
  } = useApp();

  const [step, setStep] = useState<'datetime' | 'options' | 'processing' | 'success'>('datetime');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-12');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('디너 1부 (18:00-20:00)');
  const [guests, setGuests] = useState<number>(2);
  const [options, setOptions] = useState({
    privateRoom: true,
    tastingCourse: true,
    welcomeChampagne: true,
  });

  const availableDates = [
    { value: '2026-09-05', label: '9월 05일(토)', badge: '주말 예약' },
    { value: '2026-09-12', label: '9월 12일(토)', badge: '추천 일정' },
    { value: '2026-09-19', label: '9월 19일(토)', badge: '여유 좌석' }
  ];

  const timeSlots = [
    { value: '런치 (12:00-14:00)', label: '런치 (12:00 - 14:00)', desc: '비즈니스 & 브런치' },
    { value: '디너 1부 (18:00-20:00)', label: '디너 1부 (18:00 - 20:00)', desc: '선셋 & 시그니처 디너' },
    { value: '디너 2부 (20:00-22:00)', label: '디너 2부 (20:00 - 22:00)', desc: '프라이빗 나이트 코스' }
  ];

  // When step transitions to processing, simulate 2.5s review -> approve
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'processing') {
      timer = setTimeout(() => {
        setStep('success');

        // Add to AppContext reservation history
        const optList: string[] = [];
        if (options.privateRoom) optList.push('VIP 프라이빗 룸');
        if (options.tastingCourse) optList.push('스페셜 테이스팅 코스');
        if (options.welcomeChampagne) optList.push('웰컴 샴페인 세트');

        addReservation({
          benefitType: 'dining',
          hotelName: 'Okada Manila (La Piazza VIP Dining)',
          hotelLocation: 'New Manila Bay, Philippines',
          roomType: '미쉐린 VIP 파인다이닝',
          checkIn: selectedDate,
          timeSlot: selectedTimeSlot,
          guests: guests,
          optionsList: optList,
          totalCoins: 0,
          status: '승인완료',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [step, selectedDate, selectedTimeSlot, guests, options, addReservation]);

  const handleClose = () => {
    setCurrentSubScreen(null);
  };

  const handleGoToReservations = () => {
    setCurrentSubScreen('my-reservations');
    setCurrentTab('my');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070e17]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0D1B2A] border border-[#C5A059]/60 rounded-3xl w-full max-w-md my-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 bg-gradient-to-r from-[#162639] to-[#0D1B2A] border-b border-[#1F334D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <span className="material-symbols-outlined text-lg">restaurant</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">멤버십 다이닝 신청</h3>
              <p className="text-[10px] text-slate-400">Okada Manila · La Piazza VIP Dining</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#0D1B2A] border border-[#1F334D] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Step Indicator (Non-deposit workflow) */}
        <div className="px-4 py-2 bg-[#162639]/60 border-b border-[#1F334D] flex items-center justify-between text-[11px] font-bold font-mono">
          <span className={step === 'datetime' ? 'text-[#C5A059]' : 'text-slate-500'}>1. 날짜/시간</span>
          <span className="text-slate-600">→</span>
          <span className={step === 'options' ? 'text-[#C5A059]' : 'text-slate-500'}>2. 인원/옵션</span>
          <span className="text-slate-600">→</span>
          <span className={step === 'processing' ? 'text-amber-400 animate-pulse' : 'text-slate-500'}>3. 심사</span>
          <span className="text-slate-600">→</span>
          <span className={step === 'success' ? 'text-emerald-400' : 'text-slate-500'}>4. 승인완료</span>
        </div>

        {/* Modal Dynamic Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* STEP 1: DATE & TIMESLOT SELECTION */}
          {step === 'datetime' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">이용 희망 일자 및 시간대 선택</h4>
                <p className="text-xs text-slate-300">오카다 마닐라 VIP 파인다이닝 예약 신청이 진행됩니다.</p>
              </div>

              {/* Tier Priority Alert */}
              <div className="bg-[#162639] border border-[#C5A059]/40 p-3 rounded-2xl flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#C5A059] text-xl">verified</span>
                <p className="text-[11px] text-slate-200 leading-snug">
                  <strong className="text-[#E2C28E]">{user.membershipTier}</strong> 등급 회원은 프라이빗 다이닝 룸 우선 예약 대상입니다.
                </p>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">이용 희망 일자</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableDates.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedDate === d.value
                          ? 'bg-[#1E2E44] border-[#C5A059] shadow-md'
                          : 'bg-[#162639] border-[#1F334D] hover:border-[#C5A059]/40'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-white font-mono">{d.label}</span>
                      <span className="text-[9px] text-[#E2C28E] font-medium mt-0.5">{d.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeslot Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">이용 예정 시간대</label>
                <div className="space-y-1.5">
                  {timeSlots.map((ts) => (
                    <div
                      key={ts.value}
                      onClick={() => setSelectedTimeSlot(ts.value)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        selectedTimeSlot === ts.value
                          ? 'bg-[#1E2E44] border-[#C5A059] shadow-md'
                          : 'bg-[#162639] border-[#1F334D] hover:border-[#C5A059]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-lg ${selectedTimeSlot === ts.value ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                          {selectedTimeSlot === ts.value ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white block">{ts.label}</span>
                          <span className="text-[10px] text-slate-400">{ts.desc}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep('options')}
                  className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-xl hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <span>다음: 인원 및 옵션 확인</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GUESTS & OPTIONS CONFIRMATION */}
          {step === 'options' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">이용 인원 및 VIP 옵션 확인</h4>
                <p className="text-xs text-slate-300">셰프 특선 및 프라이빗 룸 의전 옵션을 선택하세요.</p>
              </div>

              {/* Guests Stepper */}
              <div className="bg-[#162639] border border-[#1F334D] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">예약 인원</span>
                  <span className="text-[10px] text-slate-400">성인 기준 (최대 8인)</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0D1B2A] px-3 py-1.5 rounded-xl border border-[#1F334D]">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="font-mono font-bold text-sm text-white w-4 text-center">{guests}</span>
                  <button
                    onClick={() => setGuests(Math.min(8, guests + 1))}
                    disabled={guests >= 8}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">VIP 다이닝 특별 옵션 선택</span>
                
                <div
                  onClick={() => setOptions(prev => ({ ...prev, privateRoom: !prev.privateRoom }))}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    options.privateRoom ? 'bg-[#1E2E44] border-[#C5A059]/60' : 'bg-[#162639] border-[#1F334D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${options.privateRoom ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                      {options.privateRoom ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">VIP 프라이빗 룸 희망</span>
                      <span className="text-[10px] text-slate-400">전용 룸 분리 배정</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">포함</span>
                </div>

                <div
                  onClick={() => setOptions(prev => ({ ...prev, tastingCourse: !prev.tastingCourse }))}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    options.tastingCourse ? 'bg-[#1E2E44] border-[#C5A059]/60' : 'bg-[#162639] border-[#1F334D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${options.tastingCourse ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                      {options.tastingCourse ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">특별 테이스팅 코스 메뉴 사전 예약</span>
                      <span className="text-[10px] text-slate-400">총괄 셰프 시그니처 7-코스</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">포함</span>
                </div>

                <div
                  onClick={() => setOptions(prev => ({ ...prev, welcomeChampagne: !prev.welcomeChampagne }))}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    options.welcomeChampagne ? 'bg-[#1E2E44] border-[#C5A059]/60' : 'bg-[#162639] border-[#1F334D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${options.welcomeChampagne ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                      {options.welcomeChampagne ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">웰컴 프리미엄 샴페인 세트 준비</span>
                      <span className="text-[10px] text-slate-400">착석 시 즉시 서브</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">포함</span>
                </div>
              </div>

              {/* Pure Comp Application Notice (No coin deduction) */}
              <div className="bg-[#0D1B2A] p-3.5 rounded-2xl border border-amber-500/30 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-lg">restaurant_menu</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  멤버십 다이닝은 <strong className="text-amber-300">{user.membershipTier} Comp</strong> 특전으로 별도의 코인 디포짓 없이 무상으로 신청 접수됩니다.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('datetime')}
                  className="w-1/3 py-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#1F334D]"
                >
                  이전
                </button>
                <button
                  onClick={() => {
                    setStep('processing');
                    showToast('다이닝 좌석 심사가 시작되었습니다.');
                  }}
                  className="w-2/3 py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-md hover:brightness-110 transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>신청 제출하기</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING / AUDIT */}
          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/20 border-t-[#C5A059] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#C5A059]">
                  <span className="material-symbols-outlined text-xl">restaurant</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  심사중 (Under Review)
                </span>
                <h4 className="text-base font-bold text-white">파트너 호텔에서 배정을 확인하고 있습니다</h4>
                <p className="text-xs text-slate-300">오카다 마닐라 La Piazza 레스토랑 지배인 라인과 실시간 조율 중입니다.</p>
              </div>

              <div className="bg-[#162639] border border-[#C5A059]/40 p-3.5 rounded-2xl text-left text-xs text-slate-300 space-y-1 w-full">
                <div className="flex items-center gap-1.5 text-[#E2C28E] font-bold">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  <span>{user.membershipTier} 등급 우선 심사 적용</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  파트너십 등급 권한에 따라 프라이빗 룸 및 테이블 배정 승인이 진행됩니다. 잠시만 기다려주세요.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS / CONFIRMED */}
          {step === 'success' && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  배정 승인완료 (Approved)
                </span>
                <h4 className="text-lg font-bold text-white mt-1">멤버십 다이닝 신청 승인완료!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  오카다 마닐라 VIP 파인다이닝 예약이 확정되었습니다.
                </p>
              </div>

              <div className="bg-[#162639] border border-[#C5A059]/40 p-4 rounded-2xl text-xs space-y-2 text-left shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 레스토랑:</span>
                  <span className="font-bold text-white">Okada Manila (La Piazza VIP Dining)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이용 일자:</span>
                  <span className="font-bold text-white font-mono">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이용 시간대:</span>
                  <span className="font-bold text-[#E2C28E]">{selectedTimeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">예약 인원:</span>
                  <span className="font-bold text-white">성인 {guests}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 상태:</span>
                  <span className="font-bold text-emerald-400">승인완료 (Approved)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#1F334D]">
                  <span className="text-slate-400">비용:</span>
                  <span className="font-bold text-[#E2C28E]">VIP 다이닝 바우처 전액 지원</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleGoToReservations}
                  className="w-1/2 py-3 rounded-xl bg-[#162639] border border-[#C5A059] text-[#C5A059] font-bold text-xs hover:bg-[#1F334D] transition"
                >
                  마이 &gt; 신청 내역 확인
                </button>
                <button
                  onClick={handleClose}
                  className="w-1/2 py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-md hover:brightness-110 transition"
                >
                  확인 및 닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
