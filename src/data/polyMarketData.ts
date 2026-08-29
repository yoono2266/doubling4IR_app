export interface MarketComment {
  id: string;
  author: string;
  avatar: string;
  choice?: string;
  timeAgo: string;
  content: string;
  likes: number;
}

export interface MarketCandidate {
  id: string;
  name: string;
  odds: string;
  percent: number;
}

export interface PolyMarketItem {
  id: string;
  type: 'sports' | 'general'; // sports = Type A, general = Type B
  title: string;
  category: string; // Sports, Crypto, Macro, Tech, Politics, etc.
  leagueName?: string;
  leagueIcon?: string;
  candidates?: MarketCandidate[]; // For Type A sports multi-candidate
  yesOdds?: string;
  noOdds?: string;
  yesValue?: number;
  noValue?: number;
  totalVolumeDp: string;
  description: string;
  rulesText: string;
  contextNews: string;
  comments: MarketComment[];
}

export const INITIAL_POLY_MARKETS: PolyMarketItem[] = [
  // Type A: Sports Markets
  {
    id: 'pm-sports-1',
    type: 'sports',
    title: '2026 UEFA 챔피언스리그 최종 우승 클럽',
    category: 'Sports',
    leagueName: 'UEFA Champions League',
    leagueIcon: 'sports_soccer',
    candidates: [
      { id: 'c-1', name: '레알 마드리드 (Real Madrid)', odds: '36%', percent: 36 },
      { id: 'c-2', name: '맨체스터 시티 (Man City)', odds: '28%', percent: 28 },
      { id: 'c-3', name: '바이에른 뮌헨 (Bayern)', odds: '18%', percent: 18 },
      { id: 'c-4', name: '아스널 / 파리SG / 기타', odds: '18%', percent: 18 }
    ],
    totalVolumeDp: '3,840,000 DP',
    description: '2025-26 시즌 UEFA 챔피언스리그 결승전 승리 및 빅이어를 들어올리는 공식 우승 클럽을 예측합니다.',
    rulesText: '1. UEFA 공식 공식 경기 결과 및 시상 기준에 따라 판정됩니다.\n2. 연장전 및 승부차기 결과가 모두 포함됩니다.\n3. 경기 취소나 일정 연기 시 UEFA 공식 재경기 결정에 따릅니다.',
    contextNews: '레알 마드리드와 맨체스터 시티가 8강 이후 압도적인 전력을 과시하며 배당률 1, 2위를 다투고 있습니다. 특히 음바페의 득점 행진과 홀란드의 활약이 주요 변수로 꼽힙니다.',
    comments: [
      { id: 'mc-1', author: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: '레알 마드리드', timeAgo: '12분 전', content: '챔스의 DNA는 역시 레알 마드리드죠. 100DP 바로 레알에 걸었습니다.', likes: 14 },
      { id: 'mc-2', author: 'SoccerFan99', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', choice: '맨체스터 시티', timeAgo: '35분 전', content: '맨시티 미드필더진 복귀해서 후반기 무패 달리는 중이라 맨시티가 우세해 보입니다.', likes: 8 },
      { id: 'mc-3', author: 'ViperKim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', choice: '바이에른 뮌헨', timeAgo: '1시간 전', content: '해리 케인 첫 챔스 트로피 기원하며 뮌헨에 100DP 투표!', likes: 5 }
    ]
  },
  {
    id: 'pm-sports-2',
    type: 'sports',
    title: '2026 NBA 파이널 총 우승 팀 예측',
    category: 'Sports',
    leagueName: 'NBA Finals 2026',
    leagueIcon: 'sports_basketball',
    candidates: [
      { id: 'nb-1', name: '보스턴 셀틱스 (Celtics)', odds: '41%', percent: 41 },
      { id: 'nb-2', name: '덴버 너게츠 (Nuggets)', odds: '29%', percent: 29 },
      { id: 'nb-3', name: '오클라호마시티 (OKC)', odds: '19%', percent: 19 },
      { id: 'nb-4', name: '기타 플레이오프 진출팀', odds: '11%', percent: 11 }
    ],
    totalVolumeDp: '2,150,000 DP',
    description: '2026 시즌 NBA 파이널 7전 4선승제 승리 래리 오브라이언 트로피 수상 팀을 예측합니다.',
    rulesText: '1. NBA 공식 파이널 경기 종료 시점 챔피언 트로피 수여 팀 기준.\n2. 부상 및 엔트리 변경은 마켓 취소 사유가 되지 않습니다.',
    contextNews: '디펜딩 챔피언 보스턴의 강력한 뎁스와 요키치의 덴버 너게츠가 우승 확률을 양분하는 가운데, OKC의 돌풍이 변수로 떠오르고 있습니다.',
    comments: [
      { id: 'mc-4', author: 'JaysonT', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', choice: '보스턴 셀틱스', timeAgo: '18분 전', content: '보스턴의 슈팅 효율과 수비 로테이션은 이번 시즌도 적수가 없습니다.', likes: 9 },
      { id: 'mc-5', author: 'Dennis Kang', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', choice: '덴버 너게츠', timeAgo: '42분 전', content: '플레이오프의 요키치는 막을 수 없음. 덴버에 투표 완료.', likes: 4 }
    ]
  },
  {
    id: 'pm-sports-3',
    type: 'sports',
    title: '손흥민 선수 토트넘 2026 시즌 20골 이상 기록',
    category: 'Sports',
    leagueName: 'Premier League',
    leagueIcon: 'sports_soccer',
    yesOdds: '74%',
    noOdds: '26%',
    yesValue: 74,
    noValue: 26,
    totalVolumeDp: '1,720,000 DP',
    description: '프리미어리그 및 유럽 대항전 합산 공식 득점 기록 기준 손흥민 선수가 20골 이상을 달성하는지 여부.',
    rulesText: '1. PL 공식 기록 및 UEFA 공식 대회 합산 골 기준.\n2. 친선 경기나 국가대표 A매치 골은 제외됩니다.',
    contextNews: '최근 5경기 4골을 몰아치며 전성기 골 감각을 유지 중인 캡틴 손흥민의 20골 돌파 기대감이 고조되고 있습니다.',
    comments: [
      { id: 'mc-6', author: 'SonnyFan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '5분 전', content: '현재 페이스면 20골은 가볍게 넘깁니다. 무조건 YES!', likes: 23 },
      { id: 'mc-7', author: 'LondonBoy', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '20분 전', content: '페널티킥 전담 키커라 20골 돌파 무난할 것으로 봅니다.', likes: 11 }
    ]
  },

  // Type B: Social / News / Macro / Crypto Markets
  {
    id: 'pm-social-1',
    type: 'general',
    title: '비트코인(BTC) 2026 Q3 내 $100,000 도달 여부',
    category: 'Crypto',
    yesOdds: '68%',
    noOdds: '32%',
    yesValue: 68,
    noValue: 32,
    totalVolumeDp: '2,450,800 DP',
    description: '바이낸스/코인베이스 기준 BTC/USDT 종가가 Q3 마감 시점까지 $100K 이상을 1회 이상 달성하는지 여부.',
    rulesText: '1. Binance, Coinbase, OKX의 현물 가격 기준 $100,000.00 이상 체결 1회 이상 발생 시 YES 판정.\n2. UTC 기준 2026년 9월 30일 23:59:59 마감.',
    contextNews: '기관 투자자들의 비트코인 현물 ETF 자금 유입이 역대 최대치를 기록하며 10만 달러 돌파에 대한 시장 컨센서스가 68%를 상회하고 있습니다.',
    comments: [
      { id: 'mc-8', author: 'CryptoWhale', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '8분 전', content: 'ETF 순유입과 반감기 공급 쇼크가 맞물려서 Q3 내 100K는 기정사실입니다.', likes: 17 },
      { id: 'mc-9', author: 'BearTrader', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '50분 전', content: '거시경제 금리 불확실성과 채굴자 매도 압력 때문에 95K 저항선에서 조정받을 것 같아 NO 선택.', likes: 6 }
    ]
  },
  {
    id: 'pm-social-2',
    type: 'general',
    title: '미 연준(Fed) 차기 FOMC 기준금리 50bp 빅컷 단행 여부',
    category: 'Macro',
    yesOdds: '42%',
    noOdds: '58%',
    yesValue: 42,
    noValue: 58,
    totalVolumeDp: '1,820,300 DP',
    description: '연방공개시장위원회(FOMC) 공식 정례회의 발표문 기준 금리 50bp 이상 인하 발표 여부.',
    rulesText: '1. 미국 연방준비제도(FRB) 공식 성명서 기준 기준금리 상단/하단 50bp 이상 인하 시 YES.\n2. 25bp 인하 또는 동결/인상은 NO 판정.',
    contextNews: '고용지표 둔화와 CPI 완화세에 따라 빅컷 기대감이 조성되었으나, 연준 위원들의 매파적 발언이 이어지며 25bp 인하 가능성에 무게가 실리고 있습니다.',
    comments: [
      { id: 'mc-10', author: 'WallStJournalist', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '15분 전', content: '파월 의장의 성향상 점진적 25bp 인하가 가장 유력합니다.', likes: 12 },
      { id: 'mc-11', author: 'GlobalMacro', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '1시간 전', content: '고용 충격 지표가 나오면 긴급 50bp 빅컷이 불가피할 것입니다.', likes: 5 }
    ]
  },
  {
    id: 'pm-social-3',
    type: 'general',
    title: '스포티파이(Spotify) Q3 월간 활성 사용자(MAU) 6억명 돌파',
    category: 'Tech',
    yesOdds: '81%',
    noOdds: '19%',
    yesValue: 81,
    noValue: 19,
    totalVolumeDp: '940,200 DP',
    description: '스포티파이 공식 Q3 실적 발표 보고서상의 Global MAU 수치 기준 6억 돌파 여부.',
    rulesText: '1. Spotify Investor Relations 공식 공시 실적 보고서의 Monthly Active Users (MAU) 수치 기준.\n2. 600M 이상일 경우 YES 확정.',
    contextNews: '아시아 및 남미 신흥 시장에서의 무료/유료 가입자 전환율이 급증하며 역대 최고 실적 달성이 점쳐지고 있습니다.',
    comments: [
      { id: 'mc-12', author: 'TechWatcher', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '2시간 전', content: 'K-POP과 글로벌 팟캐스트 독점 콘텐츠 확대로 6억명은 무조건 넘깁니다.', likes: 8 }
    ]
  }
];
