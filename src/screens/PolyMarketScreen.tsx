import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PolyMarketItem } from '../data/polyMarketData';
import { apiCommonClient } from '../utils/apiClient';

const DP_PRESETS = [100, 500, 1000, 5000];

const calcExpectedPayout = (amount: number, oddsStr: string): number => {
  const percent = parseFloat(oddsStr.replace(/[^0-9.]/g, '')) || 50;
  const decimal = percent / 100;
  if (decimal <= 0) return amount;
  return Math.round(amount / decimal);
};

export const PolyMarketScreen: React.FC = () => {
  const {
    polyMarkets,
    castPolyVote,
    getUserVoteForMarket,
    setSelectedMarket,
    setCurrentSubScreen,
    user,
    requireLogin,
    refreshPlmContents,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal states for vote flow
  const [confirmModalData, setConfirmModalData] = useState<{
    market: PolyMarketItem;
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
    prevAmount?: number;
  } | null>(null);

  const [selectedAmount, setSelectedAmount] = useState<number>(100);

  React.useEffect(() => {
    console.log('[PolyMarketScreen] mount -> refreshPlmContents()');
    refreshPlmContents();
  }, [refreshPlmContents]);

  const [resultModalData, setResultModalData] = useState<{
    marketTitle: string;
    choice: string;
    odds: string;
    amount: number;
    expectedPayout: number;
    isRevote: boolean;
    prevChoice?: string;
    participationRewardDp?: number;
  } | null>(null);

  // Policy-compliant 4 categories + ALL
  const categories = ['ALL', '사회', '연예', '정치', '인물'];

  const filteredMarkets = selectedCategory === 'ALL'
    ? polyMarkets
    : polyMarkets.filter(m => m.category === selectedCategory);

  const handleOpenVoteModal = (m: PolyMarketItem, choice: string, odds: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!requireLogin()) return;
    const existingVote = getUserVoteForMarket(m.id);
    const isRevote = !!existingVote;
    const initialAmount = existingVote?.amountDp || 100;

    setSelectedAmount(initialAmount);

    setConfirmModalData({
      market: m,
      choice,
      odds,
      isRevote,
      prevChoice: existingVote?.choice,
      prevAmount: existingVote?.amountDp
    });
  };

  const handleConfirmVote = async () => {
    if (!confirmModalData) return;
    const { market, choice, odds, prevChoice } = confirmModalData;

    let serverResponse: any;
    try {
      const pmIndex = Number(market.id.replace(/^plm-/, '')) || 0;
      const userPickValue = parseFloat(odds.replace(/[^0-9.]/g, '')) || 0;
      serverResponse = await apiCommonClient.post('/members/plm-memberpick', {
        pm_index: pmIndex,
        user_pick: choice === 'YES' ? 1 : 2,
        user_pick_value: userPickValue,
        dp_amount: selectedAmount,
      });
    } catch (error) {
      console.error('[plm-memberpick] 요청 실패:', error);
      setConfirmModalData(null);
      return;
    }

    const serverResult = serverResponse?.result ?? serverResponse?.data?.result ?? -1;
    if (serverResult !== 0) {
      console.warn('[plm-memberpick] 참여 실패 또는 서버 응답 오류:', serverResponse);
      setConfirmModalData(null);
      return;
    }

    const res = castPolyVote(market.id, market.title, market.category, choice, odds, selectedAmount);

    if (res.success) {
      const payout = calcExpectedPayout(selectedAmount, odds);
      setResultModalData({
        marketTitle: market.title,
        choice,
        odds,
        amount: selectedAmount,
        expectedPayout: payout,
        isRevote: res.isRevote,
        prevChoice: prevChoice || res.prevChoice,
        participationRewardDp: res.participationRewardDp
      });
    }
    setConfirmModalData(null);
  };

  const handleNavigateDetail = (m: PolyMarketItem) => {
    setSelectedMarket(m);
    setCurrentSubScreen('poly-market-detail');
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">query_stats</span>
            예측 챌린지
          </h2>
          {/*
            2026-09-08 제거 요청으로 비활성화 (삭제하지 않고 주석 보존).
            사유: 예측 챌린지 화면 제목 아래 부제 문구를 노출하지 않기로 함.
            [원본 JSX]
            <p className="text-xs text-slate-400">웹3 기반 사회·연예·정치·인물 실시간 오즈 &amp; 100~5,000 DP 투표</p>
          */}
        </div>
        <div className="flex items-center gap-2">
          {/* Leaderboard Button */}
          <button
            onClick={() => setCurrentSubScreen('poly-leaderboard')}
            className="flex items-center gap-1.5 bg-[#162639] border border-[#C5A059]/40 hover:border-[#C5A059] px-2.5 py-1.5 rounded-xl shadow-sm transition text-[#E2C28E] hover:text-white group active:scale-95"
            title="이번 시즌 리더보드 보기"
          >
            <span className="material-symbols-outlined text-base text-[#E2C28E] group-hover:scale-110 transition-transform">leaderboard</span>
            <span className="text-xs font-bold">리더보드</span>
          </button>
        </div>
      </div>

      {/* Category Tabs: 전체 마켓 / 사회 / 연예 / 정치 / 인물 */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
              selectedCategory === cat
                ? 'bg-[#C5A059] text-[#0D1B2A] border-[#C5A059] font-bold shadow-sm'
                : 'bg-[#162639] text-slate-300 border-[#1F334D] hover:border-[#C5A059]/40'
            }`}
          >
            {cat === 'ALL' ? '전체 마켓' : cat}
          </button>
        ))}
      </div>

      {/* Market Cards List - Unified Single Yes/No Format */}
      <div className="space-y-3">
        {filteredMarkets.map((m) => {
          const userVote = getUserVoteForMarket(m.id);

          return (
            <div
              key={m.id}
              className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md hover:border-[#C5A059]/50 transition cursor-pointer"
              onClick={() => handleNavigateDetail(m)}
            >
              {/* Category & Total Volume */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2.5 py-0.5 rounded border border-[#C5A059]/30">
                    {m.category}
                  </span>
                  {userVote && (
                    <span className="text-[10px] font-extrabold text-[#E2C28E] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">how_to_vote</span>
                      내 투표: {userVote.choice} ({userVote.amountDp.toLocaleString()} DP)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-[#0D1B2A] px-2 py-1 rounded border border-[#1F334D] whitespace-nowrap">
                  볼륨: {m.totalVolumeDp}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-sm font-bold text-white hover:text-[#E2C28E] transition leading-snug flex items-center justify-between">
                  <span>{m.title}</span>
                  <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.description}</p>
              </div>

              {/* Voting Probability Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold font-mono mb-1">
                  <span className="text-emerald-400">YES {m.yesOdds}</span>
                  <span className="text-rose-400">NO {m.noOdds}</span>
                </div>
                <div className="w-full bg-[#0D1B2A] h-2.5 rounded-full overflow-hidden flex border border-[#1F334D]">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${m.yesValue}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${m.noValue}%` }}
                  />
                </div>
              </div>

              {/* Clean YES / NO Voting Buttons (percentage only) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={(e) => handleOpenVoteModal(m, 'YES', m.yesOdds, e)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                    userVote?.choice === 'YES'
                      ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400 font-black shadow-emerald-900/30'
                      : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                  <span>YES {m.yesOdds}</span>
                </button>

                <button
                  onClick={(e) => handleOpenVoteModal(m, 'NO', m.noOdds, e)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                    userVote?.choice === 'NO'
                      ? 'bg-rose-500 text-white border-rose-400 font-black shadow-rose-900/30'
                      : 'bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">thumb_down</span>
                  <span>NO {m.noOdds}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DP Use & Confirmation Modal (with 4 Presets) */}
      {confirmModalData && (() => {
        const isRevote = confirmModalData.isRevote;
        const prevAmount = confirmModalData.prevAmount || 100;
        const maxAvailableDp = isRevote ? user.walletDp + prevAmount : user.walletDp;
        const projectedBalance = isRevote
          ? user.walletDp + prevAmount - selectedAmount
          : user.walletDp - selectedAmount;
        const expectedPayout = calcExpectedPayout(selectedAmount, confirmModalData.odds);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#162639] border border-[#C5A059] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#C5A059]">how_to_vote</span>
                  {isRevote ? '투표 포지션 변경' : '예측 챌린지 DP 사용 확인'}
                </h3>
                <button
                  onClick={() => setConfirmModalData(null)}
                  className="text-slate-400 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>

              {/* Market Info & Selection */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase">{confirmModalData.market.category}</span>
                  <p className="text-white font-bold text-xs mt-0.5 line-clamp-2">{confirmModalData.market.title}</p>
                </div>

                {/* Selected Choice Badge */}
                <div className="flex items-center justify-between bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D]">
                  <span className="text-slate-400">선택 항목:</span>
                  <span className={`font-black text-sm ${
                    confirmModalData.choice === 'YES' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {confirmModalData.choice} ({confirmModalData.odds})
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
                  onClick={() => setConfirmModalData(null)}
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

            <div className="w-full bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#1F334D] text-left text-xs space-y-2">
              {/* Instant Participation Reward Banner */}
              {resultModalData.participationRewardDp && (
                <div className="bg-gradient-to-r from-[#C5A059]/20 via-[#E2C28E]/15 to-[#C5A059]/20 border border-[#E2C28E]/60 rounded-xl p-2.5 flex items-center justify-between shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#E2C28E] text-base animate-pulse">
                      card_giftcard
                    </span>
                    <div>
                      <span className="font-bold text-white text-[11px] block">참여 즉시 보상 지급</span>
                      <span className="text-[9px] text-slate-300">정산 전 무조건 즉시 적립</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#E2C28E] font-mono bg-[#0D1B2A] px-2 py-0.5 rounded-lg border border-[#E2C28E]/40 shadow-inner">
                    +{resultModalData.participationRewardDp} DP
                  </span>
                </div>
              )}

              <div className="space-y-1.5 pt-0.5">
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
                <div className="flex justify-between pt-1.5 border-t border-[#1F334D]">
                  <span className="text-slate-400">현재 보유 잔액:</span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    {user.walletDp.toLocaleString()} DP
                  </span>
                </div>
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
