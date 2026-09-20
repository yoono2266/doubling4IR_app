// 연속 출석 스트릭 마일스톤 정의.
// 3일/7일/14일/30일 도달 시 각각 아래 DP 보너스를 1회 지급.
// 💡 지급되는 DP는 AppContext의 mock 잔액(walletDp)에만 반영되는 시뮬레이션입니다.
//
// reward 값은 "오늘의 로그인 보너스" 모달의 계단식 지급액(아래 getLoginBonusAmount)과
// 같은 기준으로 맞춰진 증분값입니다 — 1일차 기준액(DAILY_LOGIN_BONUS_BASE_DP)에
// 이 표를 순서대로 누적하면 1/3/7/14/30일차 목표 지급액(150/1,150/2,650/5,150/15,150)이
// 그대로 나옵니다. (2026-09-20, 기획 확정)
export interface StreakMilestone {
  days: number;
  reward: number; // 지급 DP
  message: string; // 마일스톤 달성 축하 토스트 문구 (마일스톤마다 다르게)
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, reward: 1000, message: '3일 연속 출석 달성! 좋은 습관의 첫걸음이에요 🎉' },
  { days: 7, reward: 1500, message: '7일 연속 출석 성공! 일주일 개근을 축하드려요 🔥' },
  { days: 14, reward: 2500, message: '14일 연속 출석 달성! 꾸준함이 빛나고 있어요 💎' },
  { days: 30, reward: 10000, message: '30일 연속 출석 완주! 이달의 진정한 승부사시네요 👑' },
];

export const STREAK_MAX_DAYS = STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days;

// "오늘의 로그인 보너스" 모달 제목 — 1일차는 고정 문구, 2일차부터는 실제 연속일수를 노출.
export function getLoginBonusTitle(streakDay: number): string {
  if (streakDay < 2) return '1일차 로그인 보너스';
  return `연속 ${streakDay}일차 로그인 보너스`;
}

// 1일차 기준 지급액. STREAK_MILESTONES 는 이 값 위에 누적되는 증분값이다.
export const DAILY_LOGIN_BONUS_BASE_DP = 150;

// "오늘의 로그인 보너스" 지급액 — 연속일수에 따른 계단식 누적.
// 1~2일차: 기준액 그대로. 마일스톤(3/7/14/30일) 도달마다 해당 증분을 누적해
// 다음 마일스톤 전까지 그 금액을 유지한다(예: 4~6일차는 3일차와 동일한 1,150 DP).
// 30일차(마지막 마일스톤) 이후, 즉 31일차부터는 1일차 기준으로 리셋된다.
export function getLoginBonusAmount(streakDay: number): number {
  const effectiveDay = ((streakDay - 1) % STREAK_MAX_DAYS) + 1;
  return STREAK_MILESTONES.reduce(
    (total, milestone) => (effectiveDay >= milestone.days ? total + milestone.reward : total),
    DAILY_LOGIN_BONUS_BASE_DP
  );
}

export interface NextMilestoneProgress {
  nextMilestoneDays: number; // 다음 도달 목표 마일스톤 일수
  daysRemaining: number; // 그 마일스톤까지 남은 일수 (D-N의 N)
}

// 다음 마일스톤까지 남은 일수 계산. 아직 도달하지 못한 마일스톤 중 가장 가까운 것을 찾는다.
// 30일(마지막 마일스톤)까지 이미 도달했다면 다음 목표가 없으므로 null.
export function getNextMilestoneProgress(streakDay: number): NextMilestoneProgress | null {
  const next = STREAK_MILESTONES.find((m) => m.days > streakDay);
  if (!next) return null;
  return { nextMilestoneDays: next.days, daysRemaining: next.days - streakDay };
}
