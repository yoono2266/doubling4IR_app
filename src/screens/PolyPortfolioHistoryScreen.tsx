import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PolyVote } from '../types';

// 2026-09-27 UI/UX 정리 (마이페이지 > 예측 챌린지 참여 내역)
// - 상단 3분할 요약 카드 → 요약 카드 1장(3칸 구분선), 보유 DP는 마이페이지·헤더와 같은 memberInfo.u_dp 사용
//   (기존: mock user.walletDp 20,000 — 헤더 12,000 DP와 불일치). 조기 정리 환급(mock)은 여전히 user.walletDp에만 반영됨.
// - font-mono → Pretendard tabular-nums, 작은 글자 10~11px → 12~13px, 라벨 콜론 제거
// - 알약형(rounded-full) 칩 → rounded-md, 깜빡임(animate-pulse)·드롭 섀도우·글로우 제거
// - 조기 정리 버튼 h-11 + "반환 N DP"를 버튼 안 우측에 분리 표기
// 데이터는 전부 AppContext polyVotes mock(실제 정산 연동 아님).

const CHIP = 'h-6 px-2 rounded-md text-[11px] font-bold border inline-flex items-center gap-1';

const Row: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={`flex items-center justify-between gap-3 ${className}`}>
    <span className="shrink-0 text-xs text-slate-400">{label}</span>
    <span className="min-w-0 text-right text-[13px] text-white">{children}</span>
  </div>
);

const ChoiceChip: React.FC<{ choice: string }> = ({ choice }) => (
  <span
    className={`${CHIP} ${
      choice.includes('YES')
        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
        : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
    }`}
  >
    {choice}
  </span>
);

export const PolyPortfolioHistoryScreen: React.FC = () => {
  const { myProfile, polyVotes, setCurrentTab, setCurrentSubScreen, earlyExitPolyVote } = useApp();

  // Tab State: 'open' (진행중) vs 'settled' (완료)
  const [activeTab, setActiveTab] = useState<'open' | 'settled'>('open');

  // Early Exit Confirmation Modal State
  const [exitTargetVote, setExitTargetVote] = useState<PolyVote | null>(null);

  // Filter positions
  const openPositions = polyVotes.filter(v => v.status === '진행중');
  const settledPositions = polyVotes.filter(v => v.status === '완료');

  // 1. Calculate 3 Summary Metrics
  // 보유 DP: 2026-09-27 memberInfo.u_dp (기존: user.walletDp mock)
  const walletDp = myProfile?.memberInfo?.u_dp || 0;
  //진행중 투입액: sum of open positions' amountDp
  const openTotalInvested = openPositions.reduce((acc, v) => acc + (v.amountDp || 0), 0);
  //예상 회수액: sum of open positions' expectedPayoutDp
  const openTotalExpectedPayout = openPositions.reduce((acc, v) => acc + (v.expectedPayoutDp || v.amountDp || 0), 0);

  const exitReturnOf = (vote: PolyVote) => Math.max(10, vote.amountDp + (vote.unrealizedPnlDp ?? 0));
  const signed = (n: number) => (n >= 0 ? `+${n.toLocaleString()}` : n.toLocaleString());

  const goToChallenge = () => {
    setCurrentTab('poly');
    setCurrentSubScreen(null);
  };

  const handleConfirmEarlyExit = () => {
    if (!exitTargetVote) return;
    earlyExitPolyVote(exitTargetVote.id);
    setExitTargetVote(null);
  };

  const TABS: { id: 'open' | 'settled'; label: string; count: number }[] = [
    { id: 'open', label: '진행중', count: openPositions.length },
    { id: 'settled', label: '완료(정산됨)', count: settledPositions.length },
  ];

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Back to My Page */}
      <button
        onClick={() => setCurrentSubScreen(null)}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 w-fit transition"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>마이페이지로 돌아가기</span>
      </button>

      {/* Screen Title & Quick Link — 2026-09-27: 제목 16 → 18px(다른 마이페이지 하위 화면과 통일),
          "챌린지 참여 →" 금색 채움 버튼 → 아웃라인 h-8 버튼(오퍼 신청 내역 "추가 혜택 신청"과 같은 형태) */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[#C5A059]">query_stats</span>
          <span className="truncate">예측 챌린지 참여 내역</span>
        </h2>
        {/*
          2026-09-09 제거 요청으로 비활성화 (삭제하지 않고 주석 보존).
          사유: 제목 아래 부제 문구를 노출하지 않기로 함.
          [원본 JSX]
          <p className="text-[11px] text-slate-400">오즈 기반 실시간 포지션 관리 및 조기 정리</p>
        */}
        <button
          type="button"
          onClick={goToChallenge}
          className="shrink-0 h-8 pl-3 pr-1.5 rounded-lg border border-[#C5A059]/50 bg-[#C5A059]/10 text-[#E2C28E] text-xs font-bold flex items-center gap-0.5 hover:bg-[#C5A059]/20 active:scale-[0.97] transition"
        >
          <span>챌린지 참여</span>
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>

      {/* 1. 요약 — 2026-09-27: 3분할 카드 → 카드 1장 3칸 */}
      <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl py-3.5 grid grid-cols-3 divide-x divide-[#1F334D] tabular-nums">
        <div className="px-3 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] text-slate-400">보유 DP</span>
          <span className="text-base font-extrabold text-[#FFF0D0] leading-none truncate">{walletDp.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500">DP 잔액</span>
        </div>
        <div className="px-3 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] text-slate-400">진행중 투입</span>
          <span className="text-base font-extrabold text-white leading-none truncate">{openTotalInvested.toLocaleString()}</span>
          <span className="text-[11px] text-slate-500">{openPositions.length}개 포지션</span>
        </div>
        <div className="px-3 flex flex-col gap-1 min-w-0">
          <span className="text-[11px] text-slate-400">적중 시 회수</span>
          <span className="text-base font-extrabold text-[#E2C28E] leading-none truncate">
            <span className="text-xs font-bold mr-0.5">약</span>{openTotalExpectedPayout.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">예상 합계</span>
        </div>
      </div>

      {/* [기존 상단 3분할 요약 카드 — 2026-09-27 위 요약 카드 1장으로 대체 (삭제하지 않고 주석 보존)]
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">보유 DP</span>
          <div className="mt-1">
            <span className="text-sm sm:text-base font-black text-[#E2C28E] font-mono leading-tight block">{user.walletDp.toLocaleString()}</span>
            <span className="text-[9px] text-amber-200/80 font-sans font-semibold">DP 잔액</span>
          </div>
        </div>
        <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">진행중 투입액</span>
          <div className="mt-1">
            <span className="text-sm sm:text-base font-black text-white font-mono leading-tight block">{openTotalInvested.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 font-sans font-semibold">{openPositions.length}개 포지션</span>
          </div>
        </div>
        <div className="bg-[#162639] border border-emerald-500/40 rounded-2xl p-3 flex flex-col justify-between shadow-md bg-gradient-to-b from-[#162639] to-[#0E232E]">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">예상 회수액</span>
          <div className="mt-1">
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono leading-tight block">약 {openTotalExpectedPayout.toLocaleString()}</span>
            <span className="text-[9px] text-emerald-300/80 font-sans font-semibold">적중 시 합계</span>
          </div>
        </div>
      </div>
      */}

      {/* 2. 탭 전환: 진행중 / 완료(정산됨) — 2026-09-27: 개수 뱃지 알약형 → 사각, font-mono 제거 */}
      <div className="flex bg-[#0D1B2A] p-1 rounded-xl border border-[#1F334D]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`flex-1 h-9 rounded-lg text-[13px] font-bold transition flex items-center justify-center gap-1.5 ${
                isActive ? 'bg-[#162639] text-[#E2C28E] border border-[#C5A059]/50' : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`min-w-[20px] h-5 px-1 rounded-md text-[11px] font-bold tabular-nums flex items-center justify-center ${
                  isActive ? 'bg-[#C5A059] text-[#0D1B2A]' : 'bg-[#162639] text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 진행중 포지션 목록 (OPEN) */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {openPositions.length === 0 ? (
            <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-6 text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#C5A059]">hourglass_empty</span>
              <div>
                <p className="text-[13px] font-bold text-white">진행중인 예측 포지션이 없습니다.</p>
                <p className="mt-1 text-xs text-slate-400 break-keep">새로운 예측 챌린지에 투표하고 DP를 획득해보세요!</p>
              </div>
              <button
                type="button"
                onClick={goToChallenge}
                className="h-10 px-4 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-[13px] hover:brightness-110 active:scale-[0.98] transition"
              >
                예측 챌린지 둘러보기
              </button>
            </div>
          ) : (
            openPositions.map((vote) => {
              const pnl = vote.unrealizedPnlDp ?? 0;
              const isProfit = pnl >= 0;
              const exitReturnAmount = exitReturnOf(vote);

              return (
                <div
                  key={vote.id}
                  className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3"
                >
                  {/* Category & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`${CHIP} text-[#E2C28E] bg-[#C5A059]/10 border-[#C5A059]/40`}>
                      {vote.category}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      진행중 · {vote.date}
                    </span>
                  </div>

                  {/* Market Title */}
                  <h3 className="text-[15px] font-bold text-white leading-snug break-keep">
                    {vote.title}
                  </h3>

                  {/* Position Details */}
                  <div className="bg-[#0D1B2A] p-3.5 rounded-xl border border-[#1F334D] flex flex-col gap-2.5 tabular-nums">
                    <Row label="선택 및 투입">
                      <span className="inline-flex items-center gap-2">
                        <ChoiceChip choice={vote.choice} />
                        <span className="font-bold">{vote.amountDp.toLocaleString()} DP</span>
                      </span>
                    </Row>

                    {vote.oddsChangeText && (
                      <Row label="여론 변화">
                        <span className="text-slate-200">{vote.oddsChangeText}</span>
                      </Row>
                    )}

                    <Row label="적중 시 예상 획득">
                      <span className="font-bold text-[#E2C28E]">
                        약 {(vote.expectedPayoutDp || Math.round(vote.amountDp * 1.5)).toLocaleString()} DP
                      </span>
                    </Row>

                    <Row label="현재가 기준 잠재 손익" className="pt-2.5 border-t border-[#1F334D]">
                      <span className={`text-sm font-extrabold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {signed(pnl)} DP
                      </span>
                    </Row>
                  </div>

                  {/* Early Exit Action Button — 2026-09-27: "지금 정리하기 (반환: N DP)" → 좌 "지금 정리하기" / 우 "반환 N DP" */}
                  <button
                    type="button"
                    onClick={() => setExitTargetVote(vote)}
                    className="w-full h-11 px-4 rounded-xl bg-[#0D1B2A] border border-[#C5A059]/40 hover:border-[#C5A059] text-[#E2C28E] transition flex items-center justify-between active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-bold">
                      <span className="material-symbols-outlined text-base">exit_to_app</span>
                      지금 정리하기
                    </span>
                    <span className="text-xs text-slate-300 tabular-nums">
                      반환 <span className="font-bold text-[#E2C28E]">{exitReturnAmount.toLocaleString()} DP</span>
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: 완료(정산됨) 포지션 목록 (SETTLED) */}
      {activeTab === 'settled' && (
        <div className="space-y-3">
          {settledPositions.length === 0 ? (
            <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-6 text-center">
              <p className="text-[13px] text-slate-400">정산 완료된 포지션 내역이 없습니다.</p>
            </div>
          ) : (
            settledPositions.map((vote) => {
              const settleType = vote.settleType || 'MAJORITY_WIN';
              const payout = vote.settledPayoutDp ?? 0;

              return (
                <div
                  key={vote.id}
                  className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3"
                >
                  {/* Status Banner with 3 Specific Tones (+ Early Exit) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className={`${CHIP} text-slate-300 bg-[#0D1B2A] border-[#1F334D]`}>
                        {vote.category}
                      </span>

                      {/* Tone 1: 다수의견 적중 (Green) */}
                      {settleType === 'MAJORITY_WIN' && (
                        <span className={`${CHIP} text-emerald-300 bg-emerald-500/10 border-emerald-500/30`}>
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          다수의견 적중
                        </span>
                      )}

                      {/* Tone 2: 소수의견 적중 (Gold 강조) */}
                      {settleType === 'MINORITY_WIN' && (
                        <span className={`${CHIP} text-[#0D1B2A] gold-button-gradient border-transparent`}>
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          남다른 시각 적중!
                        </span>
                      )}

                      {/* Tone 3: 예측 실패 (담담한 회색조 톤) */}
                      {settleType === 'LOSS' && (
                        <span className={`${CHIP} text-slate-400 bg-slate-800/80 border-slate-700`}>
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          이번엔 여론과 달랐어요
                        </span>
                      )}

                      {/* Tone 4: 조기 정리 완료 */}
                      {settleType === 'EARLY_EXIT' && (
                        <span className={`${CHIP} text-sky-300 bg-sky-500/10 border-sky-500/30`}>
                          <span className="material-symbols-outlined text-sm">logout</span>
                          조기 정리 완료
                        </span>
                      )}
                    </div>

                    <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                      정산 {vote.settledDate || vote.date}
                    </span>
                  </div>

                  {/* Title — 2026-09-27: 12 → 15px (진행중 카드와 통일) */}
                  <h3 className="text-[15px] font-bold text-white leading-snug break-keep">
                    {vote.title}
                  </h3>

                  {/* Summary Box — 2026-09-27: "투표: YES (500 DP 투입)" 한 줄 → 선택 칩 + 투입 / 정산 결과 2행 */}
                  <div className="bg-[#0D1B2A] p-3.5 rounded-xl border border-[#1F334D] flex flex-col gap-2.5 tabular-nums">
                    <Row label="선택 및 투입">
                      <span className="inline-flex items-center gap-2">
                        <ChoiceChip choice={vote.choice} />
                        <span className="font-bold">{vote.amountDp.toLocaleString()} DP</span>
                      </span>
                    </Row>
                    <Row label="정산 결과" className="pt-2.5 border-t border-[#1F334D]">
                      {settleType === 'MAJORITY_WIN' && (
                        <span className="text-sm font-extrabold text-emerald-300">+{payout.toLocaleString()} DP</span>
                      )}
                      {settleType === 'MINORITY_WIN' && (
                        <span className="text-sm font-extrabold text-[#E2C28E]">+{payout.toLocaleString()} DP</span>
                      )}
                      {settleType === 'LOSS' && (
                        <span className="text-sm font-bold text-slate-400">-{vote.amountDp.toLocaleString()} DP</span>
                      )}
                      {settleType === 'EARLY_EXIT' && (
                        <span className="text-sm font-bold text-sky-300">{signed(payout)} DP</span>
                      )}
                    </Row>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Early Exit Confirmation Modal — 2026-09-27: font-mono·콜론·그림자 제거, 버튼 h-12 */}
      {exitTargetVote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059]/60 rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E] mx-auto">
              <span className="material-symbols-outlined text-2xl">published_with_changes</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">포지션 조기 정리</h3>
              <p className="text-[13px] text-slate-300 mt-1.5 leading-relaxed break-keep tabular-nums">
                현재 시점 기준으로 포지션을 정리하시겠습니까?<br />
                정리 시 <span className="text-[#E2C28E] font-bold whitespace-nowrap">{exitReturnOf(exitTargetVote).toLocaleString()} DP</span>가 즉시 반환되고 결과 대기는 종료됩니다.
              </p>
            </div>

            {/* Price / Return Details */}
            <div className="w-full bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#1F334D] text-left flex flex-col gap-2.5 tabular-nums">
              <Row label="투입 원금">
                <span className="font-bold">{exitTargetVote.amountDp.toLocaleString()} DP</span>
              </Row>
              <Row label="잠재 손익">
                <span className={`font-bold ${(exitTargetVote.unrealizedPnlDp ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {signed(exitTargetVote.unrealizedPnlDp ?? 0)} DP
                </span>
              </Row>
              <Row label="즉시 반환액" className="pt-2.5 border-t border-[#1F334D]">
                <span className="text-base font-extrabold text-[#E2C28E]">
                  {exitReturnOf(exitTargetVote).toLocaleString()} DP
                </span>
              </Row>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExitTargetVote(null)}
                className="h-12 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-300 font-bold text-sm hover:bg-[#1E2E44] transition"
              >
                유지하기
              </button>
              <button
                type="button"
                onClick={handleConfirmEarlyExit}
                className="h-12 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm hover:brightness-110 active:scale-[0.98] transition"
              >
                지금 정리 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
