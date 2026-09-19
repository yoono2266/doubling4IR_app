export type RegionCode = 'ALL' | 'KR' | 'MO' | 'SG' | 'PH' | 'JP';

export interface JackpotItem {
  id: string;
  name: string;
  amountUsd: number;
  badge?: string;
  type?: string;
  // jp_currency (API 원본 통화 코드): 1=USD, 2=홍콩달러, 3=페소, 4=한화. 미지정 시 USD로 간주.
  currency?: string;
  // jp_thumb_url — 게임 썸네일 이미지 파일명(https://dou-cdn.wildwynn.com/jackpots/{thumbUrl}).
  thumbUrl?: string;
}

export interface HotelJackpotData {
  id: string;
  name: string;
  nameEn: string;
  region: 'KR' | 'MO' | 'SG' | 'PH' | 'JP';
  regionLabel: string;
  desc: string;
  image: string;
  badge?: string;
  rating: number;
  jackpots: JackpotItem[];
  // Calculated helper getters
  totalJackpotUsd: number;
  vipTables?: number;
  slots?: number;
}

// ==========================================
// /jackpot/{countryIndex} API 응답 타입 & 매핑
// (JackpotMapScreen에서 실서버로 조회한 hotels/jackpots를 HotelJackpotData 형태로 변환)
// ==========================================
export interface JackpotCountry {
  jp_index: number;
  country_name_ko: string;
  country_name_en: string;
  country_name_en_short: string;
  country_code: string;
  jp_view: number;
  jp_sort: number;
  hotel_count: number;
}

export interface JackpotHotel {
  jp_index: number;
  country_index: number;
  hotel_name_ko: string;
  hotel_name_en: string;
  hotel_code: string;
  jp_view: number;
  jp_sort: number;
  jp_thumb_url: string;
}

export interface JackpotItemResponse {
  jp_index: number;
  hotel_index: number;
  jp_name_ko: string;
  jp_name_en: string;
  jp_sub_name: string;
  jp_desc: string;
  jp_type: number;
  jp_thumb_url: string;
  jp_amount: number | string;
  jp_currency: string;
  jp_sort: number;
}

export interface JackpotApiResponse {
  country: JackpotCountry[];
  hotels: JackpotHotel[];
  jackpots: JackpotItemResponse[];
}

export const toNumber = (value: number | string): number => {
  const parsed = typeof value === 'number' ? value : Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const mapRegionCode = (countryCode: string): Exclude<RegionCode, 'ALL'> => {
  return countryCode.toUpperCase() as Exclude<RegionCode, 'ALL'>;
};

// API의 hotels/jackpots 목록을 화면(JackpotMapScreen, HotelJackpotDetailScreen)에서 공용으로
// 쓰는 HotelJackpotData[] 형태로 변환한다.
export const mapJackpotApiHotels = (data: JackpotApiResponse): HotelJackpotData[] => {
  const countryByIndex = new Map(data.country.map(country => [country.jp_index, country]));
  const jackpotsByHotel = new Map<number, JackpotItemResponse[]>();

  [...data.jackpots]
    .sort((a, b) => a.jp_sort - b.jp_sort)
    .forEach(jackpot => {
      const items = jackpotsByHotel.get(jackpot.hotel_index) ?? [];
      items.push(jackpot);
      jackpotsByHotel.set(jackpot.hotel_index, items);
    });

  return [...data.hotels]
    .sort((a, b) => a.jp_sort - b.jp_sort)
    .filter(hotel => hotel.jp_view !== 0)
    .map((hotel, index) => {
      const country = countryByIndex.get(hotel.country_index);
      const jackpots = jackpotsByHotel.get(hotel.jp_index) ?? [];
      const regionCode = mapRegionCode(country?.country_code ?? '');

      return {
        id: hotel.hotel_code || String(hotel.jp_index),
        name: hotel.hotel_name_ko,
        nameEn: hotel.hotel_name_en,
        region: regionCode,
        regionLabel: country?.country_name_ko ?? '',
        desc: '',
        // jp_thumb_url이 비어 있으면(현재 전부 비어 있음) 국가 코드(MO/PH/SG)별 대체 이미지로 대체.
        image: hotel.jp_thumb_url
          ? `https://dou-cdn.wildwynn.com/hotels/${hotel.jp_thumb_url}`
          : getHotelFallbackImage(regionCode, index),
        rating: 0,
        jackpots: jackpots.map(jackpot => ({
          id: String(jackpot.jp_index),
          name: jackpot.jp_name_ko,
          amountUsd: toNumber(jackpot.jp_amount),
          type: jackpot.jp_type ? String(jackpot.jp_type) : undefined,
          currency: jackpot.jp_currency,
          thumbUrl: jackpot.jp_thumb_url,
        })),
        totalJackpotUsd: jackpots.reduce((sum, jackpot) => sum + toNumber(jackpot.jp_amount), 0),
      };
    });
};

// 2026-09-15: 아래 이미지들은 전부 Unsplash License(무료 상업적 이용 가능) 스톡 사진입니다.
// 해당 카지노/리조트의 실제 브랜드 사진이 아니며, 목록/상세 화면에서 카드 이미지가 전부
// 동일해 보이는 문제를 완화하기 위한 대체 이미지입니다 (실제 브랜드 사진 확보 전 임시 조치).
//
// A) jackpotData.ts 내 HOTELS_JACKPOT_DATA 중 우연히 동일 사진을 공유하던 5개 그룹을
//    구분하기 위한 대체 이미지 (HotelJackpotDetailScreen.tsx에서 사용).
const IMG_GROUP_CASINO_CARDS = 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=800&auto=format&fit=crop&q=80';
const IMG_GROUP_RESORT_POOL = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80';
const IMG_GROUP_SKYLINE_NIGHT = 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800&auto=format&fit=crop&q=80';
const IMG_GROUP_HOTEL_LOBBY = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80';
const IMG_GROUP_OUTDOOR_NIGHT = 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop&q=80';

// B) JackpotMapScreen.tsx(잭팟 목록, 실서버 API 연동 화면)에서 API가 내려주는
//    jp_thumb_url이 비어 있을 때 쓰는 지역별 대체 이미지. 국가 코드(MO/PH/SG)당 2종을
//    번갈아 배정해 "전부 동일 사진" 문제를 완화한다. (A)의 이미지 일부를 재사용한다.
const IMG_FALLBACK_RESORT_EXTERIOR = 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800&auto=format&fit=crop&q=80';
const IMG_FALLBACK_SLOT_MACHINE = 'https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=800&auto=format&fit=crop&q=80';

export const REGION_FALLBACK_IMAGES: Record<'MO' | 'PH' | 'SG', [string, string]> = {
  MO: [IMG_GROUP_CASINO_CARDS, IMG_GROUP_SKYLINE_NIGHT],
  PH: [IMG_GROUP_RESORT_POOL, IMG_GROUP_HOTEL_LOBBY],
  SG: [IMG_GROUP_OUTDOOR_NIGHT, IMG_FALLBACK_RESORT_EXTERIOR],
};

// 위 3개 국가(MO/PH/SG) 외 지역(API에 KR/JP 등이 추가될 경우) 또는 국가 코드를 알 수 없을 때의
// 최종 대체 이미지.
export const DEFAULT_FALLBACK_IMAGE = IMG_FALLBACK_SLOT_MACHINE;

// regionCode(국가 코드)와 목록 내 순번(index)을 받아 대체 이미지를 반환한다.
// JackpotMapScreen.tsx의 mapHotels()에서 jp_thumb_url이 비어 있을 때 호출한다.
export const getHotelFallbackImage = (regionCode: string, index: number): string => {
  const pair = REGION_FALLBACK_IMAGES[regionCode as 'MO' | 'PH' | 'SG'];
  if (!pair) return DEFAULT_FALLBACK_IMAGE;
  return pair[index % 2];
};

// jp_thumb_url(게임 썸네일 파일명)을 실제 조회 가능한 URL로 변환한다.
export const getJackpotThumbUrl = (thumbUrl?: string): string | undefined => {
  if (!thumbUrl) return undefined;
  return `https://dou-cdn.wildwynn.com/jackpots/${thumbUrl}`;
};

const KRW_RATE = 1350;

// jp_currency 코드별 원화 환산 배율: 1=USD, 2=홍콩달러, 3=페소, 4=한화(원본 그대로).
export const CURRENCY_KRW_RATES: Record<string, number> = {
  '1': 1350,
  '2': 150,
  '3': 25,
  '4': 1,
};

export const formatUsd = (val: number): string => {
  return `$${val.toLocaleString()}`;
};

const formatKrwAmount = (krw: number): string => {
  if (krw >= 100_000_000) {
    const eok = Math.floor(krw / 100_000_000);
    const man = Math.round((krw % 100_000_000) / 10_000);
    return man > 0 ? `약 ${eok.toLocaleString()}억 ${man.toLocaleString()}만원` : `약 ${eok.toLocaleString()}억원`;
  }
  const man = Math.round(krw / 10_000);
  return `약 ${man.toLocaleString()}만원`;
};

export const formatKrw = (valUsd: number): string => {
  return formatKrwAmount(valUsd * KRW_RATE);
};

// jp_currency 코드에 맞는 배율로 원화 환산한다 (게임 상세 목록 등 개별 잭팟 금액 표시용).
// currency가 없거나 알 수 없는 코드면 기존 동작(USD 기준)으로 대체한다.
export const formatKrwByCurrency = (amount: number, currency?: string): string => {
  const rate = (currency && CURRENCY_KRW_RATES[currency]) || KRW_RATE;
  return formatKrwAmount(amount * rate);
};

// 18 Hotels Data
export const HOTELS_JACKPOT_DATA: HotelJackpotData[] = [
  // --- KR (3) ---
  {
    id: 'paradise-city',
    name: '파라다이스시티 인천',
    nameEn: 'Paradise City Incheon',
    region: 'KR',
    regionLabel: '대한민국 인천',
    desc: '동북아 최초의 아트테인먼트 복합 리조트, 외국인 전용',
    image: IMG_GROUP_CASINO_CARDS,
    badge: 'HOT 잭팟',
    rating: 4.8,
    vipTables: 40,
    slots: 450,
    totalJackpotUsd: 15830000,
    jackpots: [
      { id: 'pc-1', name: 'Paradise Mega Progressive', amountUsd: 7850000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'pc-2', name: 'Cimer Luxury Suite Pool', amountUsd: 4210000, badge: 'HOT', type: 'VIP Table' },
      { id: 'pc-3', name: 'Chroma Club Grand Pot', amountUsd: 2450000, type: 'Video Slot' },
      { id: 'pc-4', name: 'Artium Diamond Jackpot', amountUsd: 1320000, type: 'Baccarat Pool' }
    ]
  },
  {
    id: 'inspire-resort',
    name: '모히건 인스파이어 엔터테인먼트 리조트',
    nameEn: 'Mohegan Inspire Resort',
    region: 'KR',
    regionLabel: '대한민국 영종도',
    desc: '15,000석 규모 아레나와 대형 디지털 거리를 갖춘 초대형 엔터테인먼트 리조트',
    image: IMG_GROUP_RESORT_POOL,
    badge: 'NEW 리조트',
    rating: 4.9,
    vipTables: 50,
    slots: 700,
    totalJackpotUsd: 18940000,
    jackpots: [
      { id: 'ins-1', name: 'Aurora Digital Mega Pot', amountUsd: 8940000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'ins-2', name: 'Inspire Arena Grand Progressive', amountUsd: 5120000, badge: 'HOT', type: 'VIP Table' },
      { id: 'ins-3', name: 'Splash Bay Golden Jackpot', amountUsd: 3200000, type: 'High Roller' },
      { id: 'ins-4', name: 'Forest Tower Classic Pool', amountUsd: 1680000, type: 'Video Slot' }
    ]
  },
  {
    id: 'kangwon-land',
    name: '강원랜드',
    nameEn: 'Kangwon Land Resort',
    region: 'KR',
    regionLabel: '대한민국 강원도',
    desc: '국내 유일 내국인 출입 허용 사계절 산악형 리조트',
    image: IMG_GROUP_OUTDOOR_NIGHT,
    badge: '국내유일',
    rating: 4.7,
    vipTables: 60,
    slots: 1360,
    totalJackpotUsd: 24600000,
    jackpots: [
      { id: 'kw-1', name: 'High1 Mountain Super Mega', amountUsd: 11250000, badge: 'MEGA', type: 'Super Progressive' },
      { id: 'kw-2', name: 'Super Mega Jackpot 777', amountUsd: 6890000, badge: 'HOT', type: 'Progressive Slot' },
      { id: 'kw-3', name: 'Baekdudaegan Grand Progressive', amountUsd: 4120000, type: 'Table Jackpot' },
      { id: 'kw-4', name: 'Highland Riches Pool', amountUsd: 2340000, type: 'Video Poker' }
    ]
  },

  // --- PH (5) ---
  {
    id: 'solaire',
    name: '솔레어 리조트 앤 카지노',
    nameEn: 'Solaire Resort & Casino',
    region: 'PH',
    regionLabel: '필리핀 마닐라',
    desc: '마닐라 엔터테인먼트 시티를 대표하는 초럭셔리 통합 리조트',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&auto=format&fit=crop&q=80',
    badge: 'TOP 잭팟',
    rating: 4.8,
    vipTables: 45,
    slots: 2600,
    totalJackpotUsd: 34440750,
    jackpots: [
      { id: 'sol-1', name: 'Solaire Grand Mega Pot', amountUsd: 8230450, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'sol-2', name: 'Manila VIP Slots Progressive', amountUsd: 6120300, badge: 'HOT', type: 'VIP Slot' },
      { id: 'sol-3', name: 'Entertainment City Riches', amountUsd: 4890700, type: 'Multi-Link Pool' },
      { id: 'sol-4', name: 'Sky Tower Jackpot', amountUsd: 3560200, type: 'Baccarat Grand' },
      { id: 'sol-5', name: 'Bay View Progressive', amountUsd: 2970800, type: 'Progressive Slot' },
      { id: 'sol-6', name: 'Solaire Diamond Pool', amountUsd: 2340500, type: 'High Roller VIP' },
      { id: 'sol-7', name: 'Luxury Suite Jackpot', amountUsd: 1890300, type: 'Video Slot' },
      { id: 'sol-8', name: 'VIP Table Grand Prize', amountUsd: 1450700, type: 'Table Game' },
      { id: 'sol-9', name: 'Premier Circle Jackpot', amountUsd: 1120400, type: 'Roulette Grand' },
      { id: 'sol-10', name: 'Golden Wave Progressive', amountUsd: 780900, type: 'Progressive Slot' },
      { id: 'sol-11', name: 'City Lights Jackpot', amountUsd: 560300, type: 'Slot Machine' },
      { id: 'sol-12', name: 'Solaire Mini Grand', amountUsd: 390700, type: 'Mini Jackpot' },
      { id: 'sol-13', name: 'Twilight Progressive', amountUsd: 250400, type: 'Video Poker' },
      { id: 'sol-14', name: 'Harbor View Jackpot', amountUsd: 180600, type: 'Link Pool' },
      { id: 'sol-15', name: 'First Light Pool', amountUsd: 95200, type: 'Daily Jackpot' }
    ]
  },
  {
    id: 'okada',
    name: '오카다 마닐라',
    nameEn: 'Okada Manila',
    region: 'PH',
    regionLabel: '필리핀 마닐라',
    desc: '황금빛 외관과 세계 최대급 분수쇼를 자랑하는 복합 리조트',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80',
    badge: '1위 잭팟',
    rating: 4.9,
    vipTables: 48,
    slots: 3000,
    totalJackpotUsd: 53744890,
    jackpots: [
      { id: 'ok-1', name: 'Golden Fortune Progressive', amountUsd: 12458920, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'ok-2', name: "Okada Millionaire's Row", amountUsd: 8320150, badge: 'HOT', type: 'High Roller VIP' },
      { id: 'ok-3', name: 'Dragon Phoenix Jackpot', amountUsd: 6750300, type: 'Multi-Link Pool' },
      { id: 'ok-4', name: 'VIP Baccarat Mega Pool', amountUsd: 5890420, type: 'Baccarat Grand' },
      { id: 'ok-5', name: 'Manila Bay Riches', amountUsd: 4230100, type: 'Video Slot' },
      { id: 'ok-6', name: 'Lucky Fountain Jackpot', amountUsd: 3670800, type: 'Progressive Link' },
      { id: 'ok-7', name: 'Imperial Suite Jackpot', amountUsd: 2980500, type: 'VIP Room Pool' },
      { id: 'ok-8', name: 'Sunset Boulevard Progressive', amountUsd: 2450300, type: 'Slot Machine' },
      { id: 'ok-9', name: 'Diamond Palace Jackpot', amountUsd: 1980700, type: 'Table Grand' },
      { id: 'ok-10', name: 'Casino Royale Grand', amountUsd: 1560200, type: 'Roulette Pool' },
      { id: 'ok-11', name: 'Emerald Tower Jackpot', amountUsd: 1120900, type: 'Video Poker' },
      { id: 'ok-12', name: 'Platinum Circle Pool', amountUsd: 890400, type: 'Link Jackpot' },
      { id: 'ok-13', name: 'Golden Dragon Mini', amountUsd: 620300, type: 'Mini Jackpot' },
      { id: 'ok-14', name: 'Starlight Progressive', amountUsd: 410700, type: 'Daily Progressive' },
      { id: 'ok-15', name: 'Rising Sun Jackpot', amountUsd: 280500, type: 'Daily Pool' }
    ]
  },
  {
    id: 'cod-manila',
    name: '시티 오브 드림스 마닐라',
    nameEn: 'City of Dreams Manila',
    region: 'PH',
    regionLabel: '필리핀 마닐라',
    desc: '럭셔리 호텔 브랜드(하얏트,누와,노부)가 결합된 글로벌 복합 리조트',
    image: IMG_GROUP_CASINO_CARDS,
    badge: 'HOT 잭팟',
    rating: 4.8,
    vipTables: 40,
    slots: 2200,
    totalJackpotUsd: 26953000,
    jackpots: [
      { id: 'cod-1', name: 'Dreams Mega Jackpot', amountUsd: 6120800, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'cod-2', name: 'Nobu Suite Progressive', amountUsd: 4780300, badge: 'HOT', type: 'VIP Table' },
      { id: 'cod-3', name: 'Hyatt Grand Pool', amountUsd: 3890600, type: 'Multi-Link Pool' },
      { id: 'cod-4', name: 'DreamPlay Riches', amountUsd: 3120400, type: 'Video Slot' },
      { id: 'cod-5', name: 'Global Brand Jackpot', amountUsd: 2560700, type: 'Baccarat Grand' },
      { id: 'cod-6', name: 'Manila Fusion Progressive', amountUsd: 1980300, type: 'Table Game' },
      { id: 'cod-7', name: 'VIP Poker Grand Prize', amountUsd: 1560800, type: 'Poker Jackpot' },
      { id: 'cod-8', name: 'Crown Tower Jackpot', amountUsd: 1230500, type: 'Slot Machine' },
      { id: 'cod-9', name: 'Cosmopolitan Progressive', amountUsd: 890700, type: 'Video Poker' },
      { id: 'cod-10', name: 'Nine Dragons Pool', amountUsd: 650300, type: 'Progressive Link' },
      { id: 'cod-11', name: 'Fortune Palace Jackpot', amountUsd: 480600, type: 'Roulette Pool' },
      { id: 'cod-12', name: 'City Dreams Mini', amountUsd: 320400, type: 'Mini Jackpot' },
      { id: 'cod-13', name: 'Evening Star Progressive', amountUsd: 210700, type: 'Daily Pool' },
      { id: 'cod-14', name: 'Golden Gate Jackpot', amountUsd: 140300, type: 'Link Pool' },
      { id: 'cod-15', name: 'New Dawn Pool', amountUsd: 75800, type: 'Hourly Pot' }
    ]
  },
  {
    id: 'newport',
    name: '뉴포트 월드 리조트',
    nameEn: 'Newport World Resorts',
    region: 'PH',
    regionLabel: '필리핀 파사이',
    desc: '마닐라 공항 터미널 3과 직결된 필리핀 최초의 복합 카지노 단지',
    image: IMG_GROUP_SKYLINE_NIGHT,
    badge: '공항직결',
    rating: 4.7,
    vipTables: 38,
    slots: 2000,
    totalJackpotUsd: 12430000,
    jackpots: [
      { id: 'np-1', name: 'Newport Grand Mega Pot', amountUsd: 5820000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'np-2', name: 'Terminal Express Progressive', amountUsd: 3450000, badge: 'HOT', type: 'VIP Table' },
      { id: 'np-3', name: 'Marriott Suite Jackpot', amountUsd: 2180000, type: 'Baccarat Pool' },
      { id: 'np-4', name: 'Newport Link Diamond Pool', amountUsd: 980000, type: 'Video Slot' }
    ]
  },
  {
    id: 'hann-casino',
    name: '한 카지노 리조트',
    nameEn: 'Hann Casino Resort Clark',
    region: 'PH',
    regionLabel: '필리핀 클락',
    desc: '필리핀 클락 경제특구 내 최초의 5성급 럭셔리 카지노 리조트',
    image: IMG_GROUP_HOTEL_LOBBY,
    badge: '클락1위',
    rating: 4.7,
    vipTables: 35,
    slots: 1200,
    totalJackpotUsd: 10460000,
    jackpots: [
      { id: 'hn-1', name: 'Clark Freeport Mega Jackpot', amountUsd: 4750000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'hn-2', name: 'Hann VIP Suite Progressive', amountUsd: 2980000, badge: 'HOT', type: 'VIP Table' },
      { id: 'hn-3', name: 'Bataan Grand Pool', amountUsd: 1840000, type: 'Table Game' },
      { id: 'hn-4', name: 'Swissotel Riches Pool', amountUsd: 890000, type: 'Video Slot' }
    ]
  },

  // --- MO (7) ---
  {
    id: 'venetian-macau',
    name: '베네시안 마카오',
    nameEn: 'The Venetian Macao',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: '이탈리아 베네치아 운하를 재현한 코타이 스트립의 상징적 대형 리조트',
    image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&auto=format&fit=crop&q=80',
    badge: 'TOP 랜드마크',
    rating: 4.9,
    vipTables: 70,
    slots: 3400,
    totalJackpotUsd: 31490000,
    jackpots: [
      { id: 'vm-1', name: 'Grand Canal Mega Progressive', amountUsd: 14580000, badge: 'MEGA', type: 'Mega Progressive' },
      { id: 'vm-2', name: 'Gondola Gold Jackpot', amountUsd: 8230000, badge: 'HOT', type: 'VIP Table' },
      { id: 'vm-3', name: 'St. Mark Riches Pool', amountUsd: 4750000, type: 'Progressive Slot' },
      { id: 'vm-4', name: 'Cotai Strip Grand', amountUsd: 2680000, type: 'Baccarat Pool' },
      { id: 'vm-5', name: 'Rialto Bridge Pool', amountUsd: 1250000, type: 'Video Slot' }
    ]
  },
  {
    id: 'parisian-macau',
    name: '파리지앵 마카오',
    nameEn: 'The Parisian Macao',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: '에펠탑 1/2 모형이 전면에 위치한 파리 테마의 낭만적 럭셔리 리조트',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    badge: '파리테마',
    rating: 4.8,
    vipTables: 50,
    slots: 2500,
    totalJackpotUsd: 19720000,
    jackpots: [
      { id: 'pm-1', name: 'Eiffel Tower Grand Mega', amountUsd: 9420000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'pm-2', name: 'Champs-Élysées Progressive', amountUsd: 5670000, badge: 'HOT', type: 'VIP Table' },
      { id: 'pm-3', name: 'Versailles Gold Jackpot', amountUsd: 3180000, type: 'Baccarat Pool' },
      { id: 'pm-4', name: 'Paris Lights Classic Pool', amountUsd: 1450000, type: 'Video Slot' }
    ]
  },
  {
    id: 'wynn-palace',
    name: '윈 팰리스 마카오',
    nameEn: 'Wynn Palace Cotai',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: '화려한 생화 장식과 스카이캡(케이블카)이 특징인 극강의 하이엔드 리조트',
    image: IMG_GROUP_CASINO_CARDS,
    badge: '초호화 VIP',
    rating: 4.9,
    vipTables: 65,
    slots: 2000,
    totalJackpotUsd: 33560000,
    jackpots: [
      { id: 'wp-1', name: 'SkyCab Mega Jackpot', amountUsd: 15890000, badge: 'MEGA', type: 'High Roller VIP' },
      { id: 'wp-2', name: 'Performance Lake Progressive', amountUsd: 9340000, badge: 'HOT', type: 'Progressive Slot' },
      { id: 'wp-3', name: 'Floral Art Grand Pot', amountUsd: 5210000, type: 'Baccarat Grand' },
      { id: 'wp-4', name: 'Wynn VIP Diamond Pool', amountUsd: 3120000, type: 'Table Jackpot' }
    ]
  },
  {
    id: 'galaxy-macau',
    name: '갤럭시 마카오',
    nameEn: 'Galaxy Macau',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: '금빛 외관과 대형 인공 워터파크를 갖춘 코타이 최대 규모 리조트 단지',
    image: IMG_GROUP_RESORT_POOL,
    badge: '코타이최대',
    rating: 4.9,
    vipTables: 80,
    slots: 3500,
    totalJackpotUsd: 38780000,
    jackpots: [
      { id: 'gm-1', name: 'Grand Resort Deck Mega Pot', amountUsd: 16450000, badge: 'MEGA', type: 'Mega Progressive' },
      { id: 'gm-2', name: 'Diamond Lobby Progressive', amountUsd: 10120000, badge: 'HOT', type: 'VIP Table' },
      { id: 'gm-3', name: 'Golden Galaxy Jackpot', amountUsd: 6340000, type: 'Progressive Slot' },
      { id: 'gm-4', name: 'Banyan Tree Luxury Pool', amountUsd: 3890000, type: 'High Roller' },
      { id: 'gm-5', name: 'Ritz Gold Grand', amountUsd: 1980000, type: 'Video Slot' }
    ]
  },
  {
    id: 'cod-macau',
    name: '시티 오브 드림스 마카오',
    nameEn: 'City of Dreams Macau',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: '자하 하디드가 설계한 모피어스 호텔 등 미래지향적 건축미의 리조트',
    image: IMG_GROUP_SKYLINE_NIGHT,
    badge: '미래지향',
    rating: 4.9,
    vipTables: 60,
    slots: 2200,
    totalJackpotUsd: 28120000,
    jackpots: [
      { id: 'cdm-1', name: 'Morpheus Sky Mega Pot', amountUsd: 13240000, badge: 'MEGA', type: 'Mega Progressive' },
      { id: 'cdm-2', name: 'House of Dancing Water Progressive', amountUsd: 7890000, badge: 'HOT', type: 'VIP Table' },
      { id: 'cdm-3', name: 'Nüwa VIP Grand Jackpot', amountUsd: 4560000, type: 'Baccarat Pool' },
      { id: 'cdm-4', name: 'Cotai Modern Pool', amountUsd: 2430000, type: 'Video Slot' }
    ]
  },
  {
    id: 'mgm-cotai',
    name: 'MGM 코타이',
    nameEn: 'MGM Cotai',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: '보석함을 쌓아 올린 외관과 디지털 아트 광장을 갖춘 예술 리조트',
    image: IMG_GROUP_HOTEL_LOBBY,
    badge: '아트IR',
    rating: 4.8,
    vipTables: 55,
    slots: 2000,
    totalJackpotUsd: 24290000,
    jackpots: [
      { id: 'mgm-1', name: 'Golden Lion Mega Pool', amountUsd: 11670000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'mgm-2', name: 'Spectacle Digital Progressive', amountUsd: 6890000, badge: 'HOT', type: 'VIP Table' },
      { id: 'mgm-3', name: 'Jewel Box Grand Jackpot', amountUsd: 3780000, type: 'Baccarat Grand' },
      { id: 'mgm-4', name: 'Mansion VIP Pool', amountUsd: 1950000, type: 'High Roller' }
    ]
  },
  {
    id: 'grand-lisboa-palace',
    name: '그랜드 리스보아 팰리스 마카오',
    nameEn: 'Grand Lisboa Palace Resort',
    region: 'MO',
    regionLabel: '마카오 코타이',
    desc: 'SJM 그룹의 코타이 플래그십 리조트로 유럽 궁전과 중국 전통의 조화',
    image: IMG_GROUP_OUTDOOR_NIGHT,
    badge: '궁전스타일',
    rating: 4.8,
    vipTables: 55,
    slots: 2100,
    totalJackpotUsd: 22670000,
    jackpots: [
      { id: 'glp-1', name: 'SJM Imperial Mega Jackpot', amountUsd: 10950000, badge: 'MEGA', type: 'Imperial Progressive' },
      { id: 'glp-2', name: 'Palazzo Versace Progressive', amountUsd: 6420000, badge: 'HOT', type: 'VIP Table' },
      { id: 'glp-3', name: 'Karl Lagerfeld Grand Prize', amountUsd: 3580000, type: 'Baccarat Pool' },
      { id: 'glp-4', name: 'Jardim Secreto Pool', amountUsd: 1720000, type: 'Video Slot' }
    ]
  },

  // --- SG (2) ---
  {
    id: 'mbs-singapore',
    name: '마리나 베이 샌즈',
    nameEn: 'Marina Bay Sands Singapore',
    region: 'SG',
    regionLabel: '싱가포르 마리나베이',
    desc: '3개 타워 위 스카이파크와 인피니티 풀로 유명한 싱가포르의 랜드마크',
    image: 'https://images.unsplash.com/photo-1506351421178-63b52a2d2562?w=800&auto=format&fit=crop&q=80',
    badge: '글로벌 랜드마크',
    rating: 4.9,
    vipTables: 60,
    slots: 2500,
    totalJackpotUsd: 40845900,
    jackpots: [
      { id: 'mbs-1', name: 'Sands SkyPark Mega', amountUsd: 9450600, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'mbs-2', name: 'Infinity Pool Progressive', amountUsd: 7230400, badge: 'HOT', type: 'VIP Table' },
      { id: 'mbs-3', name: 'Singapore Landmark Jackpot', amountUsd: 5670800, type: 'Multi-Link Pool' },
      { id: 'mbs-4', name: 'Marina Bay Grand Pool', amountUsd: 4120300, type: 'Baccarat Grand' },
      { id: 'mbs-5', name: 'Three Towers Riches', amountUsd: 3450700, type: 'Video Slot' },
      { id: 'mbs-6', name: 'VIP Gaming Progressive', amountUsd: 2780500, type: 'High Roller VIP' },
      { id: 'mbs-7', name: 'ArtScience Jackpot', amountUsd: 2120300, type: 'Table Jackpot' },
      { id: 'mbs-8', name: 'Celestial Garden Pool', amountUsd: 1650800, type: 'Slot Machine' },
      { id: 'mbs-9', name: 'Premier Suite Jackpot', amountUsd: 1280400, type: 'Roulette Pool' },
      { id: 'mbs-10', name: 'Bayfront Progressive', amountUsd: 920600, type: 'Progressive Slot' },
      { id: 'mbs-11', name: 'Golden Lion Jackpot', amountUsd: 650300, type: 'Video Poker' },
      { id: 'mbs-12', name: 'Sands Mini Grand', amountUsd: 420700, type: 'Mini Jackpot' },
      { id: 'mbs-13', name: 'Starlight Bay Progressive', amountUsd: 280400, type: 'Daily Pool' },
      { id: 'mbs-14', name: 'Harbor Front Jackpot', amountUsd: 150600, type: 'Link Pool' },
      { id: 'mbs-15', name: 'Dawn Light Pool', amountUsd: 85300, type: 'Hourly Pot' }
    ]
  },
  {
    id: 'rws-sentosa',
    name: '리조트 월드 센토사',
    nameEn: 'Resorts World Sentosa',
    region: 'SG',
    regionLabel: '싱가포르 센토사',
    desc: '유니버설 스튜디오와 대형 아쿠아리움이 결합된 가족형 복합 리조트',
    image: IMG_GROUP_CASINO_CARDS,
    badge: '센토사 랜드마크',
    rating: 4.8,
    vipTables: 45,
    slots: 2400,
    totalJackpotUsd: 18640000,
    jackpots: [
      { id: 'rws-1', name: 'Sentosa Universal Mega', amountUsd: 8760000, badge: 'MEGA', type: 'Progressive Slot' },
      { id: 'rws-2', name: 'Ocean Aquarium Progressive', amountUsd: 5320000, badge: 'HOT', type: 'VIP Table' },
      { id: 'rws-3', name: 'Crockfords Tower Grand', amountUsd: 3140000, type: 'Baccarat Pool' },
      { id: 'rws-4', name: 'Festive Hotel Classic Pool', amountUsd: 1420000, type: 'Video Slot' }
    ]
  },

  // --- JP (1) ---
  {
    id: 'mgm-osaka',
    name: 'MGM 오사카 (2030년 개장 예정)',
    nameEn: 'MGM Osaka IR 2030',
    region: 'JP',
    regionLabel: '일본 오사카 유메시마',
    desc: '오사카 유메시마에 들어설 일본 최초의 법정 복합 리조트(IR)',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    badge: '2030 오픈예정',
    rating: 4.9,
    vipTables: 60,
    slots: 3000,
    totalJackpotUsd: 26100000,
    jackpots: [
      { id: 'mgo-1', name: 'Yumeshima Grand IR Mega', amountUsd: 12500000, badge: 'MEGA', type: 'Mega Progressive' },
      { id: 'mgo-2', name: 'Osaka Bay Progressive', amountUsd: 7200000, badge: 'HOT', type: 'VIP Table' },
      { id: 'mgo-3', name: 'Kansai Landmark Jackpot', amountUsd: 4100000, type: 'High Roller Baccarat' },
      { id: 'mgo-4', name: 'Rising Sun IR Classic Pool', amountUsd: 2300000, type: 'Video Slot' }
    ]
  }
];
