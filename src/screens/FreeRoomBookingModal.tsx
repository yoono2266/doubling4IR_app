import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { MonthCalendar, RangeValue, startOfDay, fromKey, diffDays } from '../components/MonthCalendar';

const MAX_NIGHTS = 14; // 최대 숙박일수

export const FreeRoomBookingModal: React.FC = () => {
  const {
    booking,
    setBooking,
    completePayment,
    setCurrentSubScreen,
    setCurrentTab,
    showToast,
    user
  } = useApp();

  // Payment Countdown timer (15 minutes = 900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (booking.step === 'payment' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [booking.step, timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Demo convenience trigger: Tap QR/Wallet Address area to simulate 2-3s blockchain verification -> complete
  const handleSimulatePaymentTap = () => {
    if (isVerifying || booking.step !== 'payment') return;
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      completePayment();
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 2500);
  };

  // 2026-09-09 자유 기간 달력 방식으로 대체 (삭제하지 않고 주석 보존).
  // 기존: 미리 정의된 3개 일정 프리셋 중 라디오 선택. 되살릴 경우 아래 STEP 1 JSX도 함께 원복할 것.
  // const availableDates = [
  //   { start: '2026-08-15', end: '2026-08-17', nights: 2, label: '8월 15일(토) - 8월 17일(월) [추천]' },
  //   { start: '2026-08-22', end: '2026-08-24', nights: 2, label: '8월 22일(토) - 8월 24일(월)' },
  //   { start: '2026-09-05', end: '2026-09-08', nights: 3, label: '9월 05일(토) - 9월 08일(화)' }
  // ];

  // ── STEP 1 자유 기간 달력 상태 ──
  const today = startOfDay(new Date());
  const checkIn = booking.startDate ? fromKey(booking.startDate) : null;
  const checkOut = booking.endDate ? fromKey(booking.endDate) : null;

  // startBooking()이 넣어둔 프리셋 날짜가 과거면 초기화 → 사용자가 달력에서 새로 고르게 한다.
  useEffect(() => {
    if (booking.startDate && fromKey(booking.startDate) < today) {
      setBooking(prev => ({ ...prev, startDate: '', endDate: '', nights: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 공용 MonthCalendar(range 모드) → booking state 반영. nights는 여기서 계산.
  const handleRangeChange = (next: string | RangeValue) => {
    const r = next as RangeValue;
    const nights = r.start && r.end ? diffDays(fromKey(r.start), fromKey(r.end)) : 0;
    setBooking(prev => ({ ...prev, startDate: r.start, endDate: r.end, nights }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070e17]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0D1B2A] border border-[#C5A059]/60 rounded-3xl w-full max-w-md my-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header Bar */}
        <div className="bg-[#162639] border-b border-[#1F334D] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">calendar_today</span>
            <div>
              <h3 className="text-sm font-bold text-white">오퍼 신청 시스템</h3>
              <p className="text-[10px] text-slate-400">{booking.hotelName}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentSubScreen(null)}
            className="w-8 h-8 rounded-full bg-[#0D1B2A] border border-[#1F334D] text-slate-400 hover:text-white flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-[#162639]/60 px-4 py-2 border-b border-[#1F334D] flex items-center justify-between text-[11px] font-bold">
          <span className={booking.step === 'date' ? 'text-[#C5A059]' : 'text-slate-500'}>1. 날짜 선택</span>
          <span className="text-slate-600">→</span>
          <span className={booking.step === 'options' ? 'text-[#C5A059]' : 'text-slate-500'}>2. 옵션 설정</span>
          <span className="text-slate-600">→</span>
          <span className={booking.step === 'payment' ? 'text-[#C5A059]' : 'text-slate-500'}>3. 코인 결제</span>
          <span className="text-slate-600">→</span>
          <span className={booking.step === 'success' ? 'text-emerald-400' : 'text-slate-500'}>4. 완료</span>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* STEP 1: DATE SELECTION — 자유 기간 달력 (체크인 → 체크아웃) */}
          {booking.step === 'date' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">투숙 희망 기간을 선택하세요</h4>
                <p className="text-xs text-slate-300">
                  체크인 → 체크아웃 순으로 날짜를 선택하세요. 오퍼 멤버십 자격으로 100% 코인 디포짓 신청이 진행됩니다.
                </p>
              </div>

              {/* Month Calendar (공용 컴포넌트, 체크인~체크아웃 range 모드) */}
              <MonthCalendar
                mode="range"
                value={{ start: booking.startDate, end: booking.endDate }}
                onChange={handleRangeChange}
                maxNights={MAX_NIGHTS}
                onMaxNightsExceeded={() => showToast(`최대 ${MAX_NIGHTS}박까지 선택할 수 있어요`)}
              />

              {/* Selection hint / summary */}
              {!checkIn || !checkOut ? (
                <p className="text-[11px] text-slate-400 text-center">
                  {checkIn
                    ? '체크아웃 날짜를 선택하세요 (최소 1박, 최대 14박)'
                    : '체크인 날짜를 선택하세요'}
                </p>
              ) : (
                <div className="bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#C5A059]/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">선택한 일정</span>
                    <span className="text-xs text-slate-300">{booking.startDate} → {booking.endDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">
                      {booking.nights}박 {booking.nights + 1}일
                    </span>
                    <span className="text-sm font-extrabold text-[#E2C28E] font-mono">
                      총 {(booking.pricePerNightDp * booking.nights).toLocaleString()} 코인
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setBooking(prev => ({ ...prev, step: 'options' }))}
                disabled={!checkIn || !checkOut}
                className={`w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-md hover:brightness-110 transition flex items-center justify-center gap-1.5 mt-2 ${
                  !checkIn || !checkOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>다음: 옵션 및 인원 선택</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STEP 2: OPTIONS & GUESTS STEPPER */}
          {booking.step === 'options' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">투숙 인원 및 VIP 옵션 확인</h4>
                <p className="text-xs text-slate-300">인원과 추가 옵션에 따라 코인 결제 금액이 실시간 계산됩니다.</p>
              </div>

              {/* Guests Stepper */}
              <div className="bg-[#162639] border border-[#1F334D] p-3.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">투숙 인원</span>
                  <span className="text-[10px] text-slate-400">성인 기준 (최대 4인)</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0D1B2A] px-3 py-1.5 rounded-xl border border-[#1F334D]">
                  <button
                    onClick={() => setBooking(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                    className="w-7 h-7 rounded-lg bg-[#162639] text-[#C5A059] font-bold text-base flex items-center justify-center hover:bg-[#1F334D]"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm text-white">{booking.guests}명</span>
                  <button
                    onClick={() => setBooking(prev => ({ ...prev, guests: Math.min(4, prev.guests + 1) }))}
                    className="w-7 h-7 rounded-lg bg-[#162639] text-[#C5A059] font-bold text-base flex items-center justify-center hover:bg-[#1F334D]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VIP Option Toggles */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">포함 옵션 선택</span>

                {/* Breakfast Toggle */}
                <div 
                  onClick={() => setBooking(prev => ({ ...prev, options: { ...prev.options, breakfast: !prev.options.breakfast } }))}
                  className="p-3 rounded-xl bg-[#162639] border border-[#1F334D] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#C5A059] text-lg">restaurant</span>
                    <div>
                      <p className="text-xs font-bold text-white">조식 뷔페 포함</p>
                      <p className="text-[10px] text-slate-400">박당 1인 50 코인 추가</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={booking.options.breakfast} readOnly className="w-4 h-4 accent-[#C5A059]" />
                </div>

                {/* Lounge Toggle */}
                <div 
                  onClick={() => setBooking(prev => ({ ...prev, options: { ...prev.options, loungeAccess: !prev.options.loungeAccess } }))}
                  className="p-3 rounded-xl bg-[#162639] border border-[#1F334D] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#C5A059] text-lg">local_bar</span>
                    <div>
                      <p className="text-xs font-bold text-white">VIP 클럽 라운지 패스</p>
                      <p className="text-[10px] text-slate-400">박당 100 코인 추가</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={booking.options.loungeAccess} readOnly className="w-4 h-4 accent-[#C5A059]" />
                </div>

                {/* Airport Transfer Toggle */}
                <div 
                  onClick={() => setBooking(prev => ({ ...prev, options: { ...prev.options, airportTransfer: !prev.options.airportTransfer } }))}
                  className="p-3 rounded-xl bg-[#162639] border border-[#1F334D] flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#C5A059] text-lg">airport_shuttle</span>
                    <div>
                      <p className="text-xs font-bold text-white">공항 VIP 샌딩 서비스</p>
                      <p className="text-[10px] text-slate-400">1회 80 코인 추가</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={booking.options.airportTransfer} readOnly className="w-4 h-4 accent-[#C5A059]" />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#C5A059]/40 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">최종 합계 금액</span>
                  <span className="text-xs text-slate-300">{booking.nights}박 / {booking.guests}인 투숙</span>
                </div>
                <span className="text-lg font-extrabold text-[#E2C28E] font-mono">
                  {booking.totalDp.toLocaleString()} 코인
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBooking(prev => ({ ...prev, step: 'date' }))}
                  className="w-1/3 py-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#1F334D]"
                >
                  이전
                </button>
                <button
                  onClick={() => setBooking(prev => ({ ...prev, step: 'payment' }))}
                  className="w-2/3 py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-md hover:brightness-110 transition"
                >
                  코인 결제 단계 이동
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COIN PAYMENT & SIMULATED TAP-TO-VERIFY */}
          {booking.step === 'payment' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-lg">timer</span>
                  <span className="text-xs font-bold text-amber-200">결제 유효 시간</span>
                </div>
                <span className="text-base font-extrabold font-mono text-amber-400 animate-pulse">
                  {formatTimer(timeLeft)}
                </span>
              </div>

              <div className="bg-[#162639] border border-[#1F334D] p-3.5 rounded-2xl text-center space-y-2">
                <p className="text-xs text-slate-300">결제 지갑 주소 또는 QR 코드를 탭하세요</p>
                <p className="text-[10px] text-[#C5A059] font-medium">(IR 라이브 데모: 영역 탭 시 2초 후 결제 승인)</p>

                {/* TAP TARGET: QR / Address Area */}
                <div
                  onClick={handleSimulatePaymentTap}
                  className={`p-4 rounded-2xl border-2 border-dashed border-[#C5A059]/60 bg-[#0D1B2A] cursor-pointer hover:border-[#C5A059] hover:bg-[#162639] transition flex flex-col items-center justify-center gap-2 relative ${
                    isVerifying ? 'animate-pulse border-amber-400' : ''
                  }`}
                >
                  {isVerifying ? (
                    <div className="py-6 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-[#E2C28E]">블록체인 트랜잭션 검증 중...</span>
                    </div>
                  ) : (
                    <>
                      {/* Mock QR graphic */}
                      <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                        <div className="w-full h-full bg-[#0D1B2A] rounded flex items-center justify-center text-white text-[10px] font-mono font-bold text-center p-1">
                          [TAP TO PAY]<br/>0x8F2A...91B4
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-mono text-slate-300 block font-bold">
                          0x8F2A381940192A0291B4
                        </span>
                        <span className="text-[10px] text-[#C5A059] font-bold mt-1 block">
                          터치하여 즉시 결제 완료 시뮬레이션 →
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>결제 예정 금액:</span>
                  <span className="font-mono font-bold text-white">{booking.totalDp.toLocaleString()} 코인</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>현재 보유 코인:</span>
                  <span className="font-mono font-bold text-[#E2C28E]">{user.walletCoin.toLocaleString()} 코인</span>
                </div>
              </div>

              <button
                onClick={handleSimulatePaymentTap}
                disabled={isVerifying}
                className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-xl hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">task_alt</span>
                <span>{isVerifying ? '결제 승인 처리 중...' : '코인 지불 확인 (터치)'}</span>
              </button>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {booking.step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto text-3xl shadow-lg">
                ✓
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">오퍼 신청 및 결제 완료!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  신청 내역이 즉시 확정되었으며 코인 월렛 차감이 완료되었습니다.
                </p>
              </div>

              <div className="bg-[#162639] border border-[#1F334D] p-4 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 호텔:</span>
                  <span className="font-bold text-white">{booking.hotelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">투숙 기간:</span>
                  <span className="font-bold text-white">{booking.startDate} ~ {booking.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">결제 금액:</span>
                  <span className="font-mono font-bold text-[#E2C28E]">{booking.totalDp.toLocaleString()} 코인</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">신청 상태:</span>
                  <span className="font-bold text-emerald-400">확정 (Confirmed)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setCurrentSubScreen('my-reservations');
                    setCurrentTab('my');
                  }}
                  className="py-3 rounded-xl bg-[#162639] border border-[#C5A059] text-[#C5A059] font-bold text-xs hover:bg-[#1F334D]"
                >
                  마이 &gt; 신청 내역 확인
                </button>
                <button
                  onClick={() => setCurrentSubScreen(null)}
                  className="py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-md"
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
