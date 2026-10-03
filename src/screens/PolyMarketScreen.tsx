import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PolyMarketItem } from '../data/polyMarketData';
import { apiCommonClient } from '../utils/apiClient';
import { getStoredUserInfo } from '../utils/auth';
import { PolyVoteConfirmModal, PolyVoteResultModal, PolyVoteResult, calcExpectedPayout } from '../components/PolyVoteModals';
import { PolyOddsBar, PolyVoteButtons } from '../components/PolyVoteControls';
import { ChallengeVotePanel } from '../components/challenge/ChallengeVotePanel';
import { ChallengeJoinConfirmModal } from '../components/challenge/ChallengeJoinConfirmModal';
import { ChallengeCardBackground } from '../components/challenge/ChallengeCardBackground';
import { useChallengeJoin } from '../hooks/useChallengeJoin';
import { useChallengeMarkets } from '../hooks/useChallengeMarkets';

// 2026-09-27 UI/UX 정리: DP_PRESETS·calcExpectedPayout은 components/PolyVoteModals.tsx로 이동(상세 화면과 공용).
// 카테고리 탭 알약 → h-8 사각 태그(+개수), 리더보드 버튼 h-8 아웃라인, 카드 제목 14 → 15px·설명 12 → 13px,
// 여론 막대에 YES/NO % 라벨, 확인·완료 모달은 공용 컴포넌트 사용. 기존 모달 JSX는 파일 하단 주석에 보존.

export const PolyMarketScreen: React.FC = () => {
  const {
    polyMarkets,
    castPolyVote,
    getUserVoteForMarket,
    setSelectedMarket,
    setCurrentSubScreen,
    user,
    isLoggedIn,
    myProfile,
    refreshMemberProfile,
    requireLogin,
    refreshPlmContents,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  // 2026-10-03: 서버 챌린지 + (localhost 개발 환경에서만) 테스트 더미 6건 — 카테고리 탭·목록·개수에 사용
  const challengeMarkets = useChallengeMarkets();
  // 2026-10-03: 챌린지 참여(확인 창 → 서버 기록 → 즉시 DP 안내) 공용 훅
  const { pendingJoin, isSubmitting: isJoinSubmitting, requestJoin, cancelJoin, confirmJoin } = useChallengeJoin();

  // 확인 모달의 "보유"/"잔여 예상 포인트"는 Header.tsx와 동일하게 실제 서버 잔액
  // (myProfile.memberInfo.u_dp)을 기준으로 표시한다. (투표 자체의 mock 차감 로직인
  // user.walletDp와는 별개 — PolyMarketDetailScreen.tsx / PolyMarketCarousel.tsx와 동일한 패턴)
  const memberInfoDp = myProfile?.memberInfo?.u_dp;
  useEffect(() => {
    if (!isLoggedIn) return;
    if (memberInfoDp !== undefined && memberInfoDp !== null) return;
    refreshMemberProfile();
  }, [isLoggedIn, memberInfoDp, refreshMemberProfile]);
  const headerWalletDp = memberInfoDp ?? getStoredUserInfo()?.u_dp ?? 0;

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

  // 2026-09-27: 공용 PolyVoteResult 형태로 변경 (marketTitle → title, balanceAfter 추가 / 기존 prevChoice는 표시에 쓰이지 않아 제외)
  const [resultModalData, setResultModalData] = useState<PolyVoteResult | null>(null);

  // Policy-compliant 4 categories + ALL
  // 2026-09-27: 서버 마켓에 4개 외 카테고리(예: 스포츠)가 오면 탭을 뒤에 추가해 해당 챌린지로 바로 갈 수 있게 하고,
  // 챌린지가 0건인 카테고리 탭은 숨김 (기존: 4개 고정 표시 → 빈 목록 탭 존재, 스포츠 챌린지는 "전체"에서만 보임)
  const BASE_CATEGORIES = ['사회', '연예', '정치', '인물'];
  const extraCategories = Array.from(new Set(challengeMarkets.map((m) => m.category))).filter(
    (c) => c && !BASE_CATEGORIES.includes(c)
  );
  const categories = [
    'ALL',
    ...[...BASE_CATEGORIES, ...extraCategories].filter((c) => challengeMarkets.some((m) => m.category === c)),
  ];

  const filteredMarkets = selectedCategory === 'ALL'
    ? challengeMarkets
    : challengeMarkets.filter(m => m.category === selectedCategory);

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
    const { market, choice, odds, isRevote, prevAmount } = confirmModalData;
    // 완료 모달 "예상 잔여 포인트" — 확인 모달과 같은 계산 (재투표 시 기존 투입액 반환 후 차감)
    const balanceAfter = headerWalletDp + (isRevote ? prevAmount || 100 : 0) - selectedAmount;

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
        title: market.title,
        choice,
        odds,
        amount: selectedAmount,
        expectedPayout: payout,
        isRevote: res.isRevote,
        participationRewardDp: res.participationRewardDp,
        balanceAfter
      });
    }
    setConfirmModalData(null);
  };

  const handleNavigateDetail = (m: PolyMarketItem) => {
    setSelectedMarket(m);
    setCurrentSubScreen('poly-market-detail');
  };

  const categoryCount = (cat: string) =>
    cat === 'ALL' ? challengeMarkets.length : challengeMarkets.filter((m) => m.category === cat).length;

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Header Title */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">query_stats</span>
            {/* 2026-10-03: 명칭 변경 "예측 챌린지" → "챌린지" */}
            챌린지
          </h2>
          {/*
            2026-09-08 제거 요청으로 비활성화 (삭제하지 않고 주석 보존).
            사유: 예측 챌린지 화면 제목 아래 부제 문구를 노출하지 않기로 함.
            [원본 JSX]
            <p className="text-xs text-slate-400">웹3 기반 사회·연예·정치·인물 실시간 오즈 &amp; 100~5,000 DP 투표</p>
          */}
        </div>
        {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 챌린지 개편으로 리더보드 삭제 요청 (리더보드 화면 진입 버튼 숨김).
        {/ * Leaderboard Button — 2026-09-27: 다른 화면 헤더 버튼과 같은 h-8 아웃라인 * /}
        <button
          type="button"
          onClick={() => setCurrentSubScreen('poly-leaderboard')}
          className="shrink-0 h-8 pl-2 pr-3 rounded-lg border border-[#C5A059]/50 bg-[#C5A059]/10 text-[#E2C28E] text-xs font-bold flex items-center gap-1 hover:bg-[#C5A059]/20 active:scale-[0.97] transition"
          title="이번 시즌 리더보드 보기"
        >
          <span className="material-symbols-outlined text-base">leaderboard</span>
          <span>리더보드</span>
        </button>
        */}
      </div>

      {/* Category Tabs: 전체 / 사회 / 연예 / 정치 / 인물 — 2026-09-27: "전체 마켓" → "전체", 개수 표시 */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={isActive}
              className={`shrink-0 h-8 px-3 rounded-lg border text-xs font-bold whitespace-nowrap tabular-nums transition ${
                isActive
                  ? 'bg-[#C5A059] border-[#C5A059] text-[#0D1B2A]'
                  : 'bg-[#162639] border-[#1F334D] text-slate-300 hover:border-[#C5A059]/50'
              }`}
            >
              {cat === 'ALL' ? '전체' : cat} ({categoryCount(cat)})
            </button>
          );
        })}
      </div>

      {/* Market Cards List - Unified Single Yes/No Format */}
      <div className="flex flex-col gap-3">
        {filteredMarkets.length === 0 && (
          <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-6 text-center">
            <p className="text-[13px] text-slate-400">이 카테고리에 진행 중인 챌린지가 없습니다.</p>
          </div>
        )}
        {filteredMarkets.map((m) => {
          const userVote = getUserVoteForMarket(m.id);

          return (
            <div
              key={m.id}
              // 2026-10-03: 카테고리 배경 이미지용 relative isolate overflow-hidden 추가 (기존: 없음)
              className="relative isolate overflow-hidden bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#C5A059]/50 transition cursor-pointer"
              onClick={() => handleNavigateDetail(m)}
            >
              {/* 2026-10-03: 카테고리별 배경 이미지 (현재 스포츠만, 약 35%) */}
              <ChallengeCardBackground category={m.category} />
              {/* Category & My Vote */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="h-6 px-2 rounded-md text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 border border-[#C5A059]/40 inline-flex items-center">
                  {m.category}
                </span>
                {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: DP를 걸지 않는 참여 방식으로 바뀌어 "내 투표 YES · N DP" 표시가 맞지 않음.
                    내 선택은 아래 참여 영역(ChallengeVotePanel)에 표시.
                {userVote && (
                  <span className="h-6 px-2 rounded-md text-[11px] font-bold text-[#E2C28E] bg-[#0D1B2A] border border-[#C5A059]/40 inline-flex items-center gap-1 tabular-nums">
                    <span className="material-symbols-outlined text-sm">how_to_vote</span>
                    내 투표 {userVote.choice} · {userVote.amountDp.toLocaleString()} DP
                  </span>
                )}
                */}
              </div>

              {/* Title & Description */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-white leading-snug break-keep">{m.title}</h3>
                  <span className="material-symbols-outlined text-lg text-slate-500 shrink-0">chevron_right</span>
                </div>
                {/* 설명이 제목과 같은 문장이면(서버 데이터) 중복 표시하지 않음 */}
                {m.description && m.description.trim() !== m.title.trim() && (
                  <p className="text-[13px] text-slate-400 mt-1 line-clamp-2 leading-relaxed break-keep">{m.description}</p>
                )}
              </div>

              {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 챌린지 개편 — 여론 막대 삭제(YES/NO 선택만),
                  DP 금액 선택 없이 확인 창 후 참여·즉시 DP 지급·변경 불가, 참여 100명 전 "의견 수집중" → ChallengeVotePanel로 교체.
              {/ * Voting Probability Bar + YES / NO Buttons * /}
              <PolyOddsBar yesValue={m.yesValue} noValue={m.noValue} />
              <PolyVoteButtons
                myChoice={userVote?.choice}
                onVote={(choice, e) => handleOpenVoteModal(m, choice, choice === 'YES' ? m.yesOdds : m.noOdds, e)}
              />
              */}
              <ChallengeVotePanel
                market={m}
                myChoice={userVote?.choice}
                onSelect={(choice, e) => requestJoin(m, choice, e)}
              />
            </div>
          );
        })}
      </div>

      {/* 2026-10-03: 챌린지 참여 확인 창 (DP 금액 선택 없음) */}
      {pendingJoin && (
        <ChallengeJoinConfirmModal
          category={pendingJoin.market.category}
          title={pendingJoin.market.title}
          choice={pendingJoin.choice}
          isSubmitting={isJoinSubmitting}
          onCancel={cancelJoin}
          onConfirm={confirmJoin}
        />
      )}

      {/* 2026-10-03: 아래 DP 사용 확인·완료 모달은 새 참여 방식에서 열리지 않음 (handleOpenVoteModal 호출부가 주석 처리됨, 코드 보존) */}
      {/* DP Use & Confirmation Modal (with 4 Presets) — 2026-09-27 공용 컴포넌트 */}
      {confirmModalData && (
        <PolyVoteConfirmModal
          category={confirmModalData.market.category}
          title={confirmModalData.market.title}
          choice={confirmModalData.choice}
          odds={confirmModalData.odds}
          isRevote={confirmModalData.isRevote}
          prevAmount={confirmModalData.prevAmount}
          walletDp={headerWalletDp}
          selectedAmount={selectedAmount}
          onSelectAmount={setSelectedAmount}
          onCancel={() => setConfirmModalData(null)}
          onConfirm={handleConfirmVote}
        />
      )}

      {/* Result Screen Modal — 2026-09-27 공용 컴포넌트 */}
      {resultModalData && (
        <PolyVoteResultModal result={resultModalData} onClose={() => setResultModalData(null)} />
      )}

      {/* [기존 확인·완료 모달 JSX — 2026-09-27 공용 컴포넌트(PolyVoteModals)로 대체, 삭제하지 않고 주석 보존.
          주석 안에 넣기 위해 내부 주석 구분자는 "/ *", "* /"로 바꿔 둠]
      {/ * DP Use & Confirmation Modal (with 4 Presets) * /}
      {confirmModalData && (() => {
        const isRevote = confirmModalData.isRevote;
        const prevAmount = confirmModalData.prevAmount || 100;
        const maxAvailableDp = isRevote ? headerWalletDp + prevAmount : headerWalletDp;
        const projectedBalance = isRevote
          ? headerWalletDp + prevAmount - selectedAmount
          : headerWalletDp - selectedAmount;
        const expectedPayout = calcExpectedPayout(selectedAmount, confirmModalData.odds);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#162639] border border-[#C5A059] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95">
              {/ * Header * /}
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

              {/ * Market Info & Selection * /}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase">{confirmModalData.market.category}</span>
                  <p className="text-white font-bold text-xs mt-0.5 line-clamp-2">{confirmModalData.market.title}</p>
                </div>

                {/ * Selected Choice Badge * /}
                <div className="flex items-center justify-between bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D]">
                  <span className="text-slate-400">선택 항목:</span>
                  <span className={`font-black text-sm ${
                    confirmModalData.choice === 'YES' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {confirmModalData.choice} ({confirmModalData.odds})
                  </span>
                </div>

                {/ * Preset Options (100 / 500 / 1,000 / 5,000 DP) * /}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 font-bold">매수 DP 선택:</span>
                    <span className="text-slate-400">보유: {headerWalletDp.toLocaleString()} DP</span>
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

                {/ * Live Cost & Expected Return Summary * /}
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

                  {/ * Expected Payout based on Odds 
                  <div className="pt-2 border-t border-[#1F334D]/80">
                    <div className="bg-[#162639] p-2 rounded-lg border border-[#C5A059]/30 text-center">
                      <span className="text-[11px] text-slate-300 block">
                        선택한 금액: <strong className="text-white">{selectedAmount.toLocaleString()} DP</strong> · 적중 시 예상 획득: <strong className="text-[#E2C28E]">약 {expectedPayout.toLocaleString()} DP</strong>
                      </span>
                    </div>
                  </div>
                    * /}
                </div>
              </div>

              {/ * Action Buttons * /}
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

      {/ * Result Screen Modal * /}
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
              {/ * Instant Participation Reward Banner * /}
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
      */}
    </div>
  );
};
