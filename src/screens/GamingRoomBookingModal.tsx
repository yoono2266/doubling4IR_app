import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { MonthCalendar } from '../components/MonthCalendar';

// 2026-09-09 자유 날짜 달력 + 세션 선택 방식으로 대체 (삭제하지 않고 주석 보존).
// 기존: 날짜+시간이 라벨에 합쳐진 프리셋 3개 라디오 선택. 되살릴 경우 아래 STEP 1 JSX도 함께 원복할 것.
// const availableDates = [
//   { value: '2026-09-05', label: '9월 05일(토) 19:00', badge: '주말 프라임' },
//   { value: '2026-09-12', label: '9월 12일(토) 19:00', badge: '추천 배정' },
//   { value: '2026-09-19', label: '9월 19일(토) 20:00', badge: '레이트 세션' }
// ];

// 위 프리셋에 있던 시간대(19:00 x2, 20:00 x1)·라벨을 세션 목록으로 분리한다.
// (기존 데이터에 날짜별 세션 구조가 없어 임의 확장하지 않음: 3개 그대로 유지 / 모든 날짜 공통.
//  19:00 세션이 두 개인 것도 원본 데이터 그대로.)
const GAMING_SESSIONS = [
  { value: '19:00 · 주말 프라임', time: '19:00', label: '주말 프라임' },
  { value: '19:00 · 추천 배정', time: '19:00', label: '추천 배정' },
  { value: '20:00 · 레이트 세션', time: '20:00', label: '레이트 세션' }
];

export const GamingRoomBookingModal: React.FC = () => {
  const {
    user,
    addReservation,
    setCurrentSubScreen,
    setCurrentTab,
    showToast
  } = useApp();

  const [step, setStep] = useState<'date' | 'options' | 'processing' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [guests, setGuests] = useState<number>(2);
  const [options, setOptions] = useState({
    highLimitTable: true,
    vipCatering: true,
    conciergeHost: true,
  });

  // When step transitions to processing, simulate 2.5s review -> approve
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'processing') {
      timer = setTimeout(() => {
        setStep('success');

        // Add to AppContext reservation history
        const optList: string[] = [];
        if (options.highLimitTable) optList.push('하이리밋 테이블');
        if (options.vipCatering) optList.push('VIP 케이터링');
        if (options.conciergeHost) optList.push('전담 호스트 대기');

        addReservation({
          benefitType: 'gaming_room',
          hotelName: 'Okada Manila (오카다 마닐라)',
          hotelLocation: 'New Manila Bay, Philippines',
          roomType: '프라이빗 VIP 살롱',
          checkIn: selectedDate,
          timeSlot: selectedSession,
          guests: guests,
          optionsList: optList,
          totalCoins: 0,
          status: '승인완료',
          image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80'
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
  }, [step, selectedDate, selectedSession, guests, options, addReservation]);

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
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <span className="material-symbols-outlined text-lg">casino</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">멤버십 게이밍룸 신청</h3>
              <p className="text-[10px] text-slate-400">Okada Manila · ETERNITY 전용 살롱</p>
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
          <span className={step === 'date' ? 'text-[#C5A059]' : 'text-slate-500'}>1. 일정 선택</span>
          <span className="text-slate-600">→</span>
          <span className={step === 'options' ? 'text-[#C5A059]' : 'text-slate-500'}>2. 인원/옵션</span>
          <span className="text-slate-600">→</span>
          <span className={step === 'processing' ? 'text-amber-400 animate-pulse' : 'text-slate-500'}>3. 심사</span>
          <span className="text-slate-600">→</span>
          <span className={step === 'success' ? 'text-emerald-400' : 'text-slate-500'}>4. 승인완료</span>
        </div>

        {/* Modal Dynamic Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* STEP 1: DATE SELECTION */}
          {step === 'date' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">이용 희망 일정을 선택하세요</h4>
                <p className="text-xs text-slate-300">오카다 마닐라 VIP 프라이빗 살롱 배정 신청이 진행됩니다.</p>
              </div>

              {/* Tier Priority Alert */}
              <div className="bg-[#162639] border border-[#C5A059]/40 p-3 rounded-2xl flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#C5A059] text-xl">verified</span>
                <p className="text-[11px] text-slate-200 leading-snug">
                  <strong className="text-[#E2C28E]">{user.membershipTier}</strong> 등급 회원은 파트너 리조트 우선 배정 대상입니다.
                </p>
              </div>

              {/* 1) 날짜 선택 — 공용 달력(단일 날짜). 게이밍룸은 1회성 이용이라 체크인/체크아웃 없음. */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">이용 희망 날짜</label>
                <MonthCalendar
                  mode="single"
                  value={selectedDate}
                  onChange={(v) => {
                    setSelectedDate(v as string);
                    setSelectedSession(''); // 날짜 바꾸면 세션 선택 초기화
                  }}
                />
              </div>

              {/* 2) 세션(시간대) 선택 — 날짜를 고른 뒤 노출. 모든 날짜 동일 목록. */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">이용 세션 선택</label>
                  {GAMING_SESSIONS.map((s) => (
                    <div
                      key={s.value}
                      onClick={() => setSelectedSession(s.value)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        selectedSession === s.value
                          ? 'bg-[#1E2E44] border-[#C5A059] shadow-md'
                          : 'bg-[#162639] border-[#1F334D] hover:border-[#C5A059]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-lg ${selectedSession === s.value ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                          {selectedSession === s.value ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{s.time}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#E2C28E] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#C5A059]/30">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setStep('options')}
                  disabled={!selectedDate || !selectedSession}
                  className={`w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-xl hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2 ${
                    !selectedDate || !selectedSession ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
                <p className="text-xs text-slate-300">파트너 리조트에 전달할 전담 의전 요청사항을 선택하세요.</p>
              </div>

              {/* Guests Stepper */}
              <div className="bg-[#162639] border border-[#1F334D] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">이용 인원</span>
                  <span className="text-[10px] text-slate-400">성인 기준 (최대 6인)</span>
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
                    onClick={() => setGuests(Math.min(6, guests + 1))}
                    disabled={guests >= 6}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">VIP 전용 의전 옵션 선택</span>
                
                <div
                  onClick={() => setOptions(prev => ({ ...prev, highLimitTable: !prev.highLimitTable }))}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    options.highLimitTable ? 'bg-[#1E2E44] border-[#C5A059]/60' : 'bg-[#162639] border-[#1F334D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${options.highLimitTable ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                      {options.highLimitTable ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">프라이빗 하이리밋 테이블 배정 희망</span>
                      <span className="text-[10px] text-slate-400">단독 룸 내 전용 테이블 배정</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">포함</span>
                </div>

                <div
                  onClick={() => setOptions(prev => ({ ...prev, vipCatering: !prev.vipCatering }))}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    options.vipCatering ? 'bg-[#1E2E44] border-[#C5A059]/60' : 'bg-[#162639] border-[#1F334D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${options.vipCatering ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                      {options.vipCatering ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">VIP 전용 케이터링 & 음료 세팅</span>
                      <span className="text-[10px] text-slate-400">시그니처 다과 및 프리미엄 드링크</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">포함</span>
                </div>

                <div
                  onClick={() => setOptions(prev => ({ ...prev, conciergeHost: !prev.conciergeHost }))}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    options.conciergeHost ? 'bg-[#1E2E44] border-[#C5A059]/60' : 'bg-[#162639] border-[#1F334D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${options.conciergeHost ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                      {options.conciergeHost ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">1:1 전담 컨시어지 호스트 상시 대기</span>
                      <span className="text-[10px] text-slate-400">현장 밀착 의전 및 게이밍 서포트</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">포함</span>
                </div>
              </div>

              {/* Pure Comp Application Notice (No coin deduction) */}
              <div className="bg-[#0D1B2A] p-3.5 rounded-2xl border border-purple-500/30 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-purple-400 text-lg">hotel_class</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  멤버십 게이밍룸은 <strong className="text-purple-300">{user.membershipTier} Comp</strong> 특전으로 별도의 코인 디포짓 없이 무상으로 신청 접수됩니다.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('date')}
                  className="w-1/3 py-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#1F334D]"
                >
                  이전
                </button>
                <button
                  onClick={() => {
                    setStep('processing');
                    showToast('게이밍룸 배정 심사가 시작되었습니다.');
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
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-[#C5A059] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#C5A059]">
                  <span className="material-symbols-outlined text-xl">casino</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  심사중 (Under Review)
                </span>
                <h4 className="text-base font-bold text-white">파트너 호텔에서 배정을 확인하고 있습니다</h4>
                <p className="text-xs text-slate-300">오카다 마닐라 VIP 살롱 지배인 라인과 실시간 조율 중입니다.</p>
              </div>

              <div className="bg-[#162639] border border-[#C5A059]/40 p-3.5 rounded-2xl text-left text-xs text-slate-300 space-y-1 w-full">
                <div className="flex items-center gap-1.5 text-[#E2C28E] font-bold">
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  <span>{user.membershipTier} 등급 우선 심사 적용</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  파트너십 등급 권한에 따라 빠른 살롱 배정 승인이 진행됩니다. 잠시만 기다려주세요.
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
                <h4 className="text-lg font-bold text-white mt-1">멤버십 게이밍룸 신청 승인완료!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  오카다 마닐라 VIP 프라이빗 살롱 배정이 확정되었습니다.
                </p>
              </div>

              <div className="bg-[#162639] border border-[#C5A059]/40 p-4 rounded-2xl text-xs space-y-2 text-left shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 호텔:</span>
                  <span className="font-bold text-white">Okada Manila (오카다 마닐라)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이용 시설:</span>
                  <span className="font-bold text-[#E2C28E]">프라이빗 VIP 살롱</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이용 일자:</span>
                  <span className="font-bold text-white font-mono">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이용 세션:</span>
                  <span className="font-bold text-[#E2C28E]">{selectedSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">이용 인원:</span>
                  <span className="font-bold text-white">성인 {guests}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 상태:</span>
                  <span className="font-bold text-emerald-400">승인완료 (Approved)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#1F334D]">
                  <span className="text-slate-400">비용:</span>
                  <span className="font-bold text-[#E2C28E]">VIP Comp 전액 무상 제공</span>
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
