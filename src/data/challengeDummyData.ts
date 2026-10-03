import { PolyMarketItem } from './polyMarketData';

// 2026-10-03: ⚠️ 테스트용 더미 챌린지 6건 (mock) — localhost 개발 환경에서만 서버 챌린지 목록 뒤에 붙는다.
// - 라이브(BE 서버) 빌드에서는 import.meta.env.DEV가 false라 노출되지 않음
// - 서버에 없는 챌린지라 참여는 앱 안에서만 처리(서버 호출 없음), 의견 등록은 막음
// - 멤버십 질문의 {hotel_name}은 테스트용으로 "솔레어 리조트 마닐라"로 치환 (추후 서버가 회원별 호텔명을 넣는 형태 예정)

export const CHALLENGE_DUMMY_ID_PREFIX = 'dummy-';

export const isChallengeDummy = (marketId: string | undefined): boolean =>
  !!marketId && marketId.startsWith(CHALLENGE_DUMMY_ID_PREFIX);

export const IS_CHALLENGE_DUMMY_ENABLED = (() => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
})();

const DUMMY_HOTEL_NAME = '솔레어 리조트 마닐라';

const makeDummy = (key: string, category: string, title: string): PolyMarketItem => ({
  id: `${CHALLENGE_DUMMY_ID_PREFIX}${key}`,
  type: 'general',
  title,
  category,
  yesOdds: '50%',
  noOdds: '50%',
  yesValue: 50,
  noValue: 50,
  totalVolumeDp: '0 DP',
  description: '',
  rulesText: '',
  contextNews: '',
  comments: [],
});

export const CHALLENGE_DUMMY_MARKETS: PolyMarketItem[] = [
  makeDummy('visit', '방문관련', '최근 1년 안에 카지노에서 직접 게임한 적이 있나요?'),
  makeDummy('favorite-game', '선호게임', '카지노에서 니우니우를 직접 해본 적이 있나요?'),
  makeDummy('membership', '멤버십', `${DUMMY_HOTEL_NAME}의 멤버십 등급이 바뀌었나요?`),
  makeDummy('agency', '에이젼시', '가장 최근 카지노 여행에서 에이젼시를 통해 게임했나요?'),
  makeDummy('budget', '예산관련', '가장 최근 카지노 여행의 초기 게임 예산은 100만 원 미만이었나요?'),
  makeDummy('travel-type', '여행타입', '여행 중에도 평소에 쓰던 베개나 잠옷을 챙겨 가나요?'),
];
