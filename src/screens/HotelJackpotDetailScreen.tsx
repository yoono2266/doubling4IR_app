import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HOTELS_JACKPOT_DATA, HotelJackpotData, formatUsd, formatKrw, formatKrwByCurrency, getJackpotThumbUrl, JackpotItem } from '../data/jackpotData';
import { SOLAIRE_JACKPOT_HISTORY } from '../data/jackpotHistoryData';

interface HotelJackpotDetailScreenProps {
  hotelId?: string;
  onBack?: () => void;
}

// 2026-09-27: 트리맵 1~3위 타일 뒷배경 — 게임 상세 목록 좌측 썸네일과 같은 게임 이미지(jp_thumb_url)를
// 30% 불투명도로 깔아 준다. 썸네일이 없으면 아무것도 그리지 않음(기존 배경색 유지).
const TreemapTileBg: React.FC<{ thumbUrl?: string; alt: string }> = ({ thumbUrl, alt }) => {
  const src = getJackpotThumbUrl(thumbUrl);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
      referrerPolicy="no-referrer"
    />
  );
};

export const HotelJackpotDetailScreen: React.FC<HotelJackpotDetailScreenProps> = ({ hotelId, onBack }) => {
  const { selectedHotelId, setCurrentTab, setCurrentSubScreen, startBooking, jackpotHotels, refreshJackpotHotels } = useApp();
  const targetId = hotelId || selectedHotelId || 'okada';

  // 잭팟 목록(JackpotMapScreen)에서 실서버(api hotels/jackpots)로 조회해 둔 데이터를 우선 사용하고,
  // 아직 캐시가 없는 진입 경로(예: 하단 네비 '프로그래시브' 탭, 홈 배너 등 목록 화면을 거치지 않는 경우)에서는
  // 이 화면이 직접 캐시를 채운다. 그 사이 잠깐은 목데이터로 대체 표시한다.
  useEffect(() => {
    if (jackpotHotels.length === 0) {
      refreshJackpotHotels();
    }
  }, [jackpotHotels.length, refreshJackpotHotels]);

  const hotel: HotelJackpotData = useMemo(() => {
    return (
      jackpotHotels.find(h => h.id === targetId) ||
      HOTELS_JACKPOT_DATA.find(h => h.id === targetId) ||
      HOTELS_JACKPOT_DATA.find(h => h.id === 'okada')!
    );
  }, [targetId, jackpotHotels]);

  const [selectedJackpotId, setSelectedJackpotId] = useState<string | null>(null);

  // 2026-09-16: 이 버튼은 진입 경로(홈 배너 vs 하단 네비)와 무관하게 항상 프로그래시브
  // 트리맵 리스트(JackpotMapScreen, currentTab='jackpot')로 고정 이동해야 한다.
  // 예전엔 setCurrentSubScreen(null)만 호출해 "직전 currentTab"에 의존했는데, 홈 배너로
  // 진입한 경우 currentTab이 'home'에 머물러 있어 뒤로가기가 홈으로 가버리는 버그가 있었다.
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentTab('jackpot');
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
          <span>프로그래시브 목록으로</span>
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
                  {/* 2026-09-15: 이 화면 한정으로 "TOP 잭팟" 배지 문구만 "TOP"으로 축약 표시.
                      공용 데이터(jackpotData.ts)의 원본 badge 값은 그대로 유지 — JackpotMapScreen 등
                      다른 화면은 영향받지 않음. */}
                  {hotel.badge === 'TOP 잭팟' ? 'TOP' : hotel.badge}
                </span>
              )}
              {/* 2026-09-15 비활성화 (삭제하지 않고 주석 보존).
                  사유: 잭팟 상세 화면 이미지 우측 상단 "잭팟 N개 보유" 텍스트를 숨기기로 함.
              <span className="bg-black/60 backdrop-blur-sm text-[#E2C28E] border border-[#C5A059]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                잭팟 {hotel.jackpots.length}개 보유
              </span>
              */}
            </div>

            {/* 2026-09-15 비활성화 (삭제하지 않고 주석 보존).
                사유: 이미지 우측 상단 별점(★ N.N) 뱃지를 숨기기로 함.
            <div className="flex items-center gap-1 bg-[#0D1B2A]/90 px-2 py-1 rounded border border-[#C5A059]/30 text-amber-400 font-bold text-xs">
              <span className="material-symbols-outlined text-xs fill-1">star</span>
              <span>{hotel.rating}</span>
            </div>
            */}
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
          {/* 2026-09-27 비활성화 (삭제하지 않고 주석 보존).
              사유: API 호텔 데이터의 desc가 비어 있어(mapJackpotApiHotels에서 '' 고정) 호텔명 아래에
              빈 박스만 표시됨. 불필요하다는 요청으로 숨김.
          <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-3">
            <p className="text-xs text-slate-200 leading-relaxed">
              {hotel.desc}
            </p>
          </div>
          */}

          {/* Total Jackpot Summary Box */}
          {/* 2026-09-27: 달러(text-lg·font-mono)와 한화(text-xs·font-mono)의 크기·여백이 달라 줄이 맞지 않던 것을
              동일 크기(화면 폭 비례, 최대 15px)·굵기 + Pretendard tabular-nums + whitespace-nowrap으로 통일 (달러 금색·한화 회색) */}
          <div className="grid grid-cols-2 gap-2 bg-[#0D1B2A] p-3 rounded-xl border border-[#C5A059]/30">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">누적 프로그래시브 총합</span>
              <p className="mt-1 whitespace-nowrap text-[clamp(12px,3.6vw,15px)] font-extrabold leading-tight tabular-nums text-[#E2C28E]">
                {formatUsd(totalJackpotSum)}
              </p>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">한화 환산</span>
              <p className="mt-1 whitespace-nowrap text-[clamp(12px,3.6vw,15px)] font-extrabold leading-tight tabular-nums text-slate-400">
                {formatKrw(totalJackpotSum)}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Hotel Internal Treemap Section */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C5A059] text-base">dashboard</span>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {/* 2026-09-27: 제목 변경 (기존: 호텔 내부 프로그래시브 트리맵) */}
              호텔 프로그래시브 ({hotel.jackpots.length}개 게임)
            </h2>
          </div>
        </div>

        {/* Dynamic Treemap Grid depending on count */}
        {sortedJackpots.length === 0 ? (
          // 실서버 데이터 연동 후 잭팟이 아직 등록되지 않은 호텔(다수)에 대한 빈 상태.
          <div className="min-h-24 flex items-center justify-center bg-[#0D1B2A] rounded-xl border border-[#1F334D]/80 text-xs text-slate-500">
            등록된 프로그래시브 잭팟 정보가 없습니다.
          </div>
        ) : sortedJackpots.length >= 10 ? (
          /* Flagship Treemap Layout (10+ items)
             row-span 기반 겹침 버그 제거: 상단 flex + 중단/하단 독립 grid로 재구성.
             각 섹션이 별도 flow라 타일이 서로 겹치지 않는다. */
          <div className="flex flex-col gap-1.5 w-full bg-[#0D1B2A] p-2 rounded-xl border border-[#1F334D]/80">
            {/* Top: #1 big tile + #2/#3 vertical stack */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setSelectedJackpotId(sortedJackpots[0].id)}
                className={`flex-[1.15] min-h-[132px] rounded-lg p-2.5 flex flex-col justify-between text-left transition relative overflow-hidden group ${
                  activeJackpot.id === sortedJackpots[0].id
                    ? 'bg-gradient-to-br from-[#223B59] to-[#122338] border-2 border-[#C5A059] shadow-lg ring-1 ring-[#C5A059]'
                    : 'bg-[#182C44] border border-[#234063] hover:border-[#C5A059]/60'
                }`}
              >
                {/* 2026-09-27: 뱃지 "#1 PROGRESSIVE" → 게임 이름(뱃지 없이 흰색 글씨)으로 교체, 비중(%) 표시와 별도 게임 이름 줄은 주석 처리,
                    한화 금액을 달러와 같은 크기로 키움 (font-mono → Pretendard tabular-nums) */}
                <TreemapTileBg thumbUrl={sortedJackpots[0].thumbUrl} alt={sortedJackpots[0].name} />
                <div className="relative z-10 flex items-center justify-between w-full min-w-0">
                  <span className="max-w-full truncate text-[16px] min-[400px]:text-[19.5px] leading-snug font-extrabold text-white">
                    {/* #1 {sortedJackpots[0].badge || 'PROGRESSIVE'} */}
                    {sortedJackpots[0].name}
                  </span>
                  {/* <span className="text-[9px] text-[#E2C28E] font-mono">{((sortedJackpots[0].amountUsd / totalJackpotSum) * 100).toFixed(1)}%</span> */}
                </div>
                <div className="relative z-10">
                  {/* <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-[#E2C28E] transition">
                    {sortedJackpots[0].name}
                  </h4> */}
                  <p className="whitespace-nowrap text-[clamp(12px,3.4vw,14px)] font-black text-[#E2C28E] tabular-nums">
                    {formatUsd(sortedJackpots[0].amountUsd)}
                  </p>
                  <p className="whitespace-nowrap text-[clamp(12px,3.4vw,14px)] font-black text-slate-400 tabular-nums mt-0.5">
                    {formatKrw(sortedJackpots[0].amountUsd)}
                  </p>
                </div>
              </button>

              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <button
                  onClick={() => setSelectedJackpotId(sortedJackpots[1].id)}
                  className={`flex-1 min-h-[62px] rounded-lg p-2 flex flex-col justify-between gap-1 text-left transition relative overflow-hidden ${
                    activeJackpot.id === sortedJackpots[1].id
                      ? 'bg-[#223B59] border-2 border-[#C5A059]'
                      : 'bg-[#15253A] border border-[#1F334D] hover:border-[#C5A059]/50'
                  }`}
                >
                  {/* 2026-09-27: 뱃지 "#2 PROGRESSIVE" → 게임 이름(뱃지 없이 흰색 글씨)으로 교체, 별도 게임 이름 줄은 주석 처리 */}
                  <TreemapTileBg thumbUrl={sortedJackpots[1].thumbUrl} alt={sortedJackpots[1].name} />
                  <span className="relative z-10 shrink-0 max-w-full truncate text-[11.5px] min-[400px]:text-[14.3px] leading-snug font-bold text-white">
                    {/* #2 {sortedJackpots[1].badge || 'PROGRESSIVE'} */}
                    {sortedJackpots[1].name}
                  </span>
                  <div className="relative z-10 min-w-0">
                    {/* <h4 className="text-[11px] font-bold text-white truncate">{sortedJackpots[1].name}</h4> */}
                    <p className="whitespace-nowrap text-[11.5px] min-[400px]:text-[14.3px] font-bold text-[#E2C28E] tabular-nums">{formatUsd(sortedJackpots[1].amountUsd)}</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedJackpotId(sortedJackpots[2].id)}
                  className={`flex-1 min-h-[62px] rounded-lg p-2 flex flex-col justify-between gap-1 text-left transition relative overflow-hidden ${
                    activeJackpot.id === sortedJackpots[2].id
                      ? 'bg-[#223B59] border-2 border-[#C5A059]'
                      : 'bg-[#15253A] border border-[#1F334D] hover:border-[#C5A059]/50'
                  }`}
                >
                  {/* 2026-09-27: 뱃지 "#3 PROGRESSIVE" → 게임 이름(뱃지 없이 흰색 글씨)으로 교체, 별도 게임 이름 줄은 주석 처리 */}
                  <TreemapTileBg thumbUrl={sortedJackpots[2].thumbUrl} alt={sortedJackpots[2].name} />
                  <span className="relative z-10 shrink-0 max-w-full truncate text-[11.5px] min-[400px]:text-[14.3px] leading-snug font-bold text-white">
                    {/* #3 {sortedJackpots[2].badge || 'PROGRESSIVE'} */}
                    {sortedJackpots[2].name}
                  </span>
                  <div className="relative z-10 min-w-0">
                    {/* <h4 className="text-[10px] font-bold text-white truncate">{sortedJackpots[2].name}</h4> */}
                    <p className="whitespace-nowrap text-[11.5px] min-[400px]:text-[14.3px] font-bold text-[#E2C28E] tabular-nums">{formatUsd(sortedJackpots[2].amountUsd)}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Mid: #4 ~ #7 (2-col grid) 
            {sortedJackpots.length > 3 && (
              <div className="grid grid-cols-2 gap-1.5">
                {sortedJackpots.slice(3, 7).map((jp, idx) => (
                  <button
                    key={jp.id}
                    onClick={() => setSelectedJackpotId(jp.id)}
                    className={`min-h-[52px] rounded-lg p-2 flex items-center justify-between text-left transition ${
                      activeJackpot.id === jp.id
                        ? 'bg-[#223B59] border-2 border-[#C5A059]'
                        : 'bg-[#132235] border border-[#1F334D] hover:border-[#C5A059]/40'
                    }`}
                  >
                    <div className="overflow-hidden pr-1 min-w-0">
                      <span className="text-[9px] text-slate-400 font-mono block truncate">#{idx + 4}</span>
                      <h4 className="text-[10px] font-bold text-white truncate">{jp.name}</h4>
                    </div>
                    <span className="text-[11px] font-bold text-[#E2C28E] font-mono shrink-0">
                      {formatUsd(jp.amountUsd)}
                    </span>
                  </button>
                ))}
              </div>
            )}
*/}
            {/* Bottom: #8 ~ #15 (4-col small tiles) 
            {sortedJackpots.length > 7 && (
              <div className="grid grid-cols-4 gap-1">
                {sortedJackpots.slice(7, 15).map((jp, idx) => (
                  <button
                    key={jp.id}
                    onClick={() => setSelectedJackpotId(jp.id)}
                    className={`min-h-[42px] rounded p-1 text-center transition flex flex-col justify-center ${
                      activeJackpot.id === jp.id
                        ? 'bg-[#C5A059] text-[#0D1B2A] font-bold'
                        : 'bg-[#0E1A29] text-slate-300 border border-[#1F334D]/60 hover:bg-[#162639]'
                    }`}
                    title={`${jp.name} - ${formatUsd(jp.amountUsd)}`}
                  >
                    <span className="text-[8px] truncate block opacity-80 w-full">#{idx + 8} {jp.name.split(' ')[0]}</span>
                    <span className="text-[9px] font-mono font-bold block truncate w-full">{formatUsd(jp.amountUsd)}</span>
                  </button>
                ))}
              </div>
            )}
              */}
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

        {/* Jackpot History 진입 — 언제/얼마/게임/배팅금액/슬롯넘버/획득자 국적 상세 기록 */}
        <button
          onClick={() => setCurrentSubScreen('jackpot-history')}
          className="w-full bg-[#0D1B2A] border border-[#C5A059]/40 rounded-xl p-3 flex items-center justify-between text-left transition hover:border-[#C5A059] active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E] shrink-0">
              <span className="material-symbols-outlined text-base">history</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">프로그래시브 당첨 내역</h4>
              {/* 2026-09-27: 설명 문구 변경 (기존: 역대 당첨 기록 · 게임/배팅금액/슬롯넘버/획득자 국적) */}
              <p className="text-[10px] text-slate-400">당첨 기록 / 당첨금 / 슬롯넘버 / 당첨자 국적</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 2026-09-27: N건 박스를 좌측 아이콘(w-8 h-8)과 같은 크기의 정사각형으로 변경 (기존: px-2 py-0.5 작은 뱃지, font-mono) */}
            <span className="w-8 h-8 flex items-center justify-center text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-md tabular-nums">
              {SOLAIRE_JACKPOT_HISTORY.length}건
            </span>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </div>
        </button>
      </div>

      {/* Jackpot List Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">format_list_numbered</span>
            <span>게임 상세 목록 ({sortedJackpots.length})</span>
          </h3>
          {/* 2026-09-27: 좌측 "게임 상세 목록"과 같은 글꼴·크기로 통일, 굵기는 보통(unbold) (기존: text-[11px] font-mono) */}
          <span className="whitespace-nowrap text-xs font-normal tracking-wider text-[#C5A059]">금액순 정렬</span>
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
                {/* 2026-09-27: 좌측 (게임명 / Jackpot Game)과 우측 (달러 / 원화)의 줄을 맞추기 위해
                    양쪽 1행 높이 20px(leading-5)·2행 높이 16px(leading-4)로 통일.
                    달러·원화는 같은 크기(12px)·우측 정렬, font-mono → Pretendard tabular-nums */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-[#1F334D] bg-[#0D1B2A]">
                    {getJackpotThumbUrl(jp.thumbUrl) ? (
                      <img
                        src={getJackpotThumbUrl(jp.thumbUrl)}
                        alt={jp.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-base">casino</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 h-5">
                      <h4 className="truncate text-xs leading-5 font-bold text-white">{jp.name}</h4>
                      {jp.badge && (
                        <span className="text-[9px] font-bold text-[#0D1B2A] bg-[#C5A059] px-1.5 rounded">
                          {jp.badge}
                        </span>
                      )}
                    </div>
                    <span className="block h-4 text-[10px] leading-4 text-slate-400">{jp.type || 'Jackpot Game'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <p className="h-5 whitespace-nowrap text-xs leading-5 font-extrabold text-[#E2C28E] tabular-nums">
                    {formatUsd(jp.amountUsd)}
                  </p>
                  <p className="h-4 whitespace-nowrap text-xs leading-4 font-extrabold text-slate-400 tabular-nums">
                    {formatKrwByCurrency(jp.amountUsd, jp.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/*
        2026-09-08 제거 요청으로 비활성화 (삭제하지 않고 주석 보존).
        사유: 잭팟 상세 화면 게임 목록 하단의 "FreePlay 바우처로 VIP 신청하기" CTA를 노출하지 않기로 함.
              이 버튼은 공용 컴포넌트가 아니라 이 화면에만 있는 인라인 코드다.
              되살릴 경우 useApp()에서 startBooking 구독도 그대로 사용하면 된다(현재는 이 버튼이 유일 호출부).
        [원본 JSX]
        <button
          onClick={() => {
            startBooking({
              name: hotel.name,
              location: hotel.regionLabel,
              roomType: 'VIP Executive Suite',
              pricePerNightDp: 600,
              image: hotel.image
            });
          }}
          className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2"
        >
          <span className="material-symbols-outlined text-base">hotel</span>
          <span>{hotel.name} FreePlay 바우처로 VIP 신청하기</span>
        </button>
      */}
    </div>
  );
};
