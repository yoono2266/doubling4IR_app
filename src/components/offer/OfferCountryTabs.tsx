import React from 'react';
import { OFFER_PRODUCTS } from '../../data/offerRoomData';

// 2026-10-03: 오퍼 화면 국가 탭 (프로그래시브 리스트 국가 탭과 같은 구성·모양: ALL·마카오·필리핀·싱가포르·일본, 기본 ALL).
// 숫자는 국가별 오퍼 수 (mock). 현재 오퍼 상품은 필리핀 솔레어만 있음 — ALL·필리핀은 오퍼 표시, 나머지는 "오퍼 준비 중".
// 오퍼 객실 목록 API(BE 요청서 REQ-260930-03)가 생기면 국가별 개수·목록을 서버 값으로 교체.

export type OfferCountryCode = 'ALL' | 'MO' | 'PH' | 'SG' | 'JP';

// 2026-10-03: 국가별 개수는 BO 지정 오퍼 상품 목록(OFFER_PRODUCTS, mock)에서 계산 (기존: 고정값 0/1/0/0)
const countOf = (code: Exclude<OfferCountryCode, 'ALL'>) => OFFER_PRODUCTS.filter((p) => p.regionCode === code).length;

const COUNTRY_OFFER_COUNTS: { code: Exclude<OfferCountryCode, 'ALL'>; label: string; count: number }[] = [
  { code: 'MO', label: '마카오', count: countOf('MO') },
  { code: 'PH', label: '필리핀', count: countOf('PH') },
  { code: 'SG', label: '싱가포르', count: countOf('SG') },
  { code: 'JP', label: '일본', count: countOf('JP') },
];

export const OFFER_COUNTRIES: { code: OfferCountryCode; label: string; count: number }[] = [
  { code: 'ALL', label: 'ALL', count: COUNTRY_OFFER_COUNTS.reduce((sum, c) => sum + c.count, 0) },
  ...COUNTRY_OFFER_COUNTS,
];

// 이 탭에 보여줄 오퍼 상품이 있는지 (없으면 "오퍼 준비 중") — 2026-10-03: 상품 목록 기준으로 변경 (기존: ALL·PH 고정)
export const isOfferAvailableIn = (code: OfferCountryCode): boolean =>
  code === 'ALL' ? OFFER_PRODUCTS.length > 0 : OFFER_PRODUCTS.some((p) => p.regionCode === code);

interface OfferCountryTabsProps {
  value: OfferCountryCode;
  onChange: (code: OfferCountryCode) => void;
}

export const OfferCountryTabs: React.FC<OfferCountryTabsProps> = ({ value, onChange }) => (
  <div className="flex items-center gap-1 p-1 bg-[#162639] rounded-xl border border-[#1F334D] overflow-x-auto no-scrollbar">
    {OFFER_COUNTRIES.map((country) => {
      const isActive = value === country.code;
      return (
        <button
          key={country.code}
          type="button"
          onClick={() => onChange(country.code)}
          aria-pressed={isActive}
          className={`flex-1 min-w-0 whitespace-nowrap py-2 rounded-lg text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-0.5 ${
            isActive ? 'bg-[#C5A059] text-[#0D1B2A] shadow-md scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-[#0D1B2A]'
          }`}
        >
          <span>{country.label}</span>
          <span className={`text-[9px] font-semibold tabular-nums ${isActive ? 'text-[#0D1B2A]/80' : 'text-slate-500'}`}>
            {country.count}
          </span>
        </button>
      );
    })}
  </div>
);

export const OfferComingSoon: React.FC<{ countryLabel: string }> = ({ countryLabel }) => (
  <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-6 text-center flex flex-col items-center gap-2">
    <span className="material-symbols-outlined text-3xl text-[#C5A059]">hourglass_empty</span>
    <p className="text-[13px] font-bold text-white">{countryLabel} 오퍼 준비 중</p>
    <p className="text-xs text-slate-400 break-keep">제휴 리조트 오퍼가 준비되는 대로 이곳에서 안내해 드릴게요.</p>
  </div>
);
