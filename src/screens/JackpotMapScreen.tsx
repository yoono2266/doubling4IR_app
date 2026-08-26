import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HOTELS_JACKPOT_DATA, HotelJackpotData, RegionCode, formatUsd, formatKrw } from '../data/jackpotData';

const REGIONS: { code: RegionCode; label: string; count: number }[] = [
  { code: 'ALL', label: 'ALL', count: 18 },
  { code: 'KR', label: 'KR', count: 3 },
  { code: 'MO', label: 'MO', count: 7 },
  { code: 'SG', label: 'SG', count: 2 },
  { code: 'PH', label: 'PH', count: 5 },
  { code: 'JP', label: 'JP', count: 1 },
];

export const JackpotMapScreen: React.FC = () => {
  const { setSelectedHotelId, setCurrentSubScreen } = useApp();
  const [activeRegion, setActiveRegion] = useState<RegionCode>('ALL');

  // Filter hotels by active region
  const filteredHotels = useMemo(() => {
    if (activeRegion === 'ALL') {
      return HOTELS_JACKPOT_DATA;
    }
    return HOTELS_JACKPOT_DATA.filter(h => h.region === activeRegion);
  }, [activeRegion]);

  // Total jackpot sum for filtered hotels
  const totalRegionJackpot = useMemo(() => {
    return filteredHotels.reduce((sum, h) => sum + h.totalJackpotUsd, 0);
  }, [filteredHotels]);

  // Navigate to hotel jackpot detail screen
  const handleHotelClick = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setCurrentSubScreen('hotel-jackpot-detail');
  };

  // Sort hotels by total jackpot descending for display
  const sortedHotels = useMemo(() => {
    return [...filteredHotels].sort((a, b) => b.totalJackpotUsd - a.totalJackpotUsd);
  }, [filteredHotels]);

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Page Title Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">grid_view</span>
            Jackpot Tree-map
          </h2>
          <p className="text-xs text-slate-400">아시아 주요 카지노 & 리조트 누적 잭팟 시각화</p>
        </div>
        <span className="text-xs font-mono font-bold text-[#E2C28E] bg-[#162639] px-2.5 py-1 rounded-full border border-[#C5A059]/30">
          TREEMAP
        </span>
      </div>

      {/* 1. Region Filter Tabs (ALL / KR / MO / SG / PH / JP) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#162639] rounded-xl border border-[#1F334D] overflow-x-auto no-scrollbar">
        {REGIONS.map((reg) => {
          const isActive = activeRegion === reg.code;
          return (
            <button
              key={reg.code}
              onClick={() => setActiveRegion(reg.code)}
              className={`flex-1 min-w-[54px] py-2 rounded-lg text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? 'bg-[#C5A059] text-[#0D1B2A] shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-[#0D1B2A]'
              }`}
            >
              <span>{reg.label}</span>
              <span className={`text-[9px] font-mono font-semibold ${isActive ? 'text-[#0D1B2A]/80' : 'text-slate-500'}`}>
                {reg.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Region Summary Bar */}
      <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            {activeRegion === 'ALL' ? '아시아 전체 18개 호텔' : `${activeRegion} 지역 ${filteredHotels.length}개 호텔`}
          </span>
          <span className="text-[10px] text-[#C5A059] font-mono bg-[#C5A059]/10 px-2 py-0.5 rounded">
            합계 {formatUsd(totalRegionJackpot)}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {formatKrw(totalRegionJackpot)}
        </span>
      </div>

      {/* 2. Treemap (Mosaic) Visualization Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            잭팟 규모 트리맵 (터치 시 상세 잭팟 이동)
          </span>
          <span className="text-[10px] text-slate-500">타일 크기: 잭팟 총액 비례</span>
        </div>

        {/* Dynamic Responsive Treemap Layout */}
        {activeRegion === 'ALL' ? (
          /* ALL Region 18 Hotels Treemap */
          <div className="grid grid-cols-12 gap-1.5 h-80 w-full bg-[#0D1B2A] p-2 rounded-2xl border border-[#1F334D]">
            {/* Top 1: Okada Manila ($53.7M - Largest Tile) */}
            <button
              onClick={() => handleHotelClick(sortedHotels[0].id)}
              className="col-span-7 row-span-2 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden text-left border border-[#C5A059]/60 hover:border-[#C5A059] bg-[#1a2839] group transition"
            >
              <img
                src={sortedHotels[0].image}
                alt={sortedHotels[0].name}
                className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/40 to-transparent"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-2 py-0.5 rounded shadow">
                  #1 {sortedHotels[0].region}
                </span>
                <span className="text-[10px] font-mono text-[#E2C28E]">
                  {((sortedHotels[0].totalJackpotUsd / totalRegionJackpot) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-black text-white line-clamp-1">{sortedHotels[0].name}</h3>
                <p className="text-sm font-black text-[#E2C28E] font-mono mt-0.5">
                  {formatUsd(sortedHotels[0].totalJackpotUsd)}
                </p>
                <p className="text-[9px] text-slate-300 font-mono">
                  {formatKrw(sortedHotels[0].totalJackpotUsd)}
                </p>
              </div>
            </button>

            {/* Top 2: Marina Bay Sands ($40.8M) */}
            <button
              onClick={() => handleHotelClick(sortedHotels[1].id)}
              className="col-span-5 row-span-1 rounded-xl p-2 flex flex-col justify-between relative overflow-hidden text-left border border-[#1F334D] hover:border-[#C5A059]/60 bg-[#162639] group transition"
            >
              <img
                src={sortedHotels[1].image}
                alt={sortedHotels[1].name}
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition"
                referrerPolicy="no-referrer"
              />
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-[9px] font-bold text-[#E2C28E] bg-[#C5A059]/20 px-1.5 py-0.2 rounded">
                  #2 {sortedHotels[1].region}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {((sortedHotels[1].totalJackpotUsd / totalRegionJackpot) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative z-10">
                <h4 className="text-[11px] font-bold text-white line-clamp-1">{sortedHotels[1].name}</h4>
                <p className="text-xs font-bold text-[#E2C28E] font-mono">
                  {formatUsd(sortedHotels[1].totalJackpotUsd)}
                </p>
              </div>
            </button>

            {/* Top 3: Galaxy Macau ($38.7M) */}
            <button
              onClick={() => handleHotelClick(sortedHotels[2].id)}
              className="col-span-5 row-span-1 rounded-xl p-2 flex flex-col justify-between relative overflow-hidden text-left border border-[#1F334D] hover:border-[#C5A059]/60 bg-[#162639] group transition"
            >
              <img
                src={sortedHotels[2].image}
                alt={sortedHotels[2].name}
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition"
                referrerPolicy="no-referrer"
              />
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-300 bg-[#0D1B2A] px-1.5 py-0.2 rounded">
                  #3 {sortedHotels[2].region}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {((sortedHotels[2].totalJackpotUsd / totalRegionJackpot) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative z-10">
                <h4 className="text-[11px] font-bold text-white line-clamp-1">{sortedHotels[2].name}</h4>
                <p className="text-xs font-bold text-[#E2C28E] font-mono">
                  {formatUsd(sortedHotels[2].totalJackpotUsd)}
                </p>
              </div>
            </button>

            {/* Top 4 ~ 6 Mid Tiles */}
            {sortedHotels.slice(3, 6).map((h, idx) => (
              <button
                key={h.id}
                onClick={() => handleHotelClick(h.id)}
                className="col-span-4 rounded-lg p-2 flex flex-col justify-between text-left border border-[#1F334D] hover:border-[#C5A059]/50 bg-[#142336] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-[#C5A059]">{h.region}</span>
                  <span className="text-[8px] text-slate-400 font-mono">#{idx + 4}</span>
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-white truncate">{h.name}</h5>
                  <p className="text-[10px] font-bold text-[#E2C28E] font-mono">{formatUsd(h.totalJackpotUsd)}</p>
                </div>
              </button>
            ))}

            {/* Top 7 ~ 18 Mini Grid */}
            <div className="col-span-12 grid grid-cols-6 gap-1">
              {sortedHotels.slice(6, 18).map((h, idx) => (
                <button
                  key={h.id}
                  onClick={() => handleHotelClick(h.id)}
                  className="rounded p-1 text-center bg-[#0E1A29] hover:bg-[#162639] border border-[#1F334D]/60 transition"
                  title={`${h.name} (${h.region}) - ${formatUsd(h.totalJackpotUsd)}`}
                >
                  <span className="text-[8px] text-slate-400 block truncate">
                    {h.region} • {h.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-[#E2C28E] block">
                    ${(h.totalJackpotUsd / 1_000_000).toFixed(1)}M
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Single Region Treemap */
          <div className="grid grid-cols-2 gap-2 min-h-56 w-full bg-[#0D1B2A] p-2.5 rounded-2xl border border-[#1F334D]">
            {/* Region #1 Big Tile */}
            <button
              onClick={() => handleHotelClick(sortedHotels[0].id)}
              className={`col-span-2 rounded-xl p-3.5 flex flex-col justify-between text-left relative overflow-hidden border border-[#C5A059]/60 hover:border-[#C5A059] bg-[#1a2839] group transition ${
                sortedHotels.length === 1 ? 'min-h-44' : 'h-36'
              }`}
            >
              <img
                src={sortedHotels[0].image}
                alt={sortedHotels[0].name}
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/40 to-transparent"></div>

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-2 py-0.5 rounded shadow">
                  {sortedHotels[0].region} 1위
                </span>
                <span className="text-xs font-mono font-bold text-[#E2C28E]">
                  {((sortedHotels[0].totalJackpotUsd / totalRegionJackpot) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-black text-white">{sortedHotels[0].name}</h3>
                <p className="text-xs text-slate-300 line-clamp-1">{sortedHotels[0].desc}</p>
                <p className="text-base font-black text-[#E2C28E] font-mono mt-1">
                  {formatUsd(sortedHotels[0].totalJackpotUsd)}
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  {formatKrw(sortedHotels[0].totalJackpotUsd)}
                </p>
              </div>
            </button>

            {/* Other hotels in the region */}
            {sortedHotels.slice(1).map((h, idx) => (
              <button
                key={h.id}
                onClick={() => handleHotelClick(h.id)}
                className={`rounded-xl p-3 flex flex-col justify-between text-left relative overflow-hidden border border-[#1F334D] hover:border-[#C5A059]/60 bg-[#162639] group transition ${
                  sortedHotels.length % 2 === 0 && idx === sortedHotels.length - 2 ? 'col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-300 bg-[#0D1B2A] px-1.5 py-0.2 rounded">
                    #{idx + 2} {h.region}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {((h.totalJackpotUsd / totalRegionJackpot) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-white truncate">{h.name}</h4>
                  <p className="text-xs font-bold text-[#E2C28E] font-mono mt-0.5">
                    {formatUsd(h.totalJackpotUsd)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    {formatKrw(h.totalJackpotUsd)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Major Casinos List Section */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">list_alt</span>
            <span>
              {activeRegion === 'ALL' ? '전체 카지노 목록 (18개)' : `${activeRegion} 카지노 목록 (${filteredHotels.length}개)`}
            </span>
          </h3>
          <span className="text-[11px] text-[#C5A059] font-mono">누적 잭팟 순</span>
        </div>

        <div className="space-y-2.5">
          {sortedHotels.map((h, idx) => (
            <div
              key={h.id}
              onClick={() => handleHotelClick(h.id)}
              className="bg-[#162639] border border-[#1F334D] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-[#C5A059]/60 transition shadow-md group"
            >
              <div className="flex items-center gap-3 overflow-hidden pr-2">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#1F334D]">
                  <img
                    src={h.image}
                    alt={h.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-0.5 left-0.5 bg-[#0D1B2A]/90 text-[#C5A059] font-extrabold text-[8px] px-1 rounded">
                    {h.region}
                  </span>
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E2C28E] transition">
                      {h.name}
                    </h4>
                    {h.badge && (
                      <span className="text-[8px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-1.5 py-0.2 rounded shrink-0">
                        {h.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{h.desc}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="text-[#C5A059] font-semibold">잭팟 {h.jackpots.length}개</span>
                    <span>•</span>
                    <span>{h.regionLabel}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-[#E2C28E] font-mono block">
                  {formatUsd(h.totalJackpotUsd)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {formatKrw(h.totalJackpotUsd)}
                </span>
                <span className="text-[9px] text-[#C5A059] font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                  <span>상세보기</span>
                  <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
