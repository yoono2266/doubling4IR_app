import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PolyMarketItem } from '../data/polyMarketData';
import { apiCommonClient, CommonResponse } from '../utils/apiClient';

const DP_PRESETS = [100, 500, 1000, 5000];

const calcExpectedPayout = (amount: number, oddsStr: string): number => {
  const percent = parseFloat(oddsStr.replace(/[^0-9.]/g, '')) || 50;
  const decimal = percent / 100;
  if (decimal <= 0) return amount;
  return Math.round(amount / decimal);
};

export const PolyMarketCarousel: React.FC = () => {
  const { polyMarkets, castPolyVote, getUserVoteForMarket, setSelectedMarket, setCurrentSubScreen, user } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(100);

  // Vote modal states
  const [confirmData, setConfirmData] = useState<{
    market: PolyMarketItem;
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
    prevAmount?: number;
  } | null>(null);

  const [resultModalData, setResultModalData] = useState<{
    marketTitle: string;
    choice: string;
    odds: string;
    amount: number;
    expectedPayout: number;
    isRevote: boolean;
    prevChoice?: string;
  } | null>(null);

  // Auto-scroll every 4.5 seconds when not paused
  useEffect(() => {
    if (isPaused || polyMarkets.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % polyMarkets.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, polyMarkets.length]);

  const currentMarket = polyMarkets[currentIndex] || polyMarkets[0];
  const userVote = currentMarket ? getUserVoteForMarket(currentMarket.id) : undefined;

  const handleCardClick = () => {
    if (!currentMarket) return;
    setSelectedMarket(currentMarket);
    setCurrentSubScreen('poly-market-detail');
  };

  const handleVoteClick = (choice: string, odds: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMarket) return;
    const existingVote = getUserVoteForMarket(currentMarket.id);
    const isRevote = !!existingVote;
    const initialAmount = existingVote?.amountDp || 100;
    setSelectedAmount(initialAmount);

    setConfirmData({
      market: currentMarket,
      choice,
      odds,
      isRevote,
      prevChoice: existingVote?.choice,
      prevAmount: existingVote?.amountDp
    });
  };

  // 서버에 픽 결과 기록 (/members/plm-memberpick). 응답 콜백으로 DP/픽 정보를 서버 기준으로
  // 갱신하는 로직은 추후 반영 예정이며, 지금은 요청이 실패해도 화면이 깨지지 않도록만 처리한다.
  const submitMemberPick = async (pmIndex: number, userPick: number, userPickValue: number, dpAmount: number) => {
    try {
      const response = await apiCommonClient.post<CommonResponse>('/members/plm-memberpick', {
        pm_index: pmIndex,
        user_pick: userPick,
        user_pick_value: userPickValue,
        dp_amount: dpAmount,
      });
      console.log('[plm-memberpick] response:', response);
      return response;
    } catch (error) {
      console.error('[plm-memberpick] 요청 실패:', error);
      return undefined;
    }
  };

  const handleConfirmVote = async () => {
    if (!confirmData) return;
    const { market, choice, odds, prevChoice } = confirmData;

    const pmIndex = Number(market.id.replace(/^plm-/, '')) || 0;
    const userPickValue = parseFloat(odds.replace(/[^0-9.]/g, '')) || 0;
    const serverResponse = await submitMemberPick(
      pmIndex,
      choice === 'YES' ? 1 : 2,
      userPickValue,
      selectedAmount
    );
    const serverResult = serverResponse?.result ?? serverResponse?.data?.result ?? -1;

    if (!serverResponse || serverResult !== 0) {
      console.warn('[plm-memberpick] 참여 실패 또는 서버 응답 오류:', serverResponse);
      setConfirmData(null);
      return;
    }

    const res = castPolyVote(
      market.id,
      market.title,
      market.category,
      choice,
      odds,
      selectedAmount
    );

    if (res.success) {
      const payout = calcExpectedPayout(selectedAmount, odds);
      setResultModalData({
        marketTitle: market.title,
        choice,
        odds,
        amount: selectedAmount,
        expectedPayout: payout,
        isRevote: res.isRevote,
        prevChoice: prevChoice || res.prevChoice
      });
    }
    setConfirmData(null);
  };

  if (!currentMarket) return null;

  const isYesSelected = userVote?.choice === 'YES';
  const isNoSelected = userVote?.choice === 'NO';

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        onClick={handleCardClick}
        className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md hover:border-[#C5A059]/50 transition cursor-pointer"
      >
        {/* Header with Category & Volume */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2.5 py-0.5 rounded border border-[#C5A059]/30">
              {currentMarket.category}
            </span>
            {userVote && (
              <span className="text-[10px] font-extrabold text-[#E2C28E] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">how_to_vote</span>
                내 투표: {userVote.choice} ({userVote.amountDp.toLocaleString()} DP)
              </span>
            )}
          </div>
          {/* 2026-09-15 비활성화 (삭제하지 않고 주석 보존).
              사유: 홈 화면 예측 챌린지 박스 우측 상단의 거래량/투표 규모(N,NNN DP) 표시를
              숨기기로 함. 되살릴 경우 아래 span을 주석 해제할 것.
          <span className="text-[10px] text-slate-400 font-mono bg-[#0D1B2A] px-2 py-1 rounded border border-[#1F334D]">
            {currentMarket.totalVolumeDp}
          </span>
          */}
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-sm font-bold text-white leading-snug hover:text-[#E2C28E] transition flex items-center justify-between">
            <span className="line-clamp-1">{currentMarket.title}</span>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{currentMarket.description}</p>
        </div>

        {/* Unified YES/NO Bar and Action Buttons */}
        <div className="space-y-2">
          {/* Visual Probability Bar */}
          <div className="w-full bg-[#0D1B2A] h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${currentMarket.yesValue}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${currentMarket.noValue}%` }}
            />
          </div>

          {/* Clean YES/NO Buttons (percentage only) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={(e) => handleVoteClick('YES', currentMarket.yesOdds, e)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-98 ${
                isYesSelected
                  ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400 font-extrabold shadow-sm'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-xs">thumb_up</span>
              <span>YES</span>
            </button>
            <button
              onClick={(e) => handleVoteClick('NO', currentMarket.noOdds, e)}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-98 ${
                isNoSelected
                  ? 'bg-rose-500 text-white border-rose-400 font-extrabold shadow-sm'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-xs">thumb_down</span>
              <span>NO</span>
            </button>
          </div>
        </div>

        {/* Carousel Indicators & Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1F334D]/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            {polyMarkets.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx ? 'w-5 bg-[#C5A059]' : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{polyMarkets.length}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal with Presets */}
      {confirmData && (() => {
        const isRevote = confirmData.isRevote;
        const prevAmount = confirmData.prevAmount || 100;
        const maxAvailableDp = isRevote ? user.walletDp + prevAmount : user.walletDp;
        const projectedBalance = isRevote
          ? user.walletDp + prevAmount - selectedAmount
          : user.walletDp - selectedAmount;
        const expectedPayout = calcExpectedPayout(selectedAmount, confirmData.odds);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#162639] border border-[#C5A059] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#C5A059]">how_to_vote</span>
                  {isRevote ? '투표 포지션 변경' : '예측 챌린지 DP 사용 확인'}
                </h3>
                <button
                  onClick={() => setConfirmData(null)}
                  className="text-slate-400 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>

              {/* Market Info */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase">{confirmData.market.category}</span>
                  <p className="text-white font-bold text-xs mt-0.5 line-clamp-2">{confirmData.market.title}</p>
                </div>

                {/* Selected Choice Badge */}
                <div className="flex items-center justify-between bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D]">
                  <span className="text-slate-400">선택 항목:</span>
                  <span className={`font-black text-sm ${
                    confirmData.choice === 'YES' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {confirmData.choice} ({confirmData.odds})
                  </span>
                </div>

                {/* Preset Options (100 / 500 / 1,000 / 5,000 DP) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 font-bold">매수 DP 선택:</span>
                    <span className="text-slate-400">보유: {user.walletDp.toLocaleString()} DP</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DP_PRESETS.map((preset) => {
                      const isDisabled = preset > maxAvailableDp;
                      const isSelected = selectedAmount === preset;

                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedAmount(preset)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition border flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-[#C5A059] text-[#0D1B2A] border-[#C5A059] font-black shadow-md'
                              : isDisabled
                              ? 'bg-[#0D1B2A]/40 text-slate-600 border-[#1F334D]/40 cursor-not-allowed'
                              : 'bg-[#0D1B2A] text-slate-300 border-[#1F334D] hover:border-[#C5A059]/60'
                          }`}
                        >
                          <span>{preset >= 1000 ? `${preset / 1000}K` : preset}</span>
                          <span className="text-[9px] opacity-80">DP</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Cost & Expected Return Summary */}
                <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">사용 포인트:</span>
                    <span className="font-mono font-extrabold text-[#E2C28E] text-sm">
                      {selectedAmount.toLocaleString()} DP
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">잔여 예상 포인트:</span>
                    <span className={`font-mono font-bold ${projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {projectedBalance.toLocaleString()} DP
                    </span>
                  </div>

                  {/* Expected Payout based on Odds */}
                  <div className="pt-2 border-t border-[#1F334D]/80">
                    <div className="bg-[#162639] p-2 rounded-lg border border-[#C5A059]/30 text-center">
                      <span className="text-[11px] text-slate-300 block">
                        선택한 금액: <strong className="text-white">{selectedAmount.toLocaleString()} DP</strong> · 적중 시 예상 획득: <strong className="text-[#E2C28E]">약 {expectedPayout.toLocaleString()} DP</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setConfirmData(null)}
                  className="py-2.5 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#162639]"
                >
                  취소
                </button>
                <button
                  disabled={selectedAmount > maxAvailableDp}
                  onClick={handleConfirmVote}
                  className="py-2.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  포인트 사용 확정
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Result Screen Modal */}
      {resultModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl shadow-lg">
              ✓
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                {resultModalData.isRevote ? '투표 변경 완료!' : '예측 챌린지 투표 참여 완료!'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {resultModalData.isRevote
                  ? `[${resultModalData.choice}] (${resultModalData.amount.toLocaleString()} DP)로 성공적으로 변경되었습니다.`
                  : `${resultModalData.amount.toLocaleString()} DP가 차감되어 정상적으로 등록되었습니다.`}
              </p>
            </div>

            <div className="w-full bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#1F334D] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">마켓:</span>
                <span className="font-bold text-white truncate max-w-[180px]">{resultModalData.marketTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">선택한 결과:</span>
                <span className="font-extrabold text-[#E2C28E]">{resultModalData.choice} ({resultModalData.odds})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">투표 금액:</span>
                <span className="font-mono font-bold text-white">{resultModalData.amount.toLocaleString()} DP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">적중 시 예상 획득:</span>
                <span className="font-mono font-bold text-[#E2C28E]">약 {resultModalData.expectedPayout.toLocaleString()} DP</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#1F334D]">
                <span className="text-slate-400">현재 보유 잔액:</span>
                <span className="font-mono font-extrabold text-emerald-400">
                  {user.walletDp.toLocaleString()} DP
                </span>
              </div>
            </div>

            <button
              onClick={() => setResultModalData(null)}
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
