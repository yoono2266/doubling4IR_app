import React from 'react';
import { Reservation } from '../types';

// 2026-09-27: 마이페이지 "오퍼 신청 내역"의 신청 카드 1장 (MyPageScreen 인라인 JSX에서 분리).
// 데이터는 AppContext reservations(mock, 실예약·결제 연동 아님)를 그대로 표시한다.
// 가독성 정리: 유형 칩 색상을 금색 한 가지로 통일, 상태 칩 "상태:" 접두어 제거·깜빡임 제거,
// 라벨 끝 콜론 제거, 값 13px, font-mono → Pretendard tabular-nums, 선택 옵션은 말줄임 대신 전체 표시.

const TYPE_META: Record<string, { icon: string; label: string }> = {
  freeplay_suite: { icon: 'king_bed', label: '오퍼 스위트' },
  gaming_room: { icon: 'casino', label: '멤버십 게이밍룸' },
  dining: { icon: 'restaurant', label: '멤버십 다이닝' },
};

const STATUS_CLASS: Record<Reservation['status'], string> = {
  확정: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  승인완료: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  심사중: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  대기: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  취소: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const Row: React.FC<{ label: string; children: React.ReactNode; alignTop?: boolean }> = ({ label, children, alignTop }) => (
  <div className={`flex justify-between gap-4 ${alignTop ? 'items-start' : 'items-center'}`}>
    <span className="shrink-0 text-xs text-slate-400">{label}</span>
    <span className="min-w-0 text-right text-[13px] text-white">{children}</span>
  </div>
);

interface OfferReservationCardProps {
  reservation: Reservation;
}

export const OfferReservationCard: React.FC<OfferReservationCardProps> = ({ reservation: res }) => {
  const bType = res.benefitType || 'freeplay_suite';
  const type = TYPE_META[bType] || TYPE_META.freeplay_suite;
  const hasOptions = !!res.optionsList && res.optionsList.length > 0;

  return (
    <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-4 flex flex-col gap-3">
      {/* 상단: 유형·상태 칩 + 신청 번호 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="h-6 px-2 rounded-md text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">{type.icon}</span>
            {type.label}
          </span>
          <span className={`h-6 px-2 rounded-md text-[11px] font-bold border flex items-center ${STATUS_CLASS[res.status] || STATUS_CLASS['대기']}`}>
            {res.status}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">{res.id}</span>
      </div>

      {/* 호텔·상품명 */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold text-white leading-snug">{res.hotelName}</h3>
        <p className="mt-0.5 text-[13px] text-slate-300 leading-snug">{res.roomType}</p>
      </div>

      {/* 상세 */}
      <div className="bg-[#0D1B2A] p-3.5 rounded-xl border border-[#1F334D] flex flex-col gap-2.5 tabular-nums">
        {bType === 'freeplay_suite' && (
          <>
            <Row label="체크인 ~ 체크아웃">
              <span className="font-bold">{res.checkIn} ~ {res.checkOut}</span>
            </Row>
            <Row label="투숙 정보">{res.nights || 2}박 / {res.guests}인</Row>
            <div className="pt-2.5 border-t border-[#1F334D]">
              <Row label="디포짓 코인">
                <span className="text-sm font-extrabold text-[#E2C28E]">
                  {(res.totalCoins ?? res.totalDp ?? 0).toLocaleString()} 코인
                </span>
              </Row>
            </div>
          </>
        )}

        {bType === 'gaming_room' && (
          <>
            <Row label="이용 일자">
              <span className="font-bold">{res.checkIn}</span>
            </Row>
            <Row label="이용 인원">성인 {res.guests}인</Row>
            {hasOptions && (
              <Row label="선택 옵션" alignTop>
                <span className="text-slate-200 leading-snug break-keep">{res.optionsList!.join(', ')}</span>
              </Row>
            )}
            <div className="pt-2.5 border-t border-[#1F334D]">
              <Row label="비용 혜택">
                <span className="font-bold text-[#E2C28E]">VIP 살롱 전액 무상 의전</span>
              </Row>
            </div>
          </>
        )}

        {bType === 'dining' && (
          <>
            <Row label="이용 일자">
              <span className="font-bold">{res.checkIn}</span>
            </Row>
            {res.timeSlot && (
              <Row label="이용 시간대">
                <span className="font-bold">{res.timeSlot}</span>
              </Row>
            )}
            <Row label="예약 인원">성인 {res.guests}인</Row>
            {hasOptions && (
              <Row label="선택 옵션" alignTop>
                <span className="text-slate-200 leading-snug break-keep">{res.optionsList!.join(', ')}</span>
              </Row>
            )}
            <div className="pt-2.5 border-t border-[#1F334D]">
              <Row label="바우처 지원">
                <span className="font-bold text-[#E2C28E]">VIP 다이닝 바우처 전액 지원</span>
              </Row>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
