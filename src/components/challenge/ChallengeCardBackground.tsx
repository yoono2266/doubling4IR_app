import React from 'react';
import { getChallengeCategoryBackground } from './challengeConfig';

// 2026-10-03: 챌린지 카드 배경 이미지 (카테고리별, 약 35% 농도).
// 부모 카드에 `relative isolate overflow-hidden`이 있어야 함 — 이미지는 카드 배경색 위·카드 내용 아래(-z-10)에 깔린다.
// 등록된 이미지가 없는 카테고리는 아무것도 그리지 않는다.

export const ChallengeCardBackground: React.FC<{ category: string }> = ({ category }) => {
  const src = getChallengeCategoryBackground(category);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-35"
    />
  );
};
