import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── 날짜 헬퍼 (달력 공용) ──────────────────────────────
const MS_DAY = 86_400_000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromKey = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const diffDays = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_DAY);
const monthFirst = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export type RangeValue = { start: string; end: string };

interface MonthCalendarProps {
  /** 'single': 날짜 1개 / 'range': 체크인~체크아웃 */
  mode: 'single' | 'range';
  /** single: 'YYYY-MM-DD' | '' · range: { start, end } (빈 문자열 허용) */
  value: string | RangeValue;
  onChange: (next: string | RangeValue) => void;
  /** 이 날짜 이전은 선택 불가. 기본값: 오늘 */
  minDate?: Date;
  /** 오늘 기준 이동 가능한 최대 개월 수. 기본값: 3 */
  maxMonthsAhead?: number;
  /** range 모드 전용: 최대 숙박일수. 기본값: 14 */
  maxNights?: number;
  /** range 모드 전용: maxNights 초과 선택 시 호출 (부모가 토스트 등 처리) */
  onMaxNightsExceeded?: () => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  mode,
  value,
  onChange,
  minDate,
  maxMonthsAhead = 3,
  maxNights = 14,
  onMaxNightsExceeded
}) => {
  const realToday = startOfDay(new Date());
  const min = startOfDay(minDate ?? new Date());
  const [viewMonth, setViewMonth] = useState<Date>(() => monthFirst(min));

  const single = mode === 'single' ? (value as string) : '';
  const range = mode === 'range' ? (value as RangeValue) : { start: '', end: '' };
  const rangeStart = range.start ? fromKey(range.start) : null;
  const rangeEnd = range.end ? fromKey(range.end) : null;

  const handleDayClick = (day: Date) => {
    if (day < min) return;

    if (mode === 'single') {
      onChange(toKey(day));
      return;
    }

    // range: 아직 체크인이 없거나 / 이미 둘 다 골랐거나 / 체크인 이하 날짜 → 새 체크인으로 리셋
    if (!rangeStart || rangeEnd || day <= rangeStart) {
      onChange({ start: toKey(day), end: '' });
      return;
    }
    // 체크인만 있는 상태에서 그 이후 날짜 → 체크아웃 확정
    const n = diffDays(rangeStart, day);
    if (n > maxNights) {
      onMaxNightsExceeded?.();
      return;
    }
    onChange({ start: range.start, end: toKey(day) });
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const cells: (Date | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1))
  ];
  const canPrev = viewMonth > monthFirst(min);
  const canNext = viewMonth < addMonths(monthFirst(min), maxMonthsAhead);

  return (
    <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-3.5 space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && setViewMonth(addMonths(viewMonth, -1))}
          disabled={!canPrev}
          className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#1F334D] flex items-center justify-center text-[#C5A059] hover:border-[#C5A059]/50 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-extrabold text-white">
          {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
        </span>
        <button
          type="button"
          onClick={() => canNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canNext}
          className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#1F334D] flex items-center justify-center text-[#C5A059] hover:border-[#C5A059]/50 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="다음 달"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`text-[10px] font-bold ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-slate-500'}`}
          >
            {w}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <span key={`blank-${idx}`} />;

          const key = toKey(day);
          const isPast = day < min;
          const isToday = diffDays(realToday, day) === 0;
          const isSingleSel = mode === 'single' && single === key;
          const isStart = rangeStart ? diffDays(rangeStart, day) === 0 : false;
          const isEnd = rangeEnd ? diffDays(rangeEnd, day) === 0 : false;
          const inRange = rangeStart && rangeEnd ? day > rangeStart && day < rangeEnd : false;
          const isEndpoint = isSingleSel || isStart || isEnd;

          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => handleDayClick(day)}
              className={[
                'h-9 rounded-lg text-xs font-bold flex items-center justify-center transition',
                isPast ? 'text-slate-600 cursor-not-allowed' : 'text-slate-200 hover:bg-[#0D1B2A]',
                isEndpoint ? 'bg-[#C5A059] text-[#0D1B2A] font-extrabold' : '',
                inRange ? 'bg-[#C5A059]/20 text-[#E2C28E]' : '',
                isToday && !isEndpoint ? 'ring-1 ring-[#C5A059]/60' : ''
              ].join(' ')}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
