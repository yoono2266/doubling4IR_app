import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PolyMarketItem } from '../data/polyMarketData';

export const PolyMarketScreen: React.FC = () => {
  const {
    polyMarkets,
    castPolyVote,
    getUserVoteForMarket,
    setSelectedMarket,
    setCurrentSubScreen,
    user,
    requireLogin
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal states for vote flow
  const [confirmModalData, setConfirmModalData] = useState<{
    market: PolyMarketItem;
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
  } | null>(null);

  const [resultModalData, setResultModalData] = useState<{
    marketTitle: string;
    choice: string;
    odds: string;
    isRevote: boolean;
    prevChoice?: string;
  } | null>(null);

  const categories = ['ALL', 'Sports', 'Crypto', 'Macro', 'Tech'];

  const filteredMarkets = selectedCategory === 'ALL'
    ? polyMarkets
    : polyMarkets.filter(m => m.category === selectedCategory);

  const handleOpenVoteModal = (m: PolyMarketItem, choice: string, odds: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!requireLogin()) return;
    const existingVote = getUserVoteForMarket(m.id);
    const isRevote = !!existingVote && existingVote.choice !== choice;
    setConfirmModalData({
      market: m,
      choice,
      odds,
      isRevote,
      prevChoice: existingVote?.choice
    });
  };

  const handleConfirmVote = () => {
    if (!confirmModalData) return;
    const { market, choice, odds } = confirmModalData;
    const res = castPolyVote(market.id, market.title, market.category, choice, odds);

    if (res.success) {
      setResultModalData({
        marketTitle: market.title,
        choice,
        odds,
        isRevote: res.isRevote,
        prevChoice: res.prevChoice
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
            폴리 마켓 (Poly Market)
          </h2>
          <p className="text-xs text-slate-400">웹3 기반 예측 마켓 실시간 오즈 & 100 DP 투표</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold block">보유 DP</span>
          <span className="text-xs font-bold text-[#E2C28E] font-mono">
            {user.walletDp.toLocaleString()} DP
          </span>
        </div>
      </div>

      {/* Category Tabs */}
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

      {/* Market Cards List */}
      <div className="space-y-3">
        {filteredMarkets.map((m) => {
          const userVote = getUserVoteForMarket(m.id);

          // Type A: Sports Market Card with Multi-Candidates
          if (m.type === 'sports' && m.candidates) {
            return (
              <div
                key={m.id}
                className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md hover:border-[#C5A059]/50 transition cursor-pointer"
                onClick={() => handleNavigateDetail(m)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2 py-0.5 rounded border border-[#C5A059]/30">
                      {m.category}
                    </span>
                    {m.leagueName && (
                      <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D]">
                        <span className="material-symbols-outlined text-xs text-[#C5A059]">
                          {m.leagueIcon || 'sports_soccer'}
                        </span>
                        {m.leagueName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-[#0D1B2A] px-2 py-1 rounded border border-[#1F334D] whitespace-nowrap">
                    볼륨: {m.totalVolumeDp}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm font-bold text-white hover:text-[#E2C28E] transition leading-snug flex items-center justify-between">
                    <span>{m.title}</span>
                    <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{m.description}</p>
                </div>

                {/* Multi-Candidate List with 2-row Candidate Layout & YES / NO Buttons */}
                <div className="space-y-2 pt-1">
                  {m.candidates.map((cand) => {
                    const noPercent = 100 - cand.percent;
                    const noOdds = `${noPercent}%`;
                    const isYesVoted = userVote?.choice === `${cand.name} (YES)` || userVote?.choice === cand.name;
                    const isNoVoted = userVote?.choice === `${cand.name} (NO)`;

                    return (
                      <div
                        key={cand.id}
                        className={`p-2.5 rounded-xl border transition flex flex-col gap-2 text-xs ${
                          isYesVoted || isNoVoted
                            ? 'bg-[#0D1B2A] border-[#C5A059] ring-1 ring-[#C5A059]/60'
                            : 'bg-[#0D1B2A]/80 border-[#1F334D] hover:border-[#C5A059]/30'
                        }`}
                      >
                        {/* Top Row: Full Candidate Name + Probability/Odds Badge */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isYesVoted ? 'bg-emerald-400' : isNoVoted ? 'bg-rose-400' : 'bg-slate-600'
                              }`}
                            />
                            <span className="text-slate-100 font-bold text-xs truncate">
                              {cand.name}
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-[#E2C28E] bg-[#162639] px-2 py-0.5 rounded border border-[#1F334D] text-[11px] shrink-0">
                            {cand.odds}
                          </span>
                        </div>

                        {/* Bottom Row: YES / NO Action Buttons (Clean & spacious) */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={(e) => handleOpenVoteModal(m, `${cand.name} (YES)`, cand.odds, e)}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap ${
                              isYesVoted
                                ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400 font-black shadow-sm'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                          >
                            <span>YES {cand.odds}</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenVoteModal(m, `${cand.name} (NO)`, noOdds, e)}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 whitespace-nowrap ${
                              isNoVoted
                                ? 'bg-rose-500 text-white border-rose-400 font-black shadow-sm'
                                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                            }`}
                          >
                            <span>NO {noOdds}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Type B: General / Social / Binary Sports Market Card
          return (
            <div
              key={m.id}
              className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md hover:border-[#C5A059]/50 transition cursor-pointer"
              onClick={() => handleNavigateDetail(m)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2 py-0.5 rounded border border-[#C5A059]/30">
                    {m.category}
                  </span>
                  {m.leagueName && (
                    <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1 bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D]">
                      <span className="material-symbols-outlined text-xs text-[#C5A059]">
                        {m.leagueIcon || 'query_stats'}
                      </span>
                      {m.leagueName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-[#0D1B2A] px-2 py-1 rounded border border-[#1F334D] whitespace-nowrap">
                  볼륨: {m.totalVolumeDp}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white hover:text-[#E2C28E] transition leading-snug flex items-center justify-between">
                  <span>{m.title}</span>
                  <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
              </div>

              {/* Voting Visual Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold font-mono mb-1">
                  <span className="text-emerald-400">YES {m.yesOdds}</span>
                  <span className="text-rose-400">NO {m.noOdds}</span>
                </div>
                <div className="w-full bg-[#0D1B2A] h-2.5 rounded-full overflow-hidden flex border border-[#1F334D]">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${m.yesValue || 50}%` }} />
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${m.noValue || 50}%` }} />
                </div>
              </div>

              {/* Working Yes / No Voting Buttons without (100DP) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={(e) => handleOpenVoteModal(m, 'YES', m.yesOdds || '50%', e)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                    userVote?.choice === 'YES'
                      ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400 font-black'
                      : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                  <span>YES {m.yesOdds}</span>
                </button>

                <button
                  onClick={(e) => handleOpenVoteModal(m, 'NO', m.noOdds || '50%', e)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                    userVote?.choice === 'NO'
                      ? 'bg-rose-500 text-white border-rose-400 font-black'
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

      {/* Vote Confirmation Modal */}
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
              <span className="text-[10px] font-bold text-[#C5A059] uppercase">{confirmModalData.market.category}</span>
              <p className="text-white font-bold">{confirmModalData.market.title}</p>

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
                    <span className="text-slate-400">투표 선택:</span>
                    <span className="font-extrabold text-[#E2C28E] text-sm">
                      {confirmModalData.choice} ({confirmModalData.odds})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">차감 DP:</span>
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
      {resultModalData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#162639] border border-[#C5A059] rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl shadow-lg">
              ✓
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                {resultModalData.isRevote ? '투표 변경 완료!' : '폴리마켓 투표 참여 완료!'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {resultModalData.isRevote
                  ? `[${resultModalData.choice}]로 성공적으로 변경되었습니다.`
                  : '100 DP가 차감되어 정상적으로 예측 마켓에 등록되었습니다.'}
              </p>
            </div>

            <div className="w-full bg-[#0D1B2A] p-3.5 rounded-2xl border border-[#1F334D] text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">마켓:</span>
                <span className="font-bold text-white truncate max-w-[180px]">{resultModalData.marketTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">선택한 결과:</span>
                <span className="font-extrabold text-[#E2C28E]">{resultModalData.choice}</span>
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
