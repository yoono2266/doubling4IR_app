import { Post } from '../types';
import { PolyMarketItem } from '../data/polyMarketData';
import { OfferProduct } from '../data/offerRoomData';

// 2026-10-03: 홈 피드 구성 (광고 배너 아래 ~ GNB 위)
//   [콘텐츠(영상·일반 게시물) 1 → 챌린지 1 → 오퍼 1] 순서로 반복하고, 한 종류가 떨어지면 남은 종류끼리 순서대로 계속 나열.
//   콘텐츠는 서버에서 페이지(5개) 단위로 더 불러오므로, 아직 더 불러올 수 있는 동안(contentsComplete=false)에는
//   불러온 콘텐츠 수만큼만 묶음을 만들고, 모두 불러온 뒤에 남은 챌린지·오퍼를 이어서 나열한다.

export type HomeFeedItem =
  | { kind: 'content'; key: string; post: Post }
  | { kind: 'challenge'; key: string; market: PolyMarketItem }
  | { kind: 'offer'; key: string; product: OfferProduct };

// ── 콘텐츠 랜덤 순서 ──────────────────────────────────────────────
// 앱 실행(새로고침)마다 새 순서, 같은 실행 안에서는 고정 (게시물 상세에서 돌아왔을 때 스크롤 위치 복원이 깨지지 않도록).
// 서버 페이지(HOME_POSTS_PAGE_SIZE개) 안에서만 섞는다 — 더 불러올 때 이미 보이는 카드 순서가 바뀌지 않게.
// 전체 랜덤 정렬은 서버가 해야 함 (BE 요청서: 콘텐츠 랜덤 정렬).
export const HOME_POSTS_PAGE_SIZE = 5; // HomeScreen fetchPosts의 limit과 같은 값
const SESSION_SEED = Math.floor(Math.random() * 2 ** 31);

const seededRank = (id: number): number => {
  // 간단한 정수 해시 (mulberry32 한 단계) — 같은 실행 안에서 id별로 고정된 난수
  let t = (id + SESSION_SEED) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const shufflePostsWithinPages = (posts: Post[]): Post[] =>
  posts
    .map((post, index) => ({ post, page: Math.floor(index / HOME_POSTS_PAGE_SIZE), rank: seededRank(post.tb_index) }))
    .sort((a, b) => a.page - b.page || a.rank - b.rank)
    .map((item) => item.post);

// ── 챌린지 순서: 참여하지 않은 챌린지 먼저, 참여한 챌린지는 뒤로 (각 그룹 안에서는 원래 순서) ──
export const orderChallengesForHome = (markets: PolyMarketItem[], votedIds: Set<string>): PolyMarketItem[] => [
  ...markets.filter((m) => !votedIds.has(m.id)),
  ...markets.filter((m) => votedIds.has(m.id)),
];

// ── 오퍼 순서: 내 DOUBLE RING 등급으로 신청 가능한 상품 먼저 ──
//   1) 최소 등급 = 내 등급  2) 최소 등급 < 내 등급  3) 신청 불가(최소 등급 > 내 등급) — 각 그룹 안에서는 원래(표) 순서
//   내 등급을 모르면(비로그인 등) 원래 순서 그대로. tierRankOf: 등급 englishName → 순위(낮을수록 낮은 등급), 모르면 -1
export const orderOffersForHome = (
  products: OfferProduct[],
  myTierRank: number,
  tierRankOf: (englishName: string) => number
): OfferProduct[] => {
  if (myTierRank < 0) return products;
  const group = (p: OfferProduct) => {
    const required = tierRankOf(p.requiredDrTier);
    if (required === myTierRank) return 0;
    if (required >= 0 && required < myTierRank) return 1;
    return 2;
  };
  return products.map((p, i) => ({ p, i, g: group(p) })).sort((a, b) => a.g - b.g || a.i - b.i).map((x) => x.p);
};

// ── 묶음 반복 ──
export const buildHomeFeed = (
  contents: Post[],
  challenges: PolyMarketItem[],
  offers: OfferProduct[],
  contentsComplete: boolean
): HomeFeedItem[] => {
  const feed: HomeFeedItem[] = [];
  let ci = 0;
  let hi = 0;
  let oi = 0;
  while (ci < contents.length || hi < challenges.length || oi < offers.length) {
    // 콘텐츠를 더 불러올 수 있는데 불러온 콘텐츠를 다 썼으면 여기서 멈춤 (다음 페이지가 오면 이어서 구성)
    if (ci >= contents.length && !contentsComplete) break;
    if (ci < contents.length) {
      const post = contents[ci++];
      feed.push({ kind: 'content', key: `content-${post.tb_index}`, post });
    }
    if (hi < challenges.length) {
      const market = challenges[hi++];
      feed.push({ kind: 'challenge', key: `challenge-${market.id}`, market });
    }
    if (oi < offers.length) {
      const product = offers[oi++];
      feed.push({ kind: 'offer', key: `offer-${product.id}`, product });
    }
  }
  return feed;
};
