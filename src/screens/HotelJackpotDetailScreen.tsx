import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HOTELS_JACKPOT_DATA, HotelJackpotData, formatUsd, formatKrw, JackpotItem } from '../data/jackpotData';

interface HotelJackpotDetailScreenProps {
  hotelId?: string;
  onBack?: () => void;
}

export const HotelJackpotDetailScreen: React.FC<HotelJackpotDetailScreenProps> = ({ hotelId, onBack }) => {
  const { selectedHotelId, setCurrentSubScreen, startBooking } = useApp();
  const targetId = hotelId || selectedHotelId || 'okada';

  const hotel: HotelJackpotData = useMemo(() => {
    return HOTELS_JACKPOT_DATA.find(h => h.id === targetId) || HOTELS_JACKPOT_DATA.find(h => h.id === 'okada')!;
  }, [targetId]);

  const [selectedJackpotId, setSelectedJackpotId] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentSubScreen(null);
    }
  };

  const totalJackpotSum = useMemo(() => {
    return hotel.jackpots.reduce((sum, item) => sum + item.amountUsd, 0);
  }, [hotel]);

  // Sort jackpots by amount descending
  const sortedJackpots = useMemo(() => {
    return [...hotel.jackpots].sort((a, b) => b.amountUsd - a.amountUsd);
  }, [hotel]);

  // Selected jackpot details
  const activeJackpot = useMemo(() => {
    if (!selectedJackpotId) return sortedJackpots[0];
    return sortedJackpots.find(j => j.id === selectedJackpotId) || sortedJackpots[0];
  }, [selectedJackpotId, sortedJackpots]);

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2 animate-in fade-in duration-200">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 bg-[#162639] border border-[#1F334D] px-3 py-1.5 rounded-full transition hover:border-[#C5A059]/50"
        >
          <span className="material-symbols-outlined text-sm text-[#C5A059]">arrow_back</span>
          <span>전체 잭팟 목록으로 돌아가기</span>
        </button>

        <span className="text-[10px] font-bold text-[#E2C28E] bg-[#C5A059]/15 border border-[#C5A059]/30 px-2.5 py-1 rounded-full uppercase">
          {hotel.region} • {hotel.regionLabel}
        </span>
      </div>

      {/* Hotel Hero Card */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl overflow-hidden shadow-xl">
        <div className="relative h-44 w-full">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#162639] via-[#162639]/40 to-transparent"></div>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {hotel.badge && (
                <span className="bg-[#C5A059] text-[#0D1B2A] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow">
                  {hotel.badge}
                </span>
              )}
              <span className="bg-black/60 backdrop-blur-sm text-[#E2C28E] border border-[#C5A059]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                잭팟 {hotel.jackpots.length}개 보유
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#0D1B2A]/90 px-2 py-1 rounded border border-[#C5A059]/30 text-amber-400 font-bold text-xs">
              <span className="material-symbols-outlined text-xs fill-1">star</span>
              <span>{hotel.rating}</span>
            </div>
          </div>

          {/* Bottom Title Info */}
          <div className="absolute bottom-3 left-4 right-4">
            <h1 className="text-xl font-black text-white tracking-tight drop-shadow-md">
              {hotel.name}
            </h1>
            <p className="text-xs text-slate-300 font-medium">{hotel.nameEn}</p>
          </div>
        </div>

        {/* Description & Overview */}
        <div className="p-4 flex flex-col gap-3">
          <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-3">
            <p className="text-xs text-slate-200 leading-relaxed">
              {hotel.desc}
            </p>
          </div>

          {/* Total Jackpot Summary Box */}
          <div className="grid grid-cols-2 gap-2 bg-[#0D1B2A] p-3 rounded-xl border border-[#C5A059]/30">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">호텔 누적 잭팟 총합</span>
              <p className="text-lg font-black text-[#E2C28E] font-mono tracking-tight mt-0.5">
                {formatUsd(totalJackpotSum)}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">한화 환산</span>
              <p className="text-xs font-bold text-slate-200 mt-1 font-mono">
                {formatKrw(totalJackpotSum)}
              </p>
            </div>
          </div>

          {/* Facilities */}
          {(hotel.vipTables || hotel.slots) && (
            <div className="flex items-center justify-between text-xs text-slate-300 px-1 pt-1 border-t border-[#1F334D]/60">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#C5A059]">table_restaurant</span>
                <span>VIP 테이블: <strong className="text-white">{hotel.vipTables}개</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#C5A059]">sports_esports</span>
                <span>슬롯 머신: <strong className="text-white">{hotel.slots}대</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hotel Internal Treemap Section */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-base">dashboard</span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              호텔 내부 잭팟 트리맵 ({hotel.jackpots.length}개 게임)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">금액 비례 시각화</span>
        </div>

        {/* Dynamic Treemap Grid depending on count */}
        {sortedJackpots.length >= 10 ? (
          /* Flagship Treemap Layout (15 items) */
          <div className="grid grid-cols-6 gap-1.5 w-full bg-[#0D1B2A] p-2 rounded-xl border border-[#1F334D]/80">
            {/* #1 Mega Jackpot (Top Left Big Box) */}
            <button
              onClick={() => setSelectedJackpotId(sortedJackpots[0].id)}
              className={`col-span-4 row-span-2 rounded-lg p-2.5 flex flex-col justify-between text-left transition relative overflow-hidden group ${
                activeJackpot.id === sortedJackpots[0].id
                  ? 'bg-gradient-to-br from-[#223B59] to-[#122338] border-2 border-[#C5A059] shadow-lg ring-1 ring-[#C5A059]'
                  : 'bg-[#182C44] border border-[#234063] hover:border-[#C5A059]/60'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-1.5 py-0.2 rounded shadow">
                  #1 {sortedJackpots[0].badge || 'MEGA'}
                </span>
                <span className="text-[9px] text-[#E2C28E] font-mono">{((sortedJackpots[0].amountUsd / totalJackpotSum) * 100).toFixed(1)}%</span>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-[#E2C28E] transition">
                  {sortedJackpots[0].name}
                </h4>
                <p className="text-sm font-black text-[#E2C28E] font-mono mt-0.5">
                  {formatUsd(sortedJackpots[0].amountUsd)}
                </p>
                <p className="text-[9px] text-slate-300 font-mono">
                  {formatKrw(sortedJackpots[0].amountUsd)}
                </p>
              </div>
            </button>

            {/* #2 (Top Right Box) */}
            <button
              onClick={() => setSelectedJackpotId(sortedJackpots[1].id)}
              className={`col-span-2 row-span-1 rounded-lg p-2 flex flex-col justify-between text-left transition ${
                activeJackpot.id === sortedJackpots[1].id
                  ? 'bg-[#223B59] border-2 border-[#C5A059]'
                  : 'bg-[#15253A] border border-[#1F334D] hover:border-[#C5A059]/50'
              }`}
            >
              <span className="text-[9px] font-bold text-[#E2C28E] bg-[#C5A059]/20 px-1 rounded w-fit">
                #2 {sortedJackpots[1].badge || 'HOT'}
              </span>
              <div>
                <h4 className="text-[11px] font-bold text-white line-clamp-1">{sortedJackpots[1].name}</h4>
                <p className="text-xs font-bold text-[#E2C28E] font-mono">{formatUsd(sortedJackpots[1].amountUsd)}</p>
              </div>
            </button>

            {/* #3 */}
            <button
              onClick={() => setSelectedJackpotId(sortedJackpots[2].id)}
              className={`col-span-2 row-span-1 rounded-lg p-2 flex flex-col justify-between text-left transition ${
                activeJackpot.id === sortedJackpots[2].id
                  ? 'bg-[#223B59] border-2 border-[#C5A059]'
                  : 'bg-[#15253A] border border-[#1F334D] hover:border-[#C5A059]/50'
              }`}
            >
              <span className="text-[9px] font-bold text-slate-300 bg-[#0D1B2A] px-1 rounded w-fit">
                #3
              </span>
              <div>
                <h4 className="text-[10px] font-bold text-white line-clamp-1">{sortedJackpots[2].name}</h4>
                <p className="text-[11px] font-bold text-[#E2C28E] font-mono">{formatUsd(sortedJackpots[2].amountUsd)}</p>
              </div>
            </button>

            {/* #4 ~ #7 Mid size tiles */}
            {sortedJackpots.slice(3, 7).map((jp, idx) => (
              <button
                key={jp.id}
                onClick={() => setSelectedJackpotId(jp.id)}
                className={`col-span-3 rounded-lg p-2 flex items-center justify-between text-left transition ${
                  activeJackpot.id === jp.id
                    ? 'bg-[#223B59] border-2 border-[#C5A059]'
                    : 'bg-[#132235] border border-[#1F334D] hover:border-[#C5A059]/40'
                }`}
              >
                <div className="overflow-hidden pr-1">
                  <span className="text-[9px] text-slate-400 font-mono block">#{idx + 4} {jp.type}</span>
                  <h4 className="text-[10px] font-bold text-white truncate">{jp.name}</h4>
                </div>
                <span className="text-[11px] font-bold text-[#E2C28E] font-mono shrink-0">
                  {formatUsd(jp.amountUsd)}
                </span>
              </button>
            ))}

            {/* #8 ~ #15 Small tiles */}
            <div className="col-span-6 grid grid-cols-4 gap-1">
              {sortedJackpots.slice(7, 15).map((jp, idx) => (
                <button
                  key={jp.id}
                  onClick={() => setSelectedJackpotId(jp.id)}
                  className={`rounded p-1 text-center transition flex flex-col justify-center ${
                    activeJackpot.id === jp.id
                      ? 'bg-[#C5A059] text-[#0D1B2A] font-bold'
                      : 'bg-[#0E1A29] text-slate-300 border border-[#1F334D]/60 hover:bg-[#162639]'
                  }`}
                  title={`${jp.name} - ${formatUsd(jp.amountUsd)}`}
                >
                  <span className="text-[8px] truncate block opacity-80">#{idx + 8} {jp.name.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono font-bold block">{formatUsd(jp.amountUsd)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Treemap Layout (3~5 items) */
          <div className="grid grid-cols-2 gap-2 min-h-48 w-full bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D]/80">
            {/* Top 1 Big */}
            <button
              onClick={() => setSelectedJackpotId(sortedJackpots[0].id)}
              className={`col-span-2 rounded-xl p-3.5 flex flex-col justify-between text-left transition relative ${
                activeJackpot.id === sortedJackpots[0].id
                  ? 'bg-gradient-to-br from-[#223B59] to-[#122338] border-2 border-[#C5A059] shadow-lg'
                  : 'bg-[#182C44] border border-[#234063] hover:border-[#C5A059]/60'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-2 py-0.5 rounded shadow">
                  #1 {sortedJackpots[0].badge || 'MEGA'}
                </span>
                <span className="text-xs text-[#E2C28E] font-mono font-bold">
                  {((sortedJackpots[0].amountUsd / totalJackpotSum) * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{sortedJackpots[0].name}</h4>
                <p className="text-base font-extrabold text-[#E2C28E] font-mono mt-0.5">
                  {formatUsd(sortedJackpots[0].amountUsd)}
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  {formatKrw(sortedJackpots[0].amountUsd)}
                </p>
              </div>
            </button>

            {/* Other 2~4 items */}
            {sortedJackpots.slice(1).map((jp, idx) => (
              <button
                key={jp.id}
                onClick={() => setSelectedJackpotId(jp.id)}
                className={`rounded-xl p-2.5 flex flex-col justify-between text-left transition ${
                  activeJackpot.id === jp.id
                    ? 'bg-[#223B59] border-2 border-[#C5A059]'
                    : 'bg-[#15253A] border border-[#1F334D] hover:border-[#C5A059]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-300 bg-[#0D1B2A] px-1.5 py-0.5 rounded">
                    #{idx + 2} {jp.badge || ''}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {((jp.amountUsd / totalJackpotSum) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-white truncate">{jp.name}</h4>
                  <p className="text-xs font-extrabold text-[#E2C28E] font-mono mt-0.5">
                    {formatUsd(jp.amountUsd)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Jackpot Preview Alert */}
        {activeJackpot && (
          <div className="bg-[#0D1B2A] border border-[#C5A059]/40 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E]">
                <span className="material-symbols-outlined text-base">monetization_on</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{activeJackpot.name}</h4>
                <p className="text-[10px] text-slate-400">{activeJackpot.type || 'Progressive Jackpot'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-[#E2C28E] font-mono block">
                {formatUsd(activeJackpot.amountUsd)}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {formatKrw(activeJackpot.amountUsd)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Jackpot List Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">format_list_numbered</span>
            <span>잭팟 게임 상세 목록 ({sortedJackpots.length})</span>
          </h3>
          <span className="text-[11px] text-[#C5A059] font-mono">금액순 정렬</span>
        </div>

        <div className="space-y-2">
          {sortedJackpots.map((jp, idx) => {
            const isTop3 = idx < 3;
            const isSelected = activeJackpot.id === jp.id;

            return (
              <div
                key={jp.id}
                onClick={() => setSelectedJackpotId(jp.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1E324A] border-[#C5A059] shadow-md ring-1 ring-[#C5A059]/50'
                    : 'bg-[#162639] border-[#1F334D] hover:border-[#C5A059]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      idx === 0
                        ? 'bg-[#C5A059] text-[#0D1B2A] shadow'
                        : idx === 1
                        ? 'bg-slate-300 text-[#0D1B2A]'
                        : idx === 2
                        ? 'bg-[#B08D57] text-[#0D1B2A]'
                        : 'bg-[#0D1B2A] text-slate-400 border border-[#1F334D]'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">{jp.name}</h4>
                      {jp.badge && (
                        <span className="text-[9px] font-bold text-[#0D1B2A] bg-[#C5A059] px-1.5 rounded">
                          {jp.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{jp.type || 'Jackpot Game'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-extrabold text-[#E2C28E] font-mono">
                    {formatUsd(jp.amountUsd)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    {formatKrw(jp.amountUsd)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FreePlay Booking CTA Button */}
      <button
        onClick={() => {
          startBooking({
            name: hotel.name,
            location: hotel.regionLabel,
            roomType: 'VIP Executive Suite',
            pricePerNightUsdt: 600,
            image: hotel.image
          });
        }}
        className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2"
      >
        <span className="material-symbols-outlined text-base">hotel</span>
        <span>{hotel.name} FreePlay 바우처로 VIP 신청하기</span>
      </button>
    </div>
  );
};
