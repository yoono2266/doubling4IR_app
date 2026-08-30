import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatUsd, formatKrw } from '../data/jackpotData';
import { SOLAIRE_JACKPOT_HISTORY } from '../data/jackpotHistoryData';

export const JackpotHistoryScreen: React.FC = () => {
  const { setCurrentSubScreen } = useApp();

  const records = SOLAIRE_JACKPOT_HISTORY;

  const totalWonUsd = useMemo(
    () => records.reduce((sum, r) => sum + r.amountUsd, 0),
    [records]
  );

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2 animate-in fade-in duration-200">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentSubScreen('hotel-jackpot-detail')}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 bg-[#162639] border border-[#1F334D] px-3 py-1.5 rounded-full transition hover:border-[#C5A059]/50"
        >
          <span className="material-symbols-outlined text-sm text-[#C5A059]">arrow_back</span>
          <span>솔레어 리조트 앤 카지노로 돌아가기</span>
        </button>

        <span className="text-[10px] font-bold text-[#E2C28E] bg-[#C5A059]/15 border border-[#C5A059]/30 px-2.5 py-1 rounded-full uppercase">
          PH • 필리핀 마닐라
        </span>
      </div>

      {/* Header */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#C5A059] text-base">history</span>
          <h1 className="text-sm font-bold text-white tracking-tight">Jackpot History</h1>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-3">
          솔레어 리조트 앤 카지노에서 터진 역대 잭팟 당첨 기록입니다. 당첨 일시 · 획득 금액 · 게임 이름 · 배팅 금액 · 슬롯 넘버 · 획득자 국적을 확인할 수 있습니다.
        </p>

        <div className="grid grid-cols-2 gap-2 bg-[#0D1B2A] p-3 rounded-xl border border-[#C5A059]/30">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">누적 당첨 건수</span>
            <p className="text-lg font-black text-white font-mono tracking-tight mt-0.5">
              {records.length}건
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">누적 당첨금 합계</span>
            <p className="text-sm font-black text-[#E2C28E] font-mono mt-1">
              {formatUsd(totalWonUsd)}
            </p>
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">format_list_numbered</span>
            <span>당첨 내역 ({records.length})</span>
          </h3>
          <span className="text-[11px] text-[#C5A059] font-mono">최신순</span>
        </div>

        <div className="space-y-2.5">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md"
            >
              {/* Top: 언제 + 얼마 */}
              <div className="flex items-start justify-between gap-2 border-b border-[#1F334D]/70 pb-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <span className="material-symbols-outlined text-[13px] text-[#C5A059]">schedule</span>
                  <span>{r.wonAt}</span>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-[#E2C28E] font-mono leading-tight">
                    {formatUsd(r.amountUsd)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">{formatKrw(r.amountUsd)}</p>
                </div>
              </div>

              {/* 게임 이름 */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E2C28E] text-lg shrink-0">casino</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{r.gameName}</h4>
                  <span className="text-[10px] text-slate-400">{r.gameType}</span>
                </div>
              </div>

              {/* 배팅금액 / 슬롯넘버 / 획득자 국적 */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-2">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">배팅 금액</span>
                  <p className="text-xs font-bold text-white font-mono mt-0.5">
                    ${r.betUsd.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-2">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">슬롯 넘버</span>
                  <p className="text-xs font-bold text-white font-mono mt-0.5">{r.slotNo}</p>
                </div>
                <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-2">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">획득자 국적</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    <span className="mr-0.5">{r.flag}</span>
                    {r.nationality}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
