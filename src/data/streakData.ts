// 연속 출석 스트릭 마일스톤 정의.
// 3일/7일/14일/30일 도달 시 각각 아래 DP 보너스를 1회 지급.
// 💡 지급되는 DP는 AppContext의 mock 잔액(walletDp)에만 반영되는 시뮬레이션입니다.
export interface StreakMilestone {
  days: number;
  reward: number; // 지급 DP
  message: string; // 마일스톤 달성 축하 토스트 문구 (마일스톤마다 다르게)
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, reward: 100, message: '3일 연속 출석 달성! 좋은 습관의 첫걸음이에요 🎉' },
  { days: 7, reward: 250, message: '7일 연속 출석 성공! 일주일 개근을 축하드려요 🔥' },
  { days: 14, reward: 500, message: '14일 연속 출석 달성! 꾸준함이 빛나고 있어요 💎' },
  { days: 30, reward: 1500, message: '30일 연속 출석 완주! 이달의 진정한 승부사시네요 👑' },
];

export const STREAK_MAX_DAYS = STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days;
