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
import { findResortFacility } from '../data/resortFacilities';
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
// 2026-09-27 뱃지 전체 비활성화 (코드는 보존).
// 사유: 1위·TOP은 금액 순위가 아닌 목록 순서(jp_sort)로, 글로벌 랜드마크는 지역 합계 대비 비중 15% 이상으로
// 자동 부여되어 실제 의미와 어긋남(금액 $0 호텔이 "1위" 등). 뱃지 정의·종류가 정리되면 이 값을 true로 바꾸고 기준을 수정.
const SHOW_BADGES = false;

// 2026-09-30: 국가 탭을 ALL·마카오·필리핀·싱가포르·일본으로 표시. 서버 국가 목록에 일본(JP)이 없으면
// FE에서 리조트 수 0인 일본 탭을 붙인다. 이 탭은 서버에 없는 국가이므로 API를 호출하지 않고 빈 목록을 보여 준다.
// 서버에 일본이 추가되면(country_code 'JP') 자리표시 탭 대신 서버 값이 그대로 쓰인다.
const JAPAN_PLACEHOLDER_INDEX = -1;

// 2026-09-30: 오픈 준비중 리조트 여부 (resortFacilities.ts isPreparing, 호텔 한글명 매칭)
const isHotelPreparing = (hotel: HotelJackpotData): boolean => findResortFacility(hotel.name)?.isPreparing === true;

const getDynamicBadges = (rankIndex: number, sharePercent: number): string[] => {
  const badges: string[] = [];
  if (!SHOW_BADGES) return badges;
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
            ...(countries.some(country => mapRegionCode(country.country_code) === 'JP')
              ? []
              : [{ jp_index: JAPAN_PLACEHOLDER_INDEX, code: 'JP' as RegionCode, label: '일본', count: 0 }]),
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

    if (activeCountryIndex === JAPAN_PLACEHOLDER_INDEX) {
      setHotels([]);
      setIsLoading(false);
    } else {
      fetchJackpots(activeCountryIndex);
    }
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
  // 2026-09-30: 오픈한 리조트(현재 솔레어)를 맨 위로, 오픈 준비중 리조트는 아래로. 각 그룹 안에서는 API 순서 유지 (stable sort).
  const sortedHotels = useMemo(() => {
    return [...filteredHotels].sort((a, b) => Number(isHotelPreparing(a)) - Number(isHotelPreparing(b)));
  }, [filteredHotels]);

  if (isLoading) {
    return <div className="flex min-h-56 items-center justify-center text-sm text-slate-400">잭팟 정보를 불러오는 중...</div>;
  }

  // 2026-09-30 주석 처리: 목록이 비면(예: 일본 탭 0개) 국가 탭까지 사라져 다른 국가로 돌아갈 수 없음.
  // → 빈 목록 안내는 아래 목록 영역 안에서 표시.
  // if (sortedHotels.length === 0) {
  //   return <div className="flex min-h-56 items-center justify-center text-sm text-slate-400">표시할 잭팟 정보가 없습니다.</div>;
  // }

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* Page Title Section */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">grid_view</span>
            {/* 2026-09-27: 제목 변경 (기존: 프로그래시브 트리 맵 리스트 — 트리맵 뷰 비활성 상태라 목록만 표시) */}
            프로그래시브 리스트
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
      {/* 2026-09-30: 탭 5개(일본 추가)가 320px 폭에서도 한 화면에 들어오도록 gap-1.5 → gap-1, 버튼 min-w-[54px] → min-w-0 */}
      <div className="flex items-center gap-1 p-1 bg-[#162639] rounded-xl border border-[#1F334D] overflow-x-auto no-scrollbar">
        {regions.map((reg) => {
          const isActive = activeCountryIndex === reg.jp_index;
          return (
            <button
              key={reg.jp_index}
              onClick={() => setActiveCountryIndex(reg.jp_index)}
              className={`flex-1 min-w-0 whitespace-nowrap py-2 rounded-lg text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 ${
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
          → 2026-09-27 재수정: 1행 라벨, 2행 "합계 USD"(좌정렬) · "원화 환산"(우정렬) 구조로 변경 (요청 레이아웃).
            두 금액은 호텔 상세 요약과 동일하게 같은 크기(화면 폭 비례, 최대 15px)·굵기로 통일.
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
      {/* 2026-09-30 주석 처리 (요청): "아시아 전체 N개 호텔 / 합계 USD / 원화 환산" 요약 박스를 화면에서 제거.
      <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3.5 py-2.5 flex flex-col gap-1.5">
        <span className="truncate text-xs font-bold text-slate-300">
          {activeCountryIndex === 0 ? `아시아 전체 ${regions[0]?.count ?? regions[0]?.count}개 호텔` : `${activeRegion} 지역 ${filteredHotels.length}개 호텔`}
        </span>
        <div className="flex items-baseline justify-between gap-3">
          <span className="whitespace-nowrap text-[clamp(12px,3.6vw,15px)] font-extrabold text-[#E2C28E] tabular-nums">
            <span className="mr-1 text-[10px] font-bold text-slate-400">합계</span>
            {formatUsd(totalRegionJackpot)}
          </span>
          <span className="whitespace-nowrap text-right text-[clamp(12px,3.6vw,15px)] font-extrabold text-slate-400 tabular-nums">
            {formatKrw(totalRegionJackpot)}
          </span>
        </div>
      </div>
      */}

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
              {/* 2026-09-30: "카지노 목록" → "5성 복합리조트 목록" */}
              {activeCountryIndex === 0 ? `전체 5성 복합리조트 목록 (${filteredHotels.length}개)` : `${activeRegion} 5성 복합리조트 목록 (${filteredHotels.length}개)`}
            </span>
          </h3>
          {/* 2026-09-27: font-mono 제거 — Android 시스템 monospace에서 한글이 고정폭으로 벌어져 보임 */}
          {/* 2026-09-27: 호텔 상세 "금액순 정렬"과 같은 스타일로 통일 (기존: text-[11px] font-semibold) */}
          <span className="whitespace-nowrap text-xs font-normal tracking-wider text-[#C5A059]">누적 잭팟 순</span>
        </div>

        <div className="space-y-2.5">
          {sortedHotels.length === 0 && (
            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-[#1F334D] bg-[#162639] text-sm text-slate-400">
              표시할 리조트 정보가 없습니다.
            </div>
          )}
          {sortedHotels.map((h, idx) => {
            // 2026-09-30: 오픈 준비중 리조트(resortFacilities.ts isPreparing)는 클릭 불가 + 반투명 "오픈 준비중" 박스 표시
            // (카드는 흐리게 하지 않고 박스만 반투명. "잭팟 N개 · 지역" 표시를 이 박스로 대치.
            //  이름 위치는 다른 카드와 같게 두고, 박스는 그 줄 맨 위에서 아래로 늘어나도록 겹쳐 표시.
            //  클릭 불가를 알 수 있도록 카드 바탕·사진·이름·보유 슬롯 영역은 반투명 — "오픈 준비중" 박스는 선명하게 유지)
            const isPreparing = isHotelPreparing(h);
            return (
            <div
              key={h.id}
              onClick={isPreparing ? undefined : () => handleHotelClick(h.id)}
              aria-disabled={isPreparing || undefined}
              className={`relative overflow-hidden border rounded-2xl p-3.5 flex items-center justify-between transition shadow-md group ${
                isPreparing
                  ? 'bg-[#162639]/50 border-[#1F334D]/60 cursor-not-allowed select-none'
                  : 'bg-[#162639] border-[#1F334D] cursor-pointer hover:border-[#C5A059]/60'
              }`}
            >
              <div className={`flex items-center gap-3 pr-2 ${isPreparing ? 'min-w-0' : 'overflow-hidden'}`}>
                <div className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#1F334D] ${isPreparing ? 'opacity-45 grayscale-[40%]' : ''}`}>
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

                <div className={isPreparing ? 'min-w-0' : 'overflow-hidden'}>
                  <div className={`flex items-center gap-1.5 flex-wrap ${isPreparing ? 'opacity-60' : ''}`}>
                    <h4 className={`text-xs font-bold text-white truncate transition ${isPreparing ? '' : 'group-hover:text-[#E2C28E]'}`}>
                      {h.name}
                    </h4>
                    {SHOW_BADGES && h.badge && (
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
                  <div className="relative flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    {isPreparing ? (
                      <>
                        {/* 줄 높이를 다른 카드와 같게 유지하는 보이지 않는 자리표시 → 이름 위치(윗 여백)가 솔레어 등 다른 카드와 동일 */}
                        <span className="invisible font-semibold" aria-hidden="true">잭팟 {h.jackpots.length}개</span>
                        {/* 2026-09-30: 박스도 반투명(opacity-60) — 카드 전체와 함께 비활성 상태로 보이도록 */}
                        <span className="absolute left-0 top-0 rounded-lg border border-[#C5A059]/60 bg-[#0D1B2A]/45 px-3 py-1 text-xs font-extrabold tracking-[0.15em] text-[#E2C28E]/90 whitespace-nowrap opacity-60">
                          오픈 준비중
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#C5A059] font-semibold">잭팟 {h.jackpots.length}개</span>
                        <span>•</span>
                        <span>{h.regionLabel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 2026-09-27: 달러(12px)·원화(10px) font-mono → 호텔 상세 게임 목록과 같은 규칙
                  (둘 다 12px·같은 굵기·우측 정렬, 원화 회색, Pretendard tabular-nums),
                  "상세보기" 9px → 좌측 "잭팟 N개 · 지역"과 같은 10px */}
              <div className={`text-right shrink-0 ${isPreparing ? 'opacity-45' : ''}`}>
                {/* 2026-09-30 주석 처리 (요청): 누적 잭팟 USD·원화 환산 → "보유 슬롯 / 보유 테이블"로 교체.
                <span className="block whitespace-nowrap text-xs leading-5 font-extrabold text-[#E2C28E] tabular-nums">
                  {formatUsd(h.totalJackpotUsd)}
                </span>
                <span className="block whitespace-nowrap text-xs leading-4 font-extrabold text-slate-400 tabular-nums">
                  {formatKrw(h.totalJackpotUsd)}
                </span>
                */}
                {/* 서버 slot_count·table_count (BE 제공 요청 중, REQ-260930-01). 값이 없으면 '-' 표시 */}
                <span className="block whitespace-nowrap text-xs leading-5 font-extrabold text-[#E2C28E] tabular-nums">
                  <span className="mr-1 text-[10px] font-bold text-slate-400">보유 슬롯</span>
                  {h.slots !== undefined ? h.slots.toLocaleString('en-US') : '-'}
                </span>
                <span className="block whitespace-nowrap text-xs leading-4 font-extrabold text-slate-300 tabular-nums">
                  <span className="mr-1 text-[10px] font-bold text-slate-400">보유 테이블</span>
                  {h.tables !== undefined ? h.tables.toLocaleString('en-US') : '-'}
                </span>
                <span className="text-[10px] text-[#C5A059] font-semibold flex items-center justify-end gap-0.5 mt-1">
                  <span>상세보기</span>
                  <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                </span>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
