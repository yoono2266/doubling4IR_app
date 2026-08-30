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
  type: 'general' | 'sports';
  title: string;
  category: '사회' | '연예' | '정치' | '인물' | string;
  leagueName?: string;
  leagueIcon?: string;
  candidates?: MarketCandidate[];
  yesOdds: string;
  noOdds: string;
  yesValue: number;
  noValue: number;
  totalVolumeDp: string;
  description: string;
  rulesText: string;
  contextNews: string;
  comments: MarketComment[];
}

export const INITIAL_POLY_MARKETS: PolyMarketItem[] = [
  // 1. 사회 (Society) - Market 1
  {
    id: 'pm-society-1',
    type: 'general',
    title: '주 4일 근무제, 2027년 내 국내 공공기관 시범 도입 여부',
    category: '사회',
    yesOdds: '62%',
    noOdds: '38%',
    yesValue: 62,
    noValue: 38,
    totalVolumeDp: '2,180,000 DP',
    description: '중앙정부 및 주요 공공기관 차원의 주 4일(또는 주 4.5일) 근무제 공식 시범 운영 정책 발표 여부를 예측합니다.',
    rulesText: '1. 정부 부처 및 공공기관 경영평가 기준 시범 도입 공식 고시 발표 시 YES 판정.\n2. 개별 지자체 단위의 소규모 테스트는 제외되며 중앙정부 차원의 가이드라인 제정 기준입니다.\n3. 연내 공식 입법 예고 또는 시범 기관 선정 발표 시 효력이 발생합니다.',
    contextNews: '워라밸 향상과 근로 생산성 제고를 목표로 주 4일제 도입 논의가 국회와 경사노위에서 본격화되면서 시범 사업 추진에 대한 긍정적 여론이 60%를 상회하고 있습니다.',
    comments: [
      { id: 'cm-1', author: 'WorkLifePro', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '8분 전', content: '공공부문부터 단계적 시범 도입하는 방안이 이미 실무 검토 단계인 것으로 알려져 YES가 유력합니다.', likes: 19 },
      { id: 'cm-2', author: 'EconomyWatch', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '25분 전', content: '업종별 생산성 격차와 기업 부담 논란으로 2027년 내 전면 도입은 시기상조일 가능성이 높습니다.', likes: 7 }
    ]
  },

  // 2. 사회 (Society) - Market 2
  {
    id: 'pm-society-2',
    type: 'general',
    title: '초·중등 디지털 AI 교과서 2027년 전국 전면 도입 확정 여부',
    category: '사회',
    yesOdds: '54%',
    noOdds: '46%',
    yesValue: 54,
    noValue: 46,
    totalVolumeDp: '1,640,000 DP',
    description: '교육부 주관 AI 디지털 교과서 사업의 전국 초·중·고교 정규 교과 전면 확대 도입 확정 여부를 예측합니다.',
    rulesText: '1. 교육부 공식 정책 의결 및 전국 공립학교 필수 배포 공고 시 YES 확정.\n2. 시범학교 대상 연구 사업 유예나 도입 연기 결정 시 NO 판정됩니다.\n3. 2027년 1학기 학사 일정 기준 정규 과목 채택 여부를 확인합니다.',
    contextNews: '개인 맞춤형 교육 혁신이라는 기대와 디지털 기기 과몰입 우려가 팽팽하게 맞서며 찬반 여론이 오차범위 내 접전을 벌이고 있습니다.',
    comments: [
      { id: 'cm-3', author: 'EduTech2026', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '14분 전', content: '디지털 전환은 전 세계적 추세라 인프라 정비 후 예정대로 추진될 것으로 봅니다.', likes: 11 },
      { id: 'cm-4', author: 'ParentVoice', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '40분 전', content: '현장 교사 연수와 인프라 검증 부족으로 도입 시기 조율이 불가피해 보입니다.', likes: 9 }
    ]
  },

  // 3. 연예 (Entertainment) - Market 3
  {
    id: 'pm-ent-1',
    type: 'general',
    title: '올해 연말 글로벌 팝 시상식, K-POP 아티스트 종합 대상 수상 여부',
    category: '연예',
    yesOdds: '71%',
    noOdds: '29%',
    yesValue: 71,
    noValue: 29,
    totalVolumeDp: '3,420,000 DP',
    description: '미국 빌보드 뮤직 어워즈(BBMAs) 또는 글로벌 팝 메이저 시상식에서 K-POP 아티스트의 메인 대상(Top Artist 등) 수상 여부를 예측합니다.',
    rulesText: '1. 시상식 주최사 공식 수상자 발표 명단 기준.\n2. 장르 한정 부문상이 아닌 종합 대상(최고 아티스트/앨범상) 수상 시 YES.\n3. 공동 수상 시에도 YES로 인정됩니다.',
    contextNews: '글로벌 스트리밍 차트 1위와 대규모 스타디움 월드 투어를 매진시킨 대표 K-POP 아티스트들의 종합 대상 석권 가능성이 그 어느 때보다 높게 점쳐집니다.',
    comments: [
      { id: 'cm-5', author: 'PopCultureKing', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '5분 전', content: '음원 성적과 글로벌 음반 판매량 모두 압도적 1위라 대상 수상이 확실시됩니다.', likes: 27 },
      { id: 'cm-6', author: 'CriticEye', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '1시간 전', content: '현지 팝스타들의 깜짝 신보 발매 변수가 있어 끝까지 지켜봐야 합니다.', likes: 4 }
    ]
  },

  // 4. 연예 (Entertainment) - Market 4
  {
    id: 'pm-ent-2',
    type: 'general',
    title: '2026 하반기 글로벌 OTT 최고 흥행 시리즈, SF/판타지 장르 여부',
    category: '연예',
    yesOdds: '48%',
    noOdds: '52%',
    yesValue: 48,
    noValue: 52,
    totalVolumeDp: '1,290,000 DP',
    description: '글로벌 주요 OTT 플랫폼 하반기 전 세계 누적 시청 시간 1위 작품의 SF/판타지 장르 해당 여부를 예측합니다.',
    rulesText: '1. 글로벌 공식 시청 시간 집계 톱10 랭킹 1위 작품 공식 장르 기준.\n2. OTT 플랫폼 공식 시놉시스 상 SF/판타지 표기 시 YES 확정.\n3. 범죄/스릴러/로맨스 등 타 장르 1위 시 NO 판정됩니다.',
    contextNews: '하반기 글로벌 대작 SF 프랜차이즈 후속작들과 현실 기반 오리지널 스릴러 시리즈 간의 치열한 글로벌 시청률 경쟁이 예고되고 있습니다.',
    comments: [
      { id: 'cm-7', author: 'CinemaBuff', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '18분 전', content: '최근 트렌드는 가벼운 현실 공감 드라마나 서스펜스물이 대세라 NO에 투표했습니다.', likes: 13 },
      { id: 'cm-8', author: 'SciFiMania', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '50분 전', content: '예고편 조회수만 1억 뷰 돌파한 SF 대작이 대기 중이라 역대급 시청 시간 찍을 겁니다.', likes: 8 }
    ]
  },

  // 5. 정치 (Politics) - Market 5
  {
    id: 'pm-pol-1',
    type: 'general',
    title: '2027 차기 국제 기후정상회의(COP), 아시아 권역 개최국 확정 여부',
    category: '정치',
    yesOdds: '65%',
    noOdds: '35%',
    yesValue: 65,
    noValue: 35,
    totalVolumeDp: '1,950,000 DP',
    description: '유엔 기후변화협약(UNFCCC) 당사국총회 공식 의결 기준 차기 총회 개최지로 아시아 국가 최종 선정 여부를 예측합니다.',
    rulesText: '1. UNFCCC 공식 발표 총회 결정문 기준 아시아-태평양 지역 국가 유치 확정 시 YES.\n2. 기타 대륙 개최지 확정 시 NO 판정.\n3. 총회 최종 세션 공식 의결 결과를 따릅니다.',
    contextNews: '아시아 주요국들의 탄소중립 전환 투자 확대와 글로벌 기후 펀드 기여에 힘입어 차기 정상회의 유치 경쟁에서 우위를 확보하고 있습니다.',
    comments: [
      { id: 'cm-9', author: 'DiplomatKim', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '30분 전', content: '대륙별 순환 개최 관례와 외교적 지지세를 볼 때 아시아 유치가 가장 확실합니다.', likes: 15 },
      { id: 'cm-10', author: 'GlobalPolicy', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '2시간 전', content: '중동 및 남미 국가들의 공격적인 유치 전략이 막판 변수가 될 수 있습니다.', likes: 5 }
    ]
  },

  // 6. 정치 (Politics) - Market 6
  {
    id: 'pm-pol-2',
    type: 'general',
    title: '디지털 자산 및 인공지능 윤리 기본법, 연내 정기국회 본회의 통과 여부',
    category: '정치',
    yesOdds: '59%',
    noOdds: '41%',
    yesValue: 59,
    noValue: 41,
    totalVolumeDp: '2,870,000 DP',
    description: '신산업 규제 표준 및 이용자 보호를 위한 AI·디지털 자산 기본법안의 연내 국회 본회의 최종 의결 여부를 예측합니다.',
    rulesText: '1. 국회 본회의 전자투표 가결 및 공포 절차 착수 시 YES 확정.\n2. 소관 상임위 계류 또는 회기 만료에 따른 폐기 시 NO 판정.\n3. 정기국회 회기 종료일 기준 최종 처리 여부를 확인합니다.',
    contextNews: '여야 모두 미래 먹거리 육성과 부작용 방지 필요성에 공감대를 형성하며 패스트트랙 논의가 급물살을 타고 있습니다.',
    comments: [
      { id: 'cm-11', author: 'LawMaker', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '12분 전', content: '여야 원내지도부 합의 사안으로 올라가 있어서 연내 본회의 통과는 무난할 것입니다.', likes: 18 },
      { id: 'cm-12', author: 'TechLegal', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '45분 전', content: '세부 시행령 조항을 둘러싼 부처 간 이견 조율이 지연될 우려가 있습니다.', likes: 6 }
    ]
  },

  // 7. 인물 (People) - Market 7
  {
    id: 'pm-people-1',
    type: 'general',
    title: "타임(TIME)지 선정 '2026 올해의 인물', 과학/테크 분야 혁신가 선정 여부",
    category: '인물',
    yesOdds: '77%',
    noOdds: '23%',
    yesValue: 77,
    noValue: 23,
    totalVolumeDp: '3,110,000 DP',
    description: "미국 타임(TIME)지 12월호 공식 커버스토리 'Person of the Year'로 AI/우주/바이오 등 과학기술 분야 혁신가 선정 여부를 예측합니다.",
    rulesText: '1. 타임지 공식 웹사이트 및 12월 특별호 공식 발표 기준.\n2. 과학기술 및 테크 산업을 대표하는 창업자/연구자/팀 선정 시 YES.\n3. 정치인/연예인 등 타 분야 단독 선정 시 NO 판정됩니다.',
    contextNews: '차세대 인공지능의 급격한 발전과 민간 우주 탐사 프로젝트 성공이 세계적 반향을 일으키며 테크 혁신가의 선정 확률이 75%를 돌파하고 있습니다.',
    comments: [
      { id: 'cm-13', author: 'TechFuturist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '10분 전', content: '2026년 인류의 가장 큰 화두는 단연 AI 혁신이었기에 테크 인물 선정이 확실합니다.', likes: 22 },
      { id: 'cm-14', author: 'GlobalReader', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '1시간 전', content: '국제 정세 격변으로 평화 운동가나 다자외교 리더가 선정될 가능성도 충분합니다.', likes: 8 }
    ]
  },

  // 8. 인물 (People) - Market 8
  {
    id: 'pm-people-2',
    type: 'general',
    title: '세계적 거장 영화감독 차기작, 국제 영화제 최고상 경쟁부문 노미네이트 여부',
    category: '인물',
    yesOdds: '83%',
    noOdds: '17%',
    yesValue: 83,
    noValue: 17,
    totalVolumeDp: '1,580,000 DP',
    description: '아카데미와 칸 영화제를 석권한 대한민국 대표 거장 감독의 차기 신작 프로젝트가 3대 국제 영화제 공식 경쟁부문에 초청되는지 예측합니다.',
    rulesText: '1. 칸/베니스/베를린 국제 영화제 공식 집행위원회 경쟁부문 라인업 발표 기준.\n2. 비경쟁 초청이나 특별 상영은 제외되며 메인 경쟁부문 공식 초청 시 YES.\n3. 영화제 공식 프레스 릴리스를 기준으로 판정합니다.',
    contextNews: '3년 만에 선보이는 글로벌 합작 프로젝트의 높은 완성도와 사전 시사회 호평에 힘입어 주요 영화제 메인 경쟁부문 진출이 확실시되고 있습니다.',
    comments: [
      { id: 'cm-15', author: 'FilmDirector_J', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', choice: 'YES', timeAgo: '7분 전', content: '거장의 명성과 이번 작품의 사전 평론가 반응을 보면 경쟁부문 초청은 기본입니다.', likes: 25 },
      { id: 'cm-16', author: 'MovieCine', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', choice: 'NO', timeAgo: '35분 전', content: '후반 작업 일정 지연으로 올해 영화제 출품이 내년으로 연기될 가능성도 있습니다.', likes: 3 }
    ]
  }
];
