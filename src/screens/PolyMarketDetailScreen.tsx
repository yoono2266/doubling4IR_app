import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiCommonClient } from '../utils/apiClient';
import { getStoredUserInfo } from '../utils/auth';
import { useComments, COMMENT_TYPE_CHALLENGE, formatCommentTime } from '../hooks/useComments';
import { PolyVoteConfirmModal, PolyVoteResultModal, PolyVoteResult, calcExpectedPayout, ChoiceChip } from '../components/PolyVoteModals';
import { PolyOddsBar, PolyVoteButtons } from '../components/PolyVoteControls';
import { ChallengeVotePanel } from '../components/challenge/ChallengeVotePanel';
import { ChallengeJoinConfirmModal } from '../components/challenge/ChallengeJoinConfirmModal';
import { useChallengeJoin } from '../hooks/useChallengeJoin';
import { isChallengeDummy } from '../data/challengeDummyData';
import { ChallengeCardBackground } from '../components/challenge/ChallengeCardBackground';

// 2026-09-27 UI/UX 정리: DP_PRESETS·calcExpectedPayout은 components/PolyVoteModals.tsx로 이동(목록 화면과 공용).
// 제목 16 → 18px, 여론 막대 % 라벨, 탭 문구 한글화·이모지 제거, 의견 목록 글자 12 → 13px·font-mono 제거,
// 확인·완료 모달은 공용 컴포넌트 사용. 기존 모달 JSX는 파일 하단 주석에 보존.

// 모바일 카드 폭 기준 2줄 정도로 보이는 글자 수 제한
const COMMENT_MAX_LENGTH = 60;

export const PolyMarketDetailScreen: React.FC = () => {
  const {
    selectedMarket,
    setCurrentSubScreen,
    castPolyVote,
    getUserVoteForMarket,
    user,
    isLoggedIn,
    myProfile,
    refreshMemberProfile,
    requireLogin,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'news'>('rules');
  // 2026-10-03: 챌린지 참여(확인 창 → 서버 기록 → 즉시 DP 안내) 공용 훅
  const { pendingJoin, isSubmitting: isJoinSubmitting, requestJoin, cancelJoin, confirmJoin } = useChallengeJoin();
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [commentInput, setCommentInput] = useState('');

  // 상단 "보유 DP" 배지는 Header.tsx와 동일하게 실제 서버 잔액(myProfile.memberInfo.u_dp)을 표시한다.
  // (아래 투표 확인/완료 모달의 DP 계산은 예측 챌린지 전용 mock 지갑(user.walletDp)을 그대로 사용 — 별개 값)
  const memberInfoDp = myProfile?.memberInfo?.u_dp;
  useEffect(() => {
    if (!isLoggedIn) return;
    if (memberInfoDp !== undefined && memberInfoDp !== null) return;
    refreshMemberProfile();
  }, [isLoggedIn, memberInfoDp, refreshMemberProfile]);
  const headerWalletDp = memberInfoDp ?? getStoredUserInfo()?.u_dp ?? 0;

  // pm_index(=target_index) — 마켓이 없을 때는 0으로 두고, 훅 내부에서 target_index 존재 여부로 가드한다.
  const targetIndex = selectedMarket ? Number(selectedMarket.id.replace(/^plm-/, '')) || 0 : 0;
  const {
    comments,
    commentsLoading,
    isSubmitting: isSubmittingComment,
    myUidx,
    submitComment,
    deleteComment: handleDeleteComment,
  } = useComments(COMMENT_TYPE_CHALLENGE, targetIndex);

  const [confirmModalData, setConfirmModalData] = useState<{
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
    prevAmount?: number;
  } | null>(null);

  // 2026-09-27: 공용 PolyVoteResult 형태로 변경 (title·balanceAfter 추가 / 기존 prevChoice는 표시에 쓰이지 않아 제외)
  const [successModalData, setSuccessModalData] = useState<PolyVoteResult | null>(null);

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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    // 2026-10-03: 테스트 더미 챌린지(localhost 전용)는 서버 번호가 없어(target_index 0) 의견 등록을 막음
    if (isChallengeDummy(selectedMarket?.id)) {
      showToast('테스트용 챌린지에는 의견을 등록할 수 없어요.');
      return;
    }
    const success = await submitComment(commentInput);
    if (success) setCommentInput('');
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
    // 완료 모달 "예상 잔여 포인트" — 확인 모달과 같은 계산 (재투표 시 기존 투입액 반환 후 차감)
    const balanceAfter =
      headerWalletDp + (confirmModalData.isRevote ? confirmModalData.prevAmount || 100 : 0) - selectedAmount;

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
        title: selectedMarket.title,
        choice: confirmModalData.choice,
        odds: confirmModalData.odds,
        amount: selectedAmount,
        expectedPayout: payout,
        isRevote: res.isRevote,
        participationRewardDp: res.participationRewardDp,
        balanceAfter
      });
    }
    setConfirmModalData(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Back Button — 2026-09-27: 문구를 리더보드 화면과 통일(기존: 마켓 목록으로 돌아가기),
          "보유 DP:" 알약 → 콜론 없는 사각 칩 */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {/* 2026-10-03: 명칭 변경 (기존: 예측 챌린지 목록으로) */}
          <span>챌린지 목록으로</span>
        </button>
        {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 챌린지 상세 상단 "보유 N DP" 뱃지 삭제 요청
            (보유 DP는 헤더에 계속 표시됨).
        <span className="shrink-0 h-7 px-2.5 rounded-lg bg-[#162639] border border-[#C5A059]/40 flex items-center gap-1.5 text-xs tabular-nums">
          <span className="text-slate-400">보유</span>
          <span className="font-bold text-[#E2C28E]">{headerWalletDp.toLocaleString()} DP</span>
        </span>
        */}
      </div>

      {/* Market Header Summary Box
          2026-10-03: 카테고리 배경 이미지 적용(목록·홈 캐러셀과 같은 ChallengeCardBackground, 약 35%) —
          relative isolate overflow-hidden 추가 (기존: "bg-[#162639] border border-[#C5A059]/50 rounded-2xl p-4 flex flex-col gap-3") */}
      <div className="relative isolate overflow-hidden bg-[#162639] border border-[#C5A059]/50 rounded-2xl p-4 flex flex-col gap-3">
        <ChallengeCardBackground category={selectedMarket.category} />
        <span className="self-start h-6 px-2 rounded-md text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 border border-[#C5A059]/40 inline-flex items-center">
          {selectedMarket.category}
        </span>

        <h1 className="text-lg font-bold text-white leading-snug break-keep">
          {selectedMarket.title}
        </h1>

        {/* 설명이 제목과 같은 문장이면(서버 데이터) 중복 표시하지 않음 */}
        {selectedMarket.description && selectedMarket.description.trim() !== selectedMarket.title.trim() && (
          <p className="text-[13px] text-slate-300 leading-relaxed break-keep bg-[#0D1B2A]/70 p-3.5 rounded-xl border border-[#1F334D]">
            {selectedMarket.description}
          </p>
        )}

        {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 챌린지 개편 — DP를 걸지 않고(내 투표 금액 표시 불필요),
            여론 막대 삭제(YES/NO 선택만), 확인 창 후 참여·즉시 DP 지급·선택 변경 불가(포지션 변경 안내 삭제),
            참여 100명 전 "의견 수집중" → 아래 ChallengeVotePanel로 교체.
        {/ * Existing Vote * /}
        {existingVote && (
          <div className="bg-[#0D1B2A] border border-[#C5A059]/40 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 tabular-nums">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#C5A059]">how_to_vote</span>
              내 투표
            </span>
            <span className="flex items-center gap-2">
              <ChoiceChip choice={existingVote.choice} />
              <span className="text-[13px] font-bold text-white">{existingVote.amountDp.toLocaleString()} DP</span>
            </span>
          </div>
        )}

        {/ * Visual Probability Bar & Yes/No Buttons * /}
        <PolyOddsBar yesValue={selectedMarket.yesValue} noValue={selectedMarket.noValue} />
        <PolyVoteButtons
          size="lg"
          myChoice={existingVote?.choice}
          onVote={(choice) => handleOpenVoteModal(choice, choice === 'YES' ? selectedMarket.yesOdds : selectedMarket.noOdds)}
        />
        {existingVote && (
          <p className="text-[11px] text-slate-500 text-center -mt-1">다른 쪽을 누르거나 금액을 바꿔 포지션을 변경할 수 있습니다.</p>
        )}
        */}
        <ChallengeVotePanel
          market={selectedMarket}
          myChoice={existingVote?.choice}
          size="lg"
          onSelect={(choice, e) => requestJoin(selectedMarket, choice, e)}
        />
      </div>

      {/* 2026-10-03 비활성화 (삭제하지 않고 보존). 사유: 챌린지 상세에서 "판정 기준 / 분석 · 뉴스" 박스를 삭제하고
          "참여자 토론 & 의견" 박스만 남기기로 함. 복구 시 아래 false를 제거. */}
      {false && (
      <>
      {/* Tabs: Market Rules vs Market News/Context — 2026-09-27: 탭 문구 한글화(영문 괄호 제거), 본문 이모지 제거 */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl overflow-hidden">
        <div className="flex border-b border-[#1F334D]">
          {([
            { id: 'rules' as const, icon: 'gavel', label: '판정 기준' },
            { id: 'news' as const, icon: 'newspaper', label: '분석 · 뉴스' },
          ]).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={`flex-1 h-11 text-[13px] font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
                  isActive ? 'bg-[#0D1B2A] text-[#E2C28E] border-[#C5A059]' : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 flex flex-col gap-2">
          <h4 className="text-xs font-bold text-slate-400">
            {activeTab === 'rules' ? '정산 및 승패 판정 기준' : '실시간 컨센서스 & 인텔리전스'}
          </h4>
          <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-line break-keep bg-[#0D1B2A] p-3.5 rounded-xl border border-[#1F334D]">
            {activeTab === 'rules' ? selectedMarket.rulesText : selectedMarket.contextNews}
          </p>
          {/* 2026-09-27 이전부터 비활성화돼 있던 보조 문구(블록체인 스마트 컨트랙트 정산 안내 / 최근 24시간 투표 유입량)는
              기존 JSX 주석(파일 하단 보존 블록 참고)과 동일하게 계속 숨김 */}
        </div>
      </div>
      </>
      )}

      {/* Real-time Discussion / Comments */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">forum</span>
            <span>참여자 토론 & 의견</span>
          </h3>
          <span className="text-xs text-slate-400 tabular-nums">
            {commentsLoading ? '불러오는 중…' : `${comments.length}개`}
          </span>
        </div>

        {/* 의견 입력 (DOUBLE RING 파트너스 커뮤니티 댓글 입력 형식 참고) — 2026-09-27: 높이 40px·글자 13px
            2026-10-03: 작성글 목록 아래 → 위로 이동 (요청: 의견 등록과 작성글 위치 교체) */}
        <form onSubmit={handleAddComment} className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="이 챌린지에 대한 의견을 남겨보세요"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
              maxLength={COMMENT_MAX_LENGTH}
              disabled={isSubmittingComment}
              className="flex-1 min-w-0 h-10 bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3 text-white text-[13px] placeholder:text-slate-500 focus:border-[#C5A059] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || commentInput.trim().length === 0}
              className="h-10 px-4 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-[13px] shrink-0 disabled:opacity-50"
            >
              등록
            </button>
          </div>
          <span className="text-[11px] text-slate-500 text-right tabular-nums pr-1">
            {commentInput.length}/{COMMENT_MAX_LENGTH}
          </span>
        </form>

        <div className="flex flex-col gap-2">
          {comments.map((comment) => {
            const authorName = comment.u_name || comment.mem_name || `회원 ${comment.mem_index}`;
            const authorAvatar = comment.u_profile || comment.mem_profile || '';
            const isMine = myUidx != null && comment.mem_index === myUidx;

            return (
              <div
                key={comment.tb_index}
                className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] flex gap-2.5"
              >
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-[#C5A059]/40 shrink-0"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-[#162639] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
                    <span className="material-symbols-outlined text-base">person</span>
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-white truncate">
                      {authorName}
                      {isMine && <span className="ml-1 text-xs font-bold text-[#E2C28E]">나</span>}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-slate-500 tabular-nums">{formatCommentTime(comment.reg_timestamp)}</span>
                      {isMine && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.tb_index)}
                          className="w-7 h-7 -mr-1.5 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#1F334D]/60 transition"
                          aria-label="의견 삭제"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-300 leading-relaxed break-words">{comment.tb_comment}</p>
                </div>
              </div>
            );
          })}
          {!commentsLoading && comments.length === 0 && (
            <p className="text-center text-[13px] text-slate-500 py-4">아직 등록된 의견이 없습니다. 첫 의견을 남겨보세요!</p>
          )}
        </div>
        {/* 2026-10-03: 의견 입력창은 작성글 목록 위로 이동 (기존: 이 자리, 목록 아래) */}
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
      {/* Confirmation Modal with Presets — 2026-09-27 공용 컴포넌트 */}
      {confirmModalData && (
        <PolyVoteConfirmModal
          category={selectedMarket.category}
          title={selectedMarket.title}
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
      {successModalData && (
        <PolyVoteResultModal result={successModalData} onClose={() => setSuccessModalData(null)} />
      )}

      {/* [기존 화면 JSX 전체(헤더·탭·의견·확인/완료 모달) — 2026-09-27 위 레이아웃·공용 컴포넌트로 대체, 삭제하지 않고 주석 보존.
          주석 안에 넣기 위해 내부 주석 구분자는 "/ *", "* /"로 바꿔 둠]
      {/ * Back Button * /}
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
            {headerWalletDp.toLocaleString()} DP
          </span>
        </div>
      </div>

      {/ * Market Header Summary Box * /}
      <div className="bg-[#162639] border border-[#C5A059]/50 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2.5 py-0.5 rounded border border-[#C5A059]/30">
            {selectedMarket.category}
          </span>
        </div>

        <h1 className="text-base font-black text-white leading-snug">
          {selectedMarket.title}
        </h1>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#0D1B2A]/70 p-3 rounded-xl border border-[#1F334D]">
          {selectedMarket.description}
        </p>

        {/ * Existing Vote Badge * /}
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

        {/ * Visual Probability Bar & Yes/No Buttons * /}
        <div className="space-y-2 pt-1">
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

          {/ * YES / NO Action Buttons (percentage only) * /}
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
              <span>YES</span>
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
              <span>NO</span>
            </button>
          </div>
        </div>
      </div>

      {/ * Tabs: Market Rules vs Market News/Context * /}
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
              {/ * 
              <p className="text-[10px] text-slate-500 pt-1">
                * 블록체인 스마트 컨트랙트에 의해 공식 공시 발표 즉시 정산 및 배당 분배가 실행됩니다.
              </p>
              * /}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-white mb-1">📰 실시간 마켓 컨센서스 & 인텔리전스:</p>
              <p className="text-slate-300 bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] leading-relaxed">
                {selectedMarket.contextNews}
              </p>
              {/ * 
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#C5A059]">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                
                <span>최근 24시간 동안 총 {selectedMarket.totalVolumeDp}의 예측 투표가 유입되었습니다.</span>
                
              </div>
              * /}
            </div>
          )}
        </div>
      </div>

      {/ * Real-time Discussion / Comments * /}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-base">forum</span>
            <span>참여자 실시간 토론 & 의견</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {commentsLoading ? '불러오는 중...' : `${comments.length}개의 분석 의견`}
          </span>
        </div>

        <div className="space-y-2.5">
          {comments.map((comment) => {
            const authorName = comment.u_name || comment.mem_name || `회원 ${comment.mem_index}`;
            const authorAvatar = comment.u_profile || comment.mem_profile || '';
            const isMine = myUidx != null && comment.mem_index === myUidx;

            return (
              <div
                key={comment.tb_index}
                className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {authorAvatar ? (
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-[#C5A059]/40"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-[#162639] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                        <span className="material-symbols-outlined text-sm">person</span>
                      </span>
                    )}
                    <span className="font-bold text-white">{authorName}{isMine ? ' (나)' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">{formatCommentTime(comment.reg_timestamp)}</span>
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.tb_index)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        aria-label="의견 삭제"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed pl-8 line-clamp-2">{comment.tb_comment}</p>
              </div>
            );
          })}
          {!commentsLoading && comments.length === 0 && (
            <p className="text-center text-slate-500 py-4">아직 등록된 의견이 없습니다. 첫 의견을 남겨보세요!</p>
          )}
        </div>

        {/ * 의견 입력 (더블링 파트너스 커뮤니티 댓글 입력 형식 참고) * /}
        <form onSubmit={handleAddComment} className="flex flex-col gap-1 pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="이 예측 챌린지에 대한 의견을 남겨보세요..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
              maxLength={COMMENT_MAX_LENGTH}
              disabled={isSubmittingComment}
              className="flex-1 bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#C5A059] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmittingComment}
              className="px-3 py-2 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shrink-0 disabled:opacity-50"
            >
              등록
            </button>
          </div>
          <span className="text-[10px] text-slate-500 text-right font-mono pr-1">
            {commentInput.length}/{COMMENT_MAX_LENGTH}
          </span>
        </form>
      </div>

      {/ * Confirmation Modal with Presets * /}
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

              {/ * Market Info * /}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#C5A059] uppercase">{selectedMarket.category}</span>
                  <p className="text-white font-bold text-xs mt-0.5 line-clamp-2">{selectedMarket.title}</p>
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
              {/ * Instant Participation Reward Banner * /}
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
      */}
    </div>
  );
};
