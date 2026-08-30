// 연속 출석 스트릭 마일스톤 정의.
// 3일/7일/14일/30일 도달 시 각각 아래 DP 보너스를 1회 지급.
// 💡 지급되는 DP는 AppContext의 mock 잔액(walletDp)에만 반영되는 시뮬레이션입니다.
export interface StreakMilestone {
  days: number;
  reward: number; // 지급 DP
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, reward: 100 },
  { days: 7, reward: 250 },
  { days: 14, reward: 500 },
  { days: 30, reward: 1500 },
];

export const STREAK_MAX_DAYS = STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days;
