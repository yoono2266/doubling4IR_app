import React from 'react';

// 2026-09-27: 멤버십 등급 뱃지 (마이페이지 메인 닉네임 옆, 프로필 정보 닉네임 옆·멤버십 등급 행 공용).
// onClick을 주면 버튼(예: 멤버십 등급 관리로 이동), 없으면 단순 표시용 span으로 렌더링한다.
// size: 'md'(기본, 11px) / 'lg'(13px, 프로필 정보 화면 닉네임 옆)

interface MembershipBadgeProps {
  tierName: string;
  onClick?: () => void;
  title?: string;
  size?: 'md' | 'lg';
}

const BASE_CLASS =
  'inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#C5A059]/30 to-[#E2C28E]/20 border border-[#C5A059]/60 text-white font-black shrink-0';
const SIZE_CLASS = {
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-[13px] px-2.5 py-1',
};
const ICON_CLASS = {
  md: 'text-xs',
  lg: 'text-sm',
};

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({ tierName, onClick, title, size = 'md' }) => {
  const BADGE_CLASS = `${BASE_CLASS} ${SIZE_CLASS[size]}`;
  const content = (
    <>
      <span className={`material-symbols-outlined ${ICON_CLASS[size]} text-[#E2C28E]`}>workspace_premium</span>
      <span>{tierName}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={`${BADGE_CLASS} hover:brightness-125 transition`}>
        {content}
      </button>
    );
  }

  return (
    <span title={title} className={BADGE_CLASS}>
      {content}
    </span>
  );
};
