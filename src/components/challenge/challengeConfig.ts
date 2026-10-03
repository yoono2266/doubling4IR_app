import { PolyMarketItem } from '../../data/polyMarketData';

// 2026-10-03: 챌린지(구 예측 챌린지) 참여 방식 개편 공용 설정.
// - DP를 걸지 않고, 참여(YES/NO 선택) 즉시 DP 지급
// - 참여 인원이 RESULT_THRESHOLD에 도달할 때까지 "의견 수집중"만 표시, 도달 후 YES/NO 비율 공개
// ⚠️ 임시값·미연동 (BE 요청서 REQ-261003-02):
//   - CHALLENGE_REWARD_DP: BO에서 설정할 지급 DP. 서버 제공 전 임시 50DP(화면 안내용 mock — 실제 잔액은 BE 지급 기능 필요)
//   - 참여 인원 수: 서버 응답에 필드가 없어 항상 "의견 수집중". BE가 pm_pick_count(가칭)를 주면
//     AppContext의 마켓 매핑에 pickCount를 추가해야 함(AppContext는 BE 로직이라 그때 승인 후 수정)

export const CHALLENGE_REWARD_DP = 50;
export const CHALLENGE_RESULT_THRESHOLD = 100;

export const getChallengePickCount = (market: PolyMarketItem): number | undefined => {
  const value = market.pickCount;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

export const isChallengeResultOpen = (market: PolyMarketItem): boolean =>
  (getChallengePickCount(market) ?? 0) >= CHALLENGE_RESULT_THRESHOLD;

// 2026-10-03: 카테고리별 챌린지 카드 배경 이미지 (챌린지 목록·홈 캐러셀 카드에 약 35% 농도로 깔림).
// 현재 스포츠만 등록 — 다른 카테고리는 이미지를 받으면 여기에 추가. 등록 안 된 카테고리는 배경 없음.
const CHALLENGE_CATEGORY_BACKGROUNDS: Record<string, string> = {
  스포츠: '/images/challenge/category-sports.avif',
  // 2026-10-03: 테스트 더미 챌린지 카테고리 이미지 (사용자 제공)
  방문관련: '/images/challenge/category-visit.avif',
  선호게임: '/images/challenge/category-favorite-game.avif',
  멤버십: '/images/challenge/category-membership.avif',
  에이젼시: '/images/challenge/category-agency.avif',
  예산관련: '/images/challenge/category-budget.avif',
  여행타입: '/images/challenge/category-travel-type.avif',
};

export const getChallengeCategoryBackground = (category: string): string | undefined =>
  CHALLENGE_CATEGORY_BACKGROUNDS[(category || '').trim()];
