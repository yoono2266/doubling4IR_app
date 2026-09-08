import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PolyVote } from '../types';

export const PolyPortfolioHistoryScreen: React.FC = () => {
  const { user, polyVotes, setCurrentTab, setCurrentSubScreen, earlyExitPolyVote } = useApp();

  // Tab State: 'open' (진행중) vs 'settled' (완료)
  const [activeTab, setActiveTab] = useState<'open' | 'settled'>('open');

  // Early Exit Confirmation Modal State
  const [exitTargetVote, setExitTargetVote] = useState<PolyVote | null>(null);

  // Filter positions
  const openPositions = polyVotes.filter(v => v.status === '진행중');
  const settledPositions = polyVotes.filter(v => v.status === '완료');

  // 1. Calculate 3 Summary Metrics
  //保有 DP: user.walletDp
  //진행중 투입액: sum of open positions' amountDp
  const openTotalInvested = openPositions.reduce((acc, v) => acc + (v.amountDp || 0), 0);
  //예상 회수액: sum of open positions' expectedPayoutDp
  const openTotalExpectedPayout = openPositions.reduce((acc, v) => acc + (v.expectedPayoutDp || v.amountDp || 0), 0);

  const handleConfirmEarlyExit = () => {
    if (!exitTargetVote) return;
    earlyExitPolyVote(exitTargetVote.id);
    setExitTargetVote(null);
  };

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

      {/* Screen Title & Quick Link */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-xl">account_balance_wallet</span>
            <span>예측 챌린지 참여 내역</span>
          </h2>
          {/*
            2026-09-09 제거 요청으로 비활성화 (삭제하지 않고 주석 보존).
            사유: 제목 아래 부제 문구를 노출하지 않기로 함.
            [원본 JSX]
            <p className="text-[11px] text-slate-400">오즈 기반 실시간 포지션 관리 및 조기 정리</p>
          */}
        </div>
        <button
          onClick={() => {
            setCurrentTab('poly');
            setCurrentSubScreen(null);
          }}
          className="px-3 py-1.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow hover:brightness-110 active:scale-95 transition"
        >
          챌린지 참여 →
        </button>
      </div>

      {/* 1. 상단 3분할 요약 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {/* Card 1: 보유 DP */}
        <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            보유 DP
          </span>
          <div className="mt-1">
            <span className="text-sm sm:text-base font-black text-[#E2C28E] font-mono leading-tight block">
              {user.walletDp.toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-200/80 font-sans font-semibold">DP 잔액</span>
          </div>
        </div>

        {/* Card 2: 진행중 투입액 */}
        <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-3 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            진행중 투입액
          </span>
          <div className="mt-1">
            <span className="text-sm sm:text-base font-black text-white font-mono leading-tight block">
              {openTotalInvested.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-400 font-sans font-semibold">
              {openPositions.length}개 포지션
            </span>
          </div>
        </div>

        {/* Card 3: 예상 회수액 */}
        <div className="bg-[#162639] border border-emerald-500/40 rounded-2xl p-3 flex flex-col justify-between shadow-md bg-gradient-to-b from-[#162639] to-[#0E232E]">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
            예상 회수액
          </span>
          <div className="mt-1">
            <span className="text-sm sm:text-base font-black text-emerald-400 font-mono leading-tight block">
              약 {openTotalExpectedPayout.toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-300/80 font-sans font-semibold">적중 시 합계</span>
          </div>
        </div>
      </div>

      {/* 2. 탭 전환: 진행중 / 완료(정산됨) */}
      <div className="flex bg-[#0D1B2A] p-1 rounded-xl border border-[#1F334D]">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'open'
              ? 'bg-[#162639] text-[#E2C28E] border border-[#C5A059]/50 shadow-sm font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>진행중</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === 'open' ? 'bg-[#C5A059] text-[#0D1B2A]' : 'bg-[#162639] text-slate-400'
          }`}>
            {openPositions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'settled'
              ? 'bg-[#162639] text-[#E2C28E] border border-[#C5A059]/50 shadow-sm font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>완료(정산됨)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === 'settled' ? 'bg-[#C5A059] text-[#0D1B2A]' : 'bg-[#162639] text-slate-400'
          }`}>
            {settledPositions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: 진행중 포지션 목록 (OPEN) */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {openPositions.length === 0 ? (
            <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-8 text-center flex flex-col items-center gap-2 text-slate-400">
              <span className="material-symbols-outlined text-3xl text-slate-500">hourglass_empty</span>
              <p className="text-xs font-bold text-white">진행중인 예측 포지션이 없습니다.</p>
              <p className="text-[11px] text-slate-400">새로운 예측 챌린지에 투표하고 DP를 획득해보세요!</p>
              <button
                onClick={() => {
                  setCurrentTab('poly');
                  setCurrentSubScreen(null);
                }}
                className="mt-2 px-4 py-2 rounded-xl gold-button-gradient text-[#0D1B2A] font-bold text-xs"
              >
                예측 챌린지 둘러보기
              </button>
            </div>
          ) : (
            openPositions.map((vote) => {
              const pnl = vote.unrealizedPnlDp ?? 0;
              const isProfit = pnl >= 0;
              const exitReturnAmount = Math.max(10, vote.amountDp + pnl);

              return (
                <div 
                  key={vote.id}
                  className="bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/40 rounded-2xl p-4 flex flex-col gap-3 transition shadow-sm"
                >
                  {/* Category & Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#E2C28E] bg-[#C5A059]/15 px-2 py-0.5 rounded border border-[#C5A059]/30">
                      {vote.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      진행중 · {vote.date}
                    </span>
                  </div>

                  {/* Market Title */}
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {vote.title}
                  </h3>

                  {/* Position Details Matrix */}
                  <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] space-y-2 text-xs">
                    {/* Row 1: Choice & Invested Amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">선택 및 투입액</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black font-mono px-1.5 py-0.2 rounded text-[11px] ${
                          vote.choice.includes('YES') 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {vote.choice}
                        </span>
                        <span className="font-mono font-bold text-white">
                          {vote.amountDp.toLocaleString()} DP
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Odds Evolution */}
                    {vote.oddsChangeText && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">여론 변화</span>
                        <span className="font-mono font-semibold text-slate-300">
                          {vote.oddsChangeText}
                        </span>
                      </div>
                    )}

                    {/* Row 3: Expected Payout */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">적중 시 예상 획득</span>
                      <span className="font-mono font-bold text-[#E2C28E]">
                        약 {(vote.expectedPayoutDp || Math.round(vote.amountDp * 1.5)).toLocaleString()} DP
                      </span>
                    </div>

                    {/* Row 4: Potential PnL (Early Exit Standard) */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#1F334D]">
                      <span className="text-slate-400 text-[11px]">현재가 기준 잠재 손익</span>
                      <span className={`font-mono font-black text-xs ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isProfit ? `+${pnl}` : `${pnl}`} DP
                      </span>
                    </div>
                  </div>

                  {/* Early Exit Action Button */}
                  <button
                    onClick={() => setExitTargetVote(vote)}
                    className="w-full py-2.5 rounded-xl bg-[#0D1B2A] border border-[#C5A059]/40 hover:border-[#C5A059] text-[#E2C28E] hover:text-[#FFF0D0] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                  >
                    <span className="material-symbols-outlined text-sm">exit_to_app</span>
                    <span>지금 정리하기 (반환: {exitReturnAmount.toLocaleString()} DP)</span>
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
            <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-8 text-center text-slate-400">
              <p className="text-xs">정산 완료된 포지션 내역이 없습니다.</p>
            </div>
          ) : (
            settledPositions.map((vote) => {
              const settleType = vote.settleType || 'MAJORITY_WIN';
              const payout = vote.settledPayoutDp ?? 0;

              return (
                <div 
                  key={vote.id}
                  className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm"
                >
                  {/* Status Banner with 3 Specific Tones (+ Early Exit) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-300 bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D]">
                        {vote.category}
                      </span>
                      
                      {/* Tone 1: 다수의견 적중 (Green) */}
                      {settleType === 'MAJORITY_WIN' && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          다수의견 적중
                        </span>
                      )}

                      {/* Tone 2: 소수의견 적중 (Gold 강조) */}
                      {settleType === 'MINORITY_WIN' && (
                        <span className="text-[10px] font-black text-[#0D1B2A] gold-button-gradient px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-xs">auto_awesome</span>
                          남다른 시각 적중!
                        </span>
                      )}

                      {/* Tone 3: 예측 실패 (담담한 회색조 톤) */}
                      {settleType === 'LOSS' && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-slate-400">cancel</span>
                          이번엔 여론과 달랐어요
                        </span>
                      )}

                      {/* Tone 4: 조기 정리 완료 */}
                      {settleType === 'EARLY_EXIT' && (
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">logout</span>
                          조기 정리 완료
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      정산: {vote.settledDate || vote.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-bold text-white leading-snug">
                    {vote.title}
                  </h3>

                  {/* Summary Box */}
                  <div className="bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">투표: </span>
                      <span className="font-bold text-slate-200">{vote.choice}</span>
                      <span className="text-slate-500 font-mono ml-1">({vote.amountDp.toLocaleString()} DP 투입)</span>
                    </div>

                    {/* Final Result DP with distinct styling */}
                    <div className="text-right">
                      {settleType === 'MAJORITY_WIN' && (
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          +{payout.toLocaleString()} DP
                        </span>
                      )}
                      {settleType === 'MINORITY_WIN' && (
                        <span className="font-mono font-black text-[#E2C28E] text-sm drop-shadow-[0_1px_5px_rgba(226,194,142,0.4)]">
                          +{payout.toLocaleString()} DP
                        </span>
                      )}
                      {settleType === 'LOSS' && (
                        <span className="font-mono font-semibold text-slate-400 text-sm">
                          -{vote.amountDp.toLocaleString()} DP
                        </span>
                      )}
                      {settleType === 'EARLY_EXIT' && (
                        <span className="font-mono font-bold text-sky-300 text-sm">
                          {payout >= 0 ? `+${payout}` : `${payout}`} DP
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Early Exit Confirmation Modal */}
      {exitTargetVote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059]/60 rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 text-center shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E] mx-auto">
              <span className="material-symbols-outlined text-2xl">published_with_changes</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">포지션 조기 정리</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                현재 시점 기준으로 포지션을 정리하시겠습니까? <br />
                정리 시 <span className="text-[#E2C28E] font-bold font-mono">+{Math.max(10, exitTargetVote.amountDp + (exitTargetVote.unrealizedPnlDp || 0)).toLocaleString()} DP</span>가 즉시 반환되고 결과 대기는 종료됩니다.
              </p>
            </div>

            {/* Price / Return Details */}
            <div className="w-full bg-[#0D1B2A] p-3 rounded-2xl border border-[#1F334D] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">투입 원금:</span>
                <span className="font-mono font-bold text-white">{exitTargetVote.amountDp.toLocaleString()} DP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">잠재 손익:</span>
                <span className={`font-mono font-bold ${
                  (exitTargetVote.unrealizedPnlDp ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {(exitTargetVote.unrealizedPnlDp ?? 0) >= 0 ? `+${exitTargetVote.unrealizedPnlDp}` : exitTargetVote.unrealizedPnlDp} DP
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#1F334D]">
                <span className="text-slate-400">즉시 반환액:</span>
                <span className="font-mono font-black text-[#E2C28E] text-sm">
                  {Math.max(10, exitTargetVote.amountDp + (exitTargetVote.unrealizedPnlDp || 0)).toLocaleString()} DP
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExitTargetVote(null)}
                className="py-3 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#1E2E44] transition"
              >
                유지하기
              </button>
              <button
                onClick={handleConfirmEarlyExit}
                className="py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow hover:brightness-110 active:scale-95 transition"
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
