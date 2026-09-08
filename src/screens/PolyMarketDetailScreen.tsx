import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MarketComment } from '../data/polyMarketData';
import { apiCommonClient } from '../utils/apiClient';

const DP_PRESETS = [100, 500, 1000, 5000];

const calcExpectedPayout = (amount: number, oddsStr: string): number => {
  const percent = parseFloat(oddsStr.replace(/[^0-9.]/g, '')) || 50;
  const decimal = percent / 100;
  if (decimal <= 0) return amount;
  return Math.round(amount / decimal);
};

export const PolyMarketDetailScreen: React.FC = () => {
  const {
    selectedMarket,
    setCurrentSubScreen,
    castPolyVote,
    getUserVoteForMarket,
    user,
    requireLogin,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'news'>('rules');
  const [selectedAmount, setSelectedAmount] = useState<number>(100);

  // 현재 사용자가 이 상세 화면에서 새로 남긴 의견 (mock, 새로고침 시 초기화)
  const [userComments, setUserComments] = useState<MarketComment[]>([]);
  const [commentInput, setCommentInput] = useState('');

  const [confirmModalData, setConfirmModalData] = useState<{
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
    prevAmount?: number;
  } | null>(null);

  const [successModalData, setSuccessModalData] = useState<{
    choice: string;
    odds: string;
    amount: number;
    expectedPayout: number;
    isRevote: boolean;
    prevChoice?: string;
    participationRewardDp?: number;
  } | null>(null);

  if (!selectedMarket) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>선택된 마켓 정보가 없습니다.</p>
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="mt-4 px-4 py-2 rounded-xl bg-[#162639] text-[#C5A059] text-xs font-bold"
        >
          마켓 목록으로 돌아가기
        </button>
      </div>
    );
  }

  const existingVote = getUserVoteForMarket(selectedMarket.id);

  // 원본(seed) 의견 + 사용자가 이번에 남긴 의견을 합쳐서 렌더링
  const allComments: MarketComment[] = [...selectedMarket.comments, ...userComments];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    const text = commentInput.trim();
    if (!text) return;

    const profileImg = user?.avatar && user.avatar.startsWith('http') ? user.avatar : '';

    setUserComments(prev => [
      ...prev,
      {
        id: `uc-${Date.now()}`,
        author: `${user?.name || '나'} (나)`,
        avatar: profileImg,
        choice: existingVote?.choice,
        timeAgo: '방금 전',
        content: text,
        likes: 0
      }
    ]);
    setCommentInput('');
    showToast('의견이 등록되었습니다.');
  };

  const handleOpenVoteModal = (choice: string, odds: string) => {
    if (!requireLogin()) return;
    const isRevote = !!existingVote;
    const initialAmount = existingVote?.amountDp || 100;
    setSelectedAmount(initialAmount);

    setConfirmModalData({
      choice,
      odds,
      isRevote,
      prevChoice: existingVote?.choice,
      prevAmount: existingVote?.amountDp
    });
  };

  const handleConfirmVote = async () => {
    if (!confirmModalData) return;

    let response: any;
    try {
      const pmIndex = Number(selectedMarket.id.replace(/^plm-/, '')) || 0;
      const userPickValue = parseFloat(confirmModalData.odds.replace(/[^0-9.]/g, '')) || 0;
      response = await apiCommonClient.post('/members/plm-memberpick', {
        pm_index: pmIndex,
        user_pick: confirmModalData.choice === 'YES' ? 1 : 2,
        user_pick_value: userPickValue,
        dp_amount: selectedAmount,
      });
    } catch (error) {
      console.error('[plm-memberpick] 요청 실패:', error);
      setConfirmModalData(null);
      return;
    }

    const serverResult = response?.result ?? response?.data?.result ?? -1;
    if (serverResult !== 0) {
      console.warn('[plm-memberpick] 참여 실패 또는 서버 응답 오류:', response);
      setConfirmModalData(null);
      return;
    }

    const res = castPolyVote(
      selectedMarket.id,
      selectedMarket.title,
      selectedMarket.category,
      confirmModalData.choice,
      confirmModalData.odds,
      selectedAmount
    );

    if (res.success) {
      const payout = calcExpectedPayout(selectedAmount, confirmModalData.odds);
      setSuccessModalData({
        choice: confirmModalData.choice,
        odds: confirmModalData.odds,
        amount: selectedAmount,
        expectedPayout: payout,
        isRevote: res.isRevote,
        prevChoice: res.prevChoice,
        participationRewardDp: res.participationRewardDp
      });
    }
    setConfirmModalData(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마켓 목록으로 돌아가기</span>
        </button>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#162639] border border-[#C5A059]/40">
          <span className="text-[10px] text-slate-400 font-medium">보유 DP:</span>
          <span className="text-xs font-bold text-[#E2C28E] font-mono">
            {user.walletDp.toLocaleString()} DP
          </span>
        </div>
      </div>

      {/* Market Header Summary Box */}
      <div className="bg-[#162639] border border-[#C5A059]/50 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2.5 py-0.5 rounded border border-[#C5A059]/30">
            {selectedMarket.category}
          </span>
          <span className="text-[10px] text-slate-400 font-mono bg-[#0D1B2A] px-2 py-1 rounded border border-[#1F334D] whitespace-nowrap">
            볼륨: {selectedMarket.totalVolumeDp}
          </span>
        </div>

        <h1 className="text-base font-black text-white leading-snug">
          {selectedMarket.title}
        </h1>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#0D1B2A]/70 p-3 rounded-xl border border-[#1F334D]">
          {selectedMarket.description}
        </p>

        {/* Existing Vote Badge */}
        {existingVote && (
          <div className="bg-[#0D1B2A] border border-[#C5A059]/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#C5A059]">how_to_vote</span>
              현재 나의 투표:
            </span>
            <span className="font-bold text-[#E2C28E] bg-[#C5A059]/15 px-2 py-0.5 rounded border border-[#C5A059]/30">
              {existingVote.choice} ({existingVote.amountDp.toLocaleString()} DP)
            </span>
          </div>
        )}

        {/* Visual Probability Bar & Yes/No Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-bold font-mono px-1">
            <span className="text-emerald-400">YES {selectedMarket.yesOdds}</span>
            <span className="text-rose-400">NO {selectedMarket.noOdds}</span>
          </div>
          <div className="w-full bg-[#0D1B2A] h-2.5 rounded-full overflow-hidden flex border border-[#1F334D]">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${selectedMarket.yesValue}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${selectedMarket.noValue}%` }}
            />
          </div>

          {/* YES / NO Action Buttons (percentage only) */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => handleOpenVoteModal('YES', selectedMarket.yesOdds)}
              className={`py-3 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md active:scale-98 ${
                existingVote?.choice === 'YES'
                  ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400 shadow-emerald-900/40'
                  : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-base">thumb_up</span>
              <span>YES {selectedMarket.yesOdds}</span>
            </button>

            <button
              onClick={() => handleOpenVoteModal('NO', selectedMarket.noOdds)}
              className={`py-3 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md active:scale-98 ${
                existingVote?.choice === 'NO'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-rose-900/40'
                  : 'bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-base">thumb_down</span>
              <span>NO {selectedMarket.noOdds}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Market Rules vs Market News/Context */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl overflow-hidden shadow-md">
        <div className="flex border-b border-[#1F334D]">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-3 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-[#0D1B2A] text-[#C5A059] border-b-2 border-[#C5A059]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">gavel</span>
            <span>판정 기준 및 룰 (Rules)</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-3 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'news'
                ? 'bg-[#0D1B2A] text-[#C5A059] border-b-2 border-[#C5A059]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">newspaper</span>
            <span>마켓 분석 및 뉴스 (Context)</span>
          </button>
        </div>

        <div className="p-4 text-xs text-slate-300 leading-relaxed min-h-[100px]">
          {activeTab === 'rules' ? (
            <div className="space-y-2 whitespace-pre-line">
              <p className="font-semibold text-white mb-1">📋 오라클 정산 및 승패 판정 기준:</p>
              <p className="text-slate-300 bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D]">
                {selectedMarket.rulesText}
              </p>
              <p className="text-[10px] text-slate-500 pt-1">
                * 블록체인 스마트 컨트랙트에 의해 공식 공시 발표 즉시 정산 및 배당 분배가 실행됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-white mb-1">📰 실시간 마켓 컨센서스 & 인텔리전스:</p>
              <p className="text-slate-300 bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] leading-relaxed">
                {selectedMarket.contextNews}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#C5A059]">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>최근 24시간 동안 총 {selectedMarket.totalVolumeDp}의 예측 투표가 유입되었습니다.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Discussion / Comments */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-base">forum</span>
            <span>참여자 실시간 토론 & 의견</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {allComments.length}개의 분석 의견
          </span>
        </div>

        <div className="space-y-2.5">
          {allComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] flex flex-col gap-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {comment.avatar ? (
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-6 h-6 rounded-full object-cover border border-[#C5A059]/40"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[#162639] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </span>
                  )}
                  <span className="font-bold text-white">{comment.author}</span>
                  {comment.choice && (
                    <span className="text-[10px] font-bold text-[#E2C28E] bg-[#C5A059]/15 px-1.5 py-0.2 rounded border border-[#C5A059]/30">
                      선택: {comment.choice}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{comment.timeAgo}</span>
              </div>
              <p className="text-slate-300 leading-relaxed pl-8">{comment.content}</p>
              <div className="flex justify-end items-center gap-1 text-[10px] text-slate-400 pl-8">
                <span className="material-symbols-outlined text-xs text-rose-400">favorite</span>
                <span>{comment.likes}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 의견 입력 (더블링 파트너스 커뮤니티 댓글 입력 형식 참고) */}
        <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="이 마켓에 대한 의견을 남겨보세요..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#C5A059] focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shrink-0"
          >
            등록
          </button>
        </form>
      </div>

      {/* Confirmation Modal with Presets */}
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

              {/* Market Info */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase">{selectedMarket.category}</span>
                  <p className="text-white font-bold text-xs mt-0.5 line-clamp-2">{selectedMarket.title}</p>
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
      {successModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl shadow-lg">
              ✓
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                {successModalData.isRevote ? '투표 변경 완료!' : '예측 챌린지 투표 참여 완료!'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {successModalData.isRevote
                  ? `[${successModalData.choice}] (${successModalData.amount.toLocaleString()} DP)로 성공적으로 변경되었습니다.`
                  : `${successModalData.amount.toLocaleString()} DP가 차감되어 정상적으로 등록되었습니다.`}
              </p>
            </div>

            <div className="w-full bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#1F334D] text-left text-xs space-y-2">
              {/* Instant Participation Reward Banner */}
              {successModalData.participationRewardDp && (
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
                    +{successModalData.participationRewardDp} DP
                  </span>
                </div>
              )}

              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">마켓:</span>
                  <span className="font-bold text-white truncate max-w-[180px]">{selectedMarket.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">선택한 결과:</span>
                  <span className="font-extrabold text-[#E2C28E]">{successModalData.choice} ({successModalData.odds})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">투표 금액:</span>
                  <span className="font-mono font-bold text-white">{successModalData.amount.toLocaleString()} DP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">적중 시 예상 획득:</span>
                  <span className="font-mono font-bold text-[#E2C28E]">약 {successModalData.expectedPayout.toLocaleString()} DP</span>
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
              onClick={() => setSuccessModalData(null)}
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
