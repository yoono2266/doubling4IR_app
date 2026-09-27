import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  RegionCode,
  formatUsd,
  formatKrw,
  HotelJackpotData,
  JackpotApiResponse,
  mapRegionCode,
  mapJackpotApiHotels,
} from '../data/jackpotData';
import { apiCommonClient, CommonResponse, ResultCode } from '../utils/apiClient';

// /contents/main-content API 요청/응답 타입
interface MainContentParam {
  jp_index: number;
}

interface Region {
  jp_index: number;
  code: RegionCode;
  label: string;
  count: number;
}

// 순위·비중에 따라 자동 부여되는 동적 뱃지
const getDynamicBadges = (rankIndex: number, sharePercent: number): string[] => {
  const badges: string[] = [];
  if (rankIndex === 0) badges.push('1위');
  else if (rankIndex <= 2) badges.push('TOP');
  if (sharePercent >= 15) badges.push('글로벌 랜드마크');
  return badges;
};

export const JackpotMapScreen: React.FC = () => {
  const { setSelectedHotelId, setCurrentSubScreen, setJackpotHotels } = useApp();
  const [activeCountryIndex, setActiveCountryIndex] = useState<number>(0);
  const [regions, setRegions] = useState<Region[]>([]);
  const [hotels, setHotels] = useState<HotelJackpotData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 리스트 뷰 ↔ 트리맵 뷰 전환 (기본: 리스트)
  const [viewMode, setViewMode] = useState<'list' | 'treemap'>('list');

  useEffect(() => {
    let isMounted = true;

    const fetchJackpots = async (countryIndex: number) => {
      setIsLoading(true);
      try {
        const response = await apiCommonClient.post<CommonResponse<JackpotApiResponse>, MainContentParam>(
              `/jackpot/${countryIndex}`,
              { jp_index: countryIndex}
            );

        
        
        console.log('response : ', response);
        if (response.result === ResultCode.SUCCESS && response.data && isMounted) {
          const countries = [...response.data.country]
            .filter(country => country.jp_view !== 0)
            .sort((a, b) => a.jp_sort - b.jp_sort);
          const apiHotels = mapJackpotApiHotels({ ...response.data, country: countries });
          const allCount = countryIndex === 0 ? apiHotels.length : countries.reduce(
            (count, country) => count + country.hotel_count,
            0
          );

          setRegions([
            { jp_index: 0, code: 'ALL', label: 'ALL', count: allCount },
            ...countries.map(country => ({
              jp_index: country.jp_index,
              code: mapRegionCode(country.country_code),
              label: country.country_name_ko || country.country_name_en_short ,
              count: country.hotel_count,
            })),
          ]);
          setHotels(apiHotels);

          // countryIndex===0(ALL) 조회는 전체 호텔+잭팟을 담고 있으므로, 상세 화면(HotelJackpotDetailScreen)이
          // hotelId만으로 실데이터를 찾을 수 있도록 AppContext에 캐시해 둔다.
          if (countryIndex === 0) {
            setJackpotHotels(apiHotels);
          }
        }
      } catch (error) {
        console.error(`/jackpot/${countryIndex} API 통신 오류:`, error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchJackpots(activeCountryIndex);
    return () => {
      isMounted = false;
    };
  }, [activeCountryIndex]);

  const activeRegion = regions.find(region => region.jp_index === activeCountryIndex)?.label ?? 'ALL';
  const filteredHotels = hotels;

  // Total jackpot sum for filtered hotels
  const totalRegionJackpot = useMemo(() => {
    return filteredHotels.reduce((sum, h) => sum + h.totalJackpotUsd, 0);
  }, [filteredHotels]);

  // Navigate to hotel jackpot detail screen
  const handleHotelClick = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setCurrentSubScreen('hotel-jackpot-detail');
  };

  // API jp_sort 순서를 유지합니다.
  const sortedHotels = useMemo(() => {
    return [...filteredHotels];
  }, [filteredHotels]);

  if (isLoading) {
    return <div className="flex min-h-56 items-center justify-center text-sm text-slate-400">잭팟 정보를 불러오는 중...</div>;
  }

  if (sortedHotels.length === 0) {
    return <div className="flex min-h-56 items-center justify-center text-sm text-slate-400">표시할 잭팟 정보가 없습니다.</div>;
  }

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Page Title Section */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">grid_view</span>
            프로그래시브 트리 맵 리스트
          </h2>
          <p className="text-xs text-slate-400">아시아 주요 호텔 & 리조트 프로그래시브</p>
        </div>
        {/* 2026-09-15 비활성화 (삭제하지 않고 주석 보존).
            사유: 리스트 뷰 ↔ 트리맵 뷰 토글 버튼을 화면에서 제거하기로 함. viewMode는 항상
            초기값 'list'로 고정되며, 아래 트리맵 렌더링 블록은 이 토글이 없으면 도달 불가능한
            상태로 남음(제거 요청 범위 밖이라 코드는 보존).
        <button
          onClick={() => setViewMode((v) => (v === 'list' ? 'treemap' : 'list'))}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold border transition active:scale-95 ${
            viewMode === 'treemap'
              ? 'bg-[#C5A059] text-[#0D1B2A] border-[#C5A059] shadow-sm'
              : 'bg-[#162639] text-[#E2C28E] border-[#C5A059]/40 hover:border-[#C5A059]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {viewMode === 'treemap' ? 'view_list' : 'grid_view'}
          </span>
          <span>{viewMode === 'treemap' ? 'LIST' : 'TREEMAP'}</span>
        </button>
        */}
      </div>

      {/* 1. Region Filter Tabs (ALL / KR / MO / SG / PH / JP) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#162639] rounded-xl border border-[#1F334D] overflow-x-auto no-scrollbar">
        {regions.map((reg) => {
          const isActive = activeCountryIndex === reg.jp_index;
          return (
            <button
              key={reg.jp_index}
              onClick={() => setActiveCountryIndex(reg.jp_index)}
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
      {/* 2026-09-27 레이아웃 교체 (기존 코드는 주석 보존).
          사유: 한 줄에 라벨·USD 합계·원화 환산을 모두 넣는 구조라 폭 여유가 거의 없었고, font-mono가
          Android에서 폭 넓은 시스템 monospace로 대체되어 모바일(약 412px)에서 각 항목이 두 줄로 깨짐.
          → 왼쪽 라벨 / 오른쪽 금액 2단(USD 위·원화 아래) + whitespace-nowrap + Pretendard tabular-nums로 변경.
      <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            {activeCountryIndex === 0 ? `아시아 전체 ${regions[0]?.count ?? regions[0]?.count}개 호텔` : `${activeRegion} 지역 ${filteredHotels.length}개 호텔`}
          </span>
          <span className="text-[10px] text-[#C5A059] font-mono bg-[#C5A059]/10 px-2 py-0.5 rounded">
            합계 {formatUsd(totalRegionJackpot)}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {formatKrw(totalRegionJackpot)}
        </span>
      </div>
      */}
      <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs font-bold text-slate-300">
          {activeCountryIndex === 0 ? `아시아 전체 ${regions[0]?.count ?? regions[0]?.count}개 호텔` : `${activeRegion} 지역 ${filteredHotels.length}개 호텔`}
        </span>
        <div className="shrink-0 flex flex-col items-end">
          <span className="whitespace-nowrap text-sm font-extrabold text-[#C5A059] tabular-nums">
            <span className="mr-1 text-[10px] font-bold text-slate-400">합계</span>
            {formatUsd(totalRegionJackpot)}
          </span>
          <span className="whitespace-nowrap text-[10px] text-slate-400 tabular-nums">
            {formatKrw(totalRegionJackpot)}
          </span>
        </div>
      </div>

      {/* 2. Treemap View — 타일 크기가 잭팟 총액 비율에 따라 달라지는 모자이크.
             #1~#3 큰 타일 + 나머지 3x2 작은 타일. row-span 미사용으로 타일 겹침 없음. */}
      {viewMode === 'treemap' && (
        <div className="flex flex-col gap-2 w-full bg-[#0D1B2A] p-2.5 rounded-2xl border border-[#1F334D]">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">잭팟 규모 트리맵</span>
            <span className="text-[9px] text-slate-500">타일 크기 = 잭팟 총액 비례 · 터치 시 상세</span>
          </div>

          {/* Top 3 tiles */}
          <div className="grid grid-cols-2 gap-2">
            {/* #1 — full width, largest */}
            <button
              onClick={() => handleHotelClick(sortedHotels[0].id)}
              className="col-span-2 min-h-[132px] rounded-xl p-3.5 flex flex-col justify-between text-left relative overflow-hidden border border-[#C5A059]/60 hover:border-[#C5A059] bg-[#1a2839] group transition"
            >
              <img
                src={sortedHotels[0].image}
                alt={sortedHotels[0].name}
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/40 to-transparent"></div>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {getDynamicBadges(0, (sortedHotels[0].totalJackpotUsd / totalRegionJackpot) * 100).map((b) => (
                    <span key={b} className="text-[9px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-1.5 py-0.5 rounded shadow">
                      {b}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-[#E2C28E] shrink-0">
                  {((sortedHotels[0].totalJackpotUsd / totalRegionJackpot) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-black text-white truncate">{sortedHotels[0].name}</h3>
                <p className="text-base font-black text-[#E2C28E] font-mono mt-1">
                  {formatUsd(sortedHotels[0].totalJackpotUsd)}
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                  {formatKrw(sortedHotels[0].totalJackpotUsd)}
                </p>
              </div>
            </button>

            {/* #2, #3 — half width each */}
            {sortedHotels.slice(1, 3).map((h, idx) => {
              const share = (h.totalJackpotUsd / totalRegionJackpot) * 100;
              return (
                <button
                  key={h.id}
                  onClick={() => handleHotelClick(h.id)}
                  className="min-h-[96px] rounded-xl p-2.5 flex flex-col justify-between text-left border border-[#1F334D] hover:border-[#C5A059]/60 bg-[#162639] transition min-w-0"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold text-slate-300 bg-[#0D1B2A] px-1.5 py-0.5 rounded shrink-0">
                      #{idx + 2} {h.region}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{share.toFixed(1)}%</span>
                  </div>
                  {getDynamicBadges(idx + 1, share).length > 0 && (
                    <span className="text-[8px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-1 py-0.5 rounded w-fit mt-1">
                      {getDynamicBadges(idx + 1, share)[0]}
                    </span>
                  )}
                  <div className="mt-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{h.name}</h4>
                    <p className="text-xs font-bold text-[#E2C28E] font-mono mt-0.5 truncate">
                      {formatUsd(h.totalJackpotUsd)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* #4 ~ #9 — small tiles, 3x2 grid */}
          {sortedHotels.length > 3 && (
            <div className="grid grid-cols-3 gap-1.5">
              {sortedHotels.slice(3, 9).map((h, idx) => {
                const share = (h.totalJackpotUsd / totalRegionJackpot) * 100;
                return (
                  <button
                    key={h.id}
                    onClick={() => handleHotelClick(h.id)}
                    className="min-h-[64px] rounded-lg p-1.5 flex flex-col justify-between text-left border border-[#1F334D]/70 hover:border-[#C5A059]/50 bg-[#132235] transition min-w-0"
                    title={`${h.name} · ${formatUsd(h.totalJackpotUsd)}`}
                  >
                    <span className="text-[8px] text-slate-400 font-mono">#{idx + 4} · {share.toFixed(1)}%</span>
                    <h4 className="text-[10px] font-bold text-white truncate leading-tight">{h.name}</h4>
                    <p className="text-[9px] font-bold text-[#E2C28E] font-mono truncate">{formatUsd(h.totalJackpotUsd)}</p>
                  </button>
                );
              })}
            </div>
          )}

          {sortedHotels.length > 9 && (
            <p className="text-[9px] text-slate-500 text-center pt-0.5">
              나머지 {sortedHotels.length - 9}개 호텔은 리스트 뷰에서 확인
            </p>
          )}
        </div>
      )}

      {/* 3. Major Casinos List Section */}
      {viewMode === 'list' && (
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">list_alt</span>
            <span>
              {activeCountryIndex === 0 ? `전체 카지노 목록 (${filteredHotels.length}개)` : `${activeRegion} 카지노 목록 (${filteredHotels.length}개)`}
            </span>
          </h3>
          {/* 2026-09-27: font-mono 제거 — Android 시스템 monospace에서 한글이 고정폭으로 벌어져 보임 */}
          <span className="whitespace-nowrap text-[11px] font-semibold text-[#C5A059]">누적 잭팟 순</span>
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
                    src={h.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'}
                    alt={h.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-0.5 left-0.5 bg-[#0D1B2A]/90 text-[#C5A059] font-extrabold text-[8px] px-1 rounded">
                    {h.region}
                  </span>
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E2C28E] transition">
                      {h.name}
                    </h4>
                    {h.badge && (
                      <span className="text-[8px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-1.5 py-0.2 rounded shrink-0">
                        {h.badge}
                      </span>
                    )}
                    {getDynamicBadges(idx, (h.totalJackpotUsd / totalRegionJackpot) * 100).map((b) => (
                      <span
                        key={b}
                        className="text-[8px] font-extrabold text-[#E2C28E] bg-[#C5A059]/15 border border-[#C5A059]/40 px-1.5 py-0.2 rounded shrink-0"
                      >
                        {b}
                      </span>
                    ))}
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
      )}
    </div>
  );
};
