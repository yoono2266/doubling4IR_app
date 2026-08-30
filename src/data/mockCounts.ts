// API가 주는 좋아요/북마크 수가 비현실적으로 작을 때(초기 mock 값), 게시글 id 기반의
// 결정론적 수치로 보정해 표시한다. 실제 카운트가 충분(>= 15)하면 원본을 그대로 사용한다.
// 💡 표시 전용 mock 보정이며 서버 카운트를 바꾸지 않는다.
export const displayLikeCount = (id: number, raw: number): number =>
  raw >= 15 ? raw : 47 + (Math.abs(id | 0) * 53) % 420;

export const displayBookmarkCount = (id: number, raw: number): number =>
  raw >= 15 ? raw : 12 + (Math.abs(id | 0) * 29) % 140;
