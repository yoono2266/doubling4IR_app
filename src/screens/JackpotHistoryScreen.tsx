import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { resetMainScrollTop } from '../utils/scrollMemory';
import { formatUsd, formatKrw, formatAmountByCurrency, formatKrwCodeByCurrency, getJackpotThumbUrl } from '../data/jackpotData';
import { SOLAIRE_JACKPOT_HISTORY } from '../data/jackpotHistoryData';

// 2026-09-30: 금액 표기 '$'·"약 N억 N만원" → "PHP 정수" / "KRW 정수"(PHP ×25 환산)로 변경.
// 솔레어 잭팟은 서버 기준 전부 페소(jp_currency '3')라, mock 당첨 기록의 amountUsd·betUsd 값도 PHP 금액으로 간주한다
// (mock key 이름은 규칙상 변경하지 않음 — jackpotHistoryData.ts는 여전히 mock).
const HISTORY_CURRENCY = '3';

// 2026-09-30: 당첨 일시 표기 "YYYY-MM-DD HH:mm" → "YYYY.MM.DD HH:mm (KST)".
// mock wonAt 값을 KST 시각으로 보고 형식만 바꾼다 (시간대 변환 없음).
const formatWonAtKst = (wonAt: string): string => {
  const [date, time = ''] = wonAt.split(' ');
  return `${date.replace(/-/g, '.')} ${time} (KST)`.replace(/\s+\(/, ' (');
};

export const JackpotHistoryScreen: React.FC = () => {
  const { setCurrentSubScreen } = useApp();

  const records = SOLAIRE_JACKPOT_HISTORY;

  // 2026-09-30: 호텔 상세에서 "프로그래시브 당첨 내역"으로 들어오면 공용 <main> 스크롤 위치가 이어져 화면 중간에서 시작하던 문제 —
  // 진입 시 항상 최상단으로 이동
  useEffect(() => {
    resetMainScrollTop();
  }, []);

  // 2026-09-30: 당첨 게임 썸네일 — 기록의 thumbUrl(현재 mock에 고정 배정, 추후 서버 값)을 그대로 사용.
  // (화면 진입마다 무작위로 섞던 방식은 로딩할 때마다 이미지가 바뀌어 제거)
  const getRecordThumb = (thumbUrl: string | undefined): string | undefined => getJackpotThumbUrl(thumbUrl);

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
          {/* 2026-09-27: 호텔 상세 화면 표기(솔레어 엔터테인먼트 시티)와 통일 (기존: 솔레어 리조트 앤 카지노로 돌아가기) */}
          <span>솔레어 엔터테인먼트 시티로 돌아가기</span>
        </button>

        <span className="text-[10px] font-bold text-[#E2C28E] bg-[#C5A059]/15 border border-[#C5A059]/30 px-2.5 py-1 rounded-full uppercase">
          PH • 필리핀 마닐라
        </span>
      </div>

      {/* Header */}
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#C5A059] text-base">history</span>
          {/* 2026-09-27: 진입 버튼 문구(프로그래시브 당첨 내역)와 통일 (기존: Jackpot History) */}
          <h1 className="text-sm font-bold text-white tracking-tight">프로그래시브 당첨 내역</h1>
        </div>
        {/* 2026-09-30 주석 처리 (요청): 제목 아래 설명 박스("솔레어 엔터테인먼트 시티의 역대 프로그래시브 당첨 기록입니다…") 삭제
        <p className="text-xs text-slate-300 leading-relaxed bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-3">
          {/* 2026-09-27: 용어 통일 — 잭팟→프로그래시브, 획득 금액→당첨금, 획득자→당첨자 (기존: 솔레어 리조트 앤 카지노에서 터진 역대 잭팟 당첨 기록입니다. 당첨 일시 · 획득 금액 · 게임 이름 · 배팅 금액 · 슬롯 넘버 · 획득자 국적을 확인할 수 있습니다.) *\/}
          {/* 2026-09-30: 표시 항목 축소(배팅 금액·슬롯 넘버·당첨자 국적 숨김)에 맞춰 문구 변경
              (기존: …당첨 일시 · 당첨금 · 게임 이름 · 배팅 금액 · 슬롯 넘버 · 당첨자 국적을 확인할 수 있습니다.) *\/}
          솔레어 엔터테인먼트 시티의 역대 프로그래시브 당첨 기록입니다. 당첨 일시 · 게임 이름 · 당첨금을 확인할 수 있습니다.
        </p>
        */}

        {/* 2026-09-27: 건수(text-lg)·합계(text-sm)의 크기·여백이 달라 줄이 맞지 않던 것을 호텔 상세 요약 박스와 같은
            규칙(같은 크기·굵기, 화면 폭 비례 최대 15px, font-mono → Pretendard tabular-nums)으로 통일 */}
        {/* 2026-09-30: 요약 박스 구성 변경 (기존: 2칸 grid — 좌 "누적 당첨 건수/12건", 우 "누적 당첨금 합계/PHP/KRW" 세로 배치)
            → 1행 "누적 당첨 건수 12건" / 2행 "누적 당첨금" / 3행 PHP(좌정렬) · KRW(우정렬) 한 줄 */}
        {/* 2026-09-30 비활성화 (삭제하지 않고 주석 보존).
            사유: 누적 당첨 요약 박스("누적 당첨 건수 N건" / "누적 당첨금 PHP·KRW") 전체를 노출하지 않기로 함.
                  건수는 아래 목록 제목 "당첨 내역 (N)"으로 계속 표시. 복구 시 아래 false를 지우면 됨. */}
        {false && (
        <div className="flex flex-col gap-2 bg-[#0D1B2A] p-3 rounded-xl border border-[#C5A059]/30">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">누적 당첨 건수</span>
            <p className="whitespace-nowrap text-[clamp(12px,3.6vw,15px)] font-extrabold leading-tight tabular-nums text-white">
              {records.length}건
            </p>
          </div>
          <div className="border-t border-[#1F334D]/70 pt-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">누적 당첨금</span>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="whitespace-nowrap text-[clamp(12px,4vw,15px)] font-extrabold leading-tight tabular-nums text-[#E2C28E]">
                {formatAmountByCurrency(totalWonUsd, HISTORY_CURRENCY)}
              </p>
              <p className="whitespace-nowrap text-right text-[clamp(11px,3.6vw,13px)] font-extrabold leading-tight tabular-nums text-slate-400">
                {formatKrwCodeByCurrency(totalWonUsd, HISTORY_CURRENCY)}
              </p>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Records */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-[#C5A059]">format_list_numbered</span>
            <span>당첨 내역 ({records.length})</span>
          </h3>
          {/* 2026-09-27: 호텔 상세 "금액순 정렬"과 같은 스타일 (기존: text-[11px] font-mono) */}
          <span className="whitespace-nowrap text-xs font-normal tracking-wider text-[#C5A059]">최신순</span>
        </div>

        <div className="space-y-2.5">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 flex flex-col gap-3 shadow-md"
            >
              {/* 2026-09-30: 카드 구성 변경 — ① 당첨 일시(yyyy.mm.dd hh:mm (KST)) ② 게임 이름 ③ 당첨금 PHP / KRW 환산액.
                  기존 구성(일시+금액 / 게임 이름+종류 / 배팅 금액·슬롯 넘버·당첨자 국적)은 아래에 주석으로 보존. */}
              {/* 2026-09-30: 일시·게임 이름 오른쪽 빈 자리에 당첨 게임 썸네일 (기록 thumbUrl — 없으면 표시 안 함) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 tabular-nums">
                    <span className="material-symbols-outlined text-[13px] text-[#C5A059]">schedule</span>
                    <span>{formatWonAtKst(r.wonAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#E2C28E] text-lg shrink-0">casino</span>
                    <h4 className="text-sm font-bold text-white truncate">{r.gameName}</h4>
                  </div>
                </div>

                {getRecordThumb(r.thumbUrl) && (
                  <div className="w-[88px] h-[55px] rounded-lg overflow-hidden shrink-0 border border-[#1F334D] bg-[#0D1B2A]">
                    <img
                      src={getRecordThumb(r.thumbUrl)}
                      alt={r.gameName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* 2026-09-30: 당첨금 한 줄 표기 — PHP 왼쪽 정렬 · KRW 오른쪽 정렬 (기존: 좌측 "당첨금" 글자 + 우측 PHP/KRW 두 줄).
                  "당첨금" 글자는 요청에 따라 표시하지 않음:
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">당첨금</span> */}
              <div className="flex items-baseline justify-between gap-2 border-t border-[#1F334D]/70 pt-2.5">
                <p className="whitespace-nowrap text-[clamp(12px,4vw,15px)] leading-5 font-extrabold text-[#E2C28E] tabular-nums">
                  {formatAmountByCurrency(r.amountUsd, HISTORY_CURRENCY)}
                </p>
                <p className="whitespace-nowrap text-right text-[clamp(11px,3.6vw,13px)] leading-5 font-extrabold text-slate-400 tabular-nums">
                  {formatKrwCodeByCurrency(r.amountUsd, HISTORY_CURRENCY)}
                </p>
              </div>

              {/* 2026-09-30 주석 처리 (요청: 당첨 내역은 일시 · 게임 이름 · 당첨금 PHP/KRW만 표시)
              {/* Top: 언제 + 얼마 *\/}
              {/* 2026-09-27: 달러(text-base)·원화(9px) 크기를 같게(15px) 통일·우측 정렬, 원화 회색.
                  당첨 일시 줄과 달러 줄의 높이(h-5)를 맞춤. font-mono → Pretendard tabular-nums *\/}
              <div className="flex items-start justify-between gap-2 border-b border-[#1F334D]/70 pb-2.5">
                <div className="flex items-center gap-1.5 h-5 text-[11px] text-slate-400 tabular-nums">
                  <span className="material-symbols-outlined text-[13px] text-[#C5A059]">schedule</span>
                  <span>{r.wonAt}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="h-5 whitespace-nowrap text-[15px] leading-5 font-extrabold text-[#E2C28E] tabular-nums">
                    {formatUsd(r.amountUsd)}
                  </p>
                  <p className="h-5 whitespace-nowrap text-[15px] leading-5 font-extrabold text-slate-400 tabular-nums">
                    {formatKrw(r.amountUsd)}
                  </p>
                </div>
              </div>

              {/* 게임 이름 *\/}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E2C28E] text-lg shrink-0">casino</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{r.gameName}</h4>
                  <span className="text-[10px] text-slate-400">{r.gameType}</span>
                </div>
              </div>

              {/* 배팅금액 / 슬롯넘버 / 당첨자 국적 — 2026-09-27: font-mono → Pretendard tabular-nums *\/}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-2">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">배팅 금액</span>
                  <p className="text-xs font-bold text-white tabular-nums mt-0.5">
                    {/* 2026-09-27: 소수점 두 자리 고정 — formatUsd 사용 (기존: ${r.betUsd.toLocaleString()}) *\/}
                    {formatUsd(r.betUsd)}
                  </p>
                </div>
                <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-2">
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">슬롯 넘버</span>
                  <p className="text-xs font-bold text-white tabular-nums mt-0.5">{r.slotNo}</p>
                </div>
                <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-2">
                  {/* 2026-09-27: 용어 통일 (기존: 획득자 국적) *\/}
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">당첨자 국적</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    <span className="mr-0.5">{r.flag}</span>
                    {r.nationality}
                  </p>
                </div>
              </div>
              */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
