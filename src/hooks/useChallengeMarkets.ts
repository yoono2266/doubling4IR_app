import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CHALLENGE_DUMMY_MARKETS, IS_CHALLENGE_DUMMY_ENABLED } from '../data/challengeDummyData';

// 2026-10-03: 화면에 보여줄 챌린지 목록 = 서버 챌린지(AppContext polyMarkets) + (localhost 개발 환경에서만) 테스트 더미 6건.
// AppContext(BE 로직)는 그대로 두고 화면 쪽에서만 합친다. 라이브에서는 polyMarkets 그대로.
export const useChallengeMarkets = () => {
  const { polyMarkets } = useApp();
  return useMemo(
    () => (IS_CHALLENGE_DUMMY_ENABLED ? [...polyMarkets, ...CHALLENGE_DUMMY_MARKETS] : polyMarkets),
    [polyMarkets]
  );
};
