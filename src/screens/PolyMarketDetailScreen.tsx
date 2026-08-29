import React, { useState } from 'react';
import { useApp } from '../context/AppContext';


export const PolyMarketDetailScreen: React.FC = () => {
  const {
    selectedMarket,
    setCurrentSubScreen,
    castPolyVote,
    getUserVoteForMarket,
    user,
    showToast,
    requireLogin
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'news'>('rules');
  const [confirmModalData, setConfirmModalData] = useState<{
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
  } | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
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

  const handleOpenVoteModal = (choice: string, odds: string) => {
    if (!requireLogin()) return;
    const isRevote = !!existingVote && existingVote.choice !== choice;
    setConfirmModalData({
      choice,
      odds,
      isRevote,
      prevChoice: existingVote?.choice
    });
  };

  const handleConfirmVote = () => {
    if (!confirmModalData) return;
    const res = castPolyVote(
      selectedMarket.id,
      selectedMarket.title,
      selectedMarket.category,
      confirmModalData.choice,
      confirmModalData.odds
    );

    if (res.success) {
      setSuccessModalData({
        choice: confirmModalData.choice,
        odds: confirmModalData.odds,
        isRevote: res.isRevote,
        prevChoice: res.prevChoice
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
          <span className="text-[10px] text-slate-400 font-medium">보유:</span>
          <span className="text-xs font-bold text-[#E2C28E] font-mono">
            {user.walletDp.toLocaleString()} DP
          </span>
        </div>
      </div>

      {/* Market Header Summary Box */}
      <div className="bg-[#162639] border border-[#C5A059]/50 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2.5 py-0.5 rounded border border-[#C5A059]/30 uppercase">
              {selectedMarket.category}
            </span>
            {selectedMarket.leagueName && (
              <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D]">
                <span className="material-symbols-outlined text-xs text-[#C5A059]">
                  {selectedMarket.leagueIcon || 'emoji_events'}
                </span>
                {selectedMarket.leagueName}
              </span>
            )}
          </div>
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
              {existingVote.choice} (100 DP)
            </span>
          </div>
        )}

        {/* Multi-Candidate Vote List (Type A) OR Yes/No Buttons (Type B) */}
        {selectedMarket.type === 'sports' && selectedMarket.candidates ? (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span>후보 클럽 / 선수</span>
              <span>배당률 & 100DP 투표</span>
            </div>
            {selectedMarket.candidates.map((cand) => {
              const noPercent = 100 - cand.percent;
              const noOdds = `${noPercent}%`;
              const isYesVoted = existingVote?.choice === `${cand.name} (YES)` || existingVote?.choice === cand.name;
              const isNoVoted = existingVote?.choice === `${cand.name} (NO)`;

              return (
                <div
                  key={cand.id}
                  className={`p-3 rounded-xl border transition flex flex-col gap-2.5 ${
                    isYesVoted || isNoVoted
                      ? 'bg-[#0D1B2A] border-[#C5A059] ring-1 ring-[#C5A059]'
                      : 'bg-[#0D1B2A]/80 border-[#1F334D] hover:border-[#C5A059]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(isYesVoted || isNoVoted) && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                          isYesVoted ? 'bg-emerald-500 text-[#0D1B2A]' : 'bg-rose-500 text-white'
                        }`}>
                          {isYesVoted ? 'YES 선택중' : 'NO 선택중'}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">{cand.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-xs font-extrabold text-[#E2C28E] bg-[#162639] px-2 py-0.5 rounded border border-[#1F334D]">
                        {cand.odds}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#162639] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#C5A059] to-[#E2C28E] h-full rounded-full transition-all"
                      style={{ width: `${cand.percent}%` }}
                    />
                  </div>

                  {/* YES / NO Buttons for Candidate */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => handleOpenVoteModal(`${cand.name} (YES)`, cand.odds)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-98 ${
                        isYesVoted
                          ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400 font-extrabold shadow-sm'
                          : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      <span>YES {cand.odds}</span>
                    </button>
                    <button
                      onClick={() => handleOpenVoteModal(`${cand.name} (NO)`, noOdds)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-98 ${
                        isNoVoted
                          ? 'bg-rose-500 text-white border-rose-400 font-extrabold shadow-sm'
                          : 'bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                      }`}
                    >
                      <span>NO {noOdds}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {/* Visual Probability Bar */}
            <div className="flex justify-between text-xs font-bold font-mono px-1">
              <span className="text-emerald-400">YES {selectedMarket.yesOdds}</span>
              <span className="text-rose-400">NO {selectedMarket.noOdds}</span>
            </div>
            <div className="w-full bg-[#0D1B2A] h-2.5 rounded-full overflow-hidden flex border border-[#1F334D]">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${selectedMarket.yesValue || 50}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${selectedMarket.noValue || 50}%` }}
              />
            </div>

            {/* YES / NO Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => handleOpenVoteModal('YES', selectedMarket.yesOdds || '50%')}
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
                onClick={() => handleOpenVoteModal('NO', selectedMarket.noOdds || '50%')}
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
        )}
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

      {/* Read-Only Mock Comments Section */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-base">forum</span>
            <span>참여자 실시간 토론 & 의견</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {selectedMarket.comments.length}개의 분석 의견
          </span>
        </div>

        <div className="space-y-2.5">
          {selectedMarket.comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] flex flex-col gap-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-6 h-6 rounded-full object-cover border border-[#C5A059]/40"
                  />
                  <span className="font-bold text-white">{comment.author}</span>
                  {comment.choice && (
                    <span className="text-[10px] font-bold text-[#E2C28E] bg-[#C5A059]/15 px-1.5 py-0.2 rounded border border-[#C5A059]/30">
                      픽: {comment.choice}
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
      </div>

      {/* Confirmation Modal */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#C5A059]">how_to_vote</span>
                {confirmModalData.isRevote ? '투표 변경 확인' : '폴리마켓 투표 확인'}
              </h3>
              <button
                onClick={() => setConfirmModalData(null)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">{selectedMarket.title}</p>
              
              {confirmModalData.isRevote ? (
                <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#C5A059]/40 space-y-1.5">
                  <p className="text-[11px] text-amber-300 font-medium">
                    ⚠️ 기존 투표 선택지를 변경합니다:
                  </p>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-400">기존 선택:</span>
                    <span className="text-rose-400 line-through">{confirmModalData.prevChoice}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-white">신규 변경:</span>
                    <span className="text-emerald-400 text-sm">{confirmModalData.choice} ({confirmModalData.odds})</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-[#1F334D]">
                    * 재투표는 보유 중인 100 DP 투표 포지션 내에서 변경 적용됩니다.
                  </p>
                </div>
              ) : (
                <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">투표 선택지:</span>
                    <span className="font-extrabold text-[#E2C28E] text-sm">
                      {confirmModalData.choice} ({confirmModalData.odds})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">투표 차감 금액:</span>
                    <span className="font-mono font-extrabold text-[#FFF0D0]">100 DP (고정)</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#1F334D]">
                    <span className="text-slate-400">투표 후 예상 잔액:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(user.walletDp - 100).toLocaleString()} DP
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setConfirmModalData(null)}
                className="py-2.5 rounded-xl bg-[#0D1B2A] border border-[#1F334D] text-slate-300 font-bold text-xs hover:bg-[#162639]"
              >
                취소
              </button>
              <button
                onClick={handleConfirmVote}
                className="py-2.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition"
              >
                {confirmModalData.isRevote ? '변경 확정' : '100 DP 지불 투표'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Screen Modal */}
      {successModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl shadow-lg">
              ✓
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                {successModalData.isRevote ? '투표 변경 완료!' : '폴리마켓 투표 참여 완료!'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {successModalData.isRevote
                  ? `[${successModalData.choice}]로 성공적으로 변경되었습니다.`
                  : '100 DP가 차감되어 정상적으로 예측 마켓에 등록되었습니다.'}
              </p>
            </div>

            <div className="w-full bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#1F334D] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">마켓:</span>
                <span className="font-bold text-white truncate max-w-[180px]">{selectedMarket.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">선택한 결과:</span>
                <span className="font-extrabold text-[#E2C28E]">{successModalData.choice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">투표 금액:</span>
                <span className="font-mono font-bold text-white">100 DP</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#1F334D]">
                <span className="text-slate-400">현재 보유 잔액:</span>
                <span className="font-mono font-extrabold text-emerald-400">
                  {user.walletDp.toLocaleString()} DP
                </span>
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
