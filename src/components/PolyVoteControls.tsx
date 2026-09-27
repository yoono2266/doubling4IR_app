import React from 'react';

// 2026-09-27: 예측 챌린지 목록 카드·상세 화면에 복제돼 있던 여론 막대 + YES/NO 버튼을 공용 컴포넌트로 분리.
// - 막대만 있고 수치가 없던 여론 비율에 "YES 62% · NO 38%" 라벨 추가
// - 버튼 높이 44px(size="lg" 48px), 글자 13~14px, 드롭 섀도우 제거, 내가 투표한 쪽은 채움 + 체크 아이콘

interface PolyOddsBarProps {
  yesValue: number;
  noValue: number;
}

export const PolyOddsBar: React.FC<PolyOddsBarProps> = ({ yesValue, noValue }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between text-xs font-bold tabular-nums">
      <span className="text-emerald-300">YES {yesValue}%</span>
      <span className="text-rose-300">NO {noValue}%</span>
    </div>
    <div className="w-full bg-[#0D1B2A] h-2 rounded-full overflow-hidden flex border border-[#1F334D]">
      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${yesValue}%` }} />
      <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${noValue}%` }} />
    </div>
  </div>
);

interface PolyVoteButtonsProps {
  myChoice?: string;
  onVote: (choice: 'YES' | 'NO', e: React.MouseEvent) => void;
  size?: 'md' | 'lg';
}

export const PolyVoteButtons: React.FC<PolyVoteButtonsProps> = ({ myChoice, onVote, size = 'md' }) => {
  const height = size === 'lg' ? 'h-12 text-sm' : 'h-11 text-[13px]';
  const base = `${height} px-3 rounded-xl border font-extrabold transition flex items-center justify-center gap-1.5 active:scale-[0.98]`;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={(e) => onVote('YES', e)}
        aria-pressed={myChoice === 'YES'}
        className={`${base} ${
          myChoice === 'YES'
            ? 'bg-emerald-500 text-[#0D1B2A] border-emerald-400'
            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
        }`}
      >
        <span className="material-symbols-outlined text-base">{myChoice === 'YES' ? 'check_circle' : 'thumb_up'}</span>
        <span>YES</span>
      </button>
      <button
        type="button"
        onClick={(e) => onVote('NO', e)}
        aria-pressed={myChoice === 'NO'}
        className={`${base} ${
          myChoice === 'NO'
            ? 'bg-rose-500 text-white border-rose-400'
            : 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
        }`}
      >
        <span className="material-symbols-outlined text-base">{myChoice === 'NO' ? 'check_circle' : 'thumb_down'}</span>
        <span>NO</span>
      </button>
    </div>
  );
};
