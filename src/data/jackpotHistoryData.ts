// 솔레어 리조트 앤 카지노 잭팟 당첨 기록 (mock).
// 언제 / 얼마 / 게임 이름 / 배팅 금액 / 슬롯 넘버 / 획득자 국적을 담는다.
// 💡 표시용 mock 데이터이며 실제 정산/기록 연동이 아닙니다.
export interface JackpotWinRecord {
  id: string;
  wonAt: string;        // 당첨 일시 (YYYY-MM-DD HH:mm)
  amountUsd: number;    // 획득 금액
  gameName: string;     // 게임 이름
  gameType: string;     // 게임 종류
  betUsd: number;       // 당첨 시 배팅 금액
  slotNo: string;       // 슬롯 넘버 / 머신 번호
  nationality: string;  // 획득자 국적
  flag: string;         // 국기 이모지
}

export const SOLAIRE_JACKPOT_HISTORY: JackpotWinRecord[] = [
  { id: 'sjh-01', wonAt: '2026-08-27 23:41', amountUsd: 8230450, gameName: 'Solaire Grand Mega Pot',        gameType: 'Progressive Slot', betUsd: 12.5, slotNo: 'SLT-A-1187', nationality: '대한민국',   flag: '🇰🇷' },
  { id: 'sjh-02', wonAt: '2026-08-25 18:07', amountUsd: 6120300, gameName: 'Manila VIP Slots Progressive',  gameType: 'VIP Slot',        betUsd: 25.0, slotNo: 'SLT-V-0442', nationality: '일본',       flag: '🇯🇵' },
  { id: 'sjh-03', wonAt: '2026-08-23 02:55', amountUsd: 4890700, gameName: 'Entertainment City Riches',     gameType: 'Multi-Link Pool', betUsd: 8.0,  slotNo: 'SLT-M-2310', nationality: '중국',       flag: '🇨🇳' },
  { id: 'sjh-04', wonAt: '2026-08-21 21:32', amountUsd: 3560200, gameName: 'Sky Tower Jackpot',             gameType: 'Baccarat Grand',  betUsd: 200.0, slotNo: 'TBL-B-014',  nationality: '필리핀',     flag: '🇵🇭' },
  { id: 'sjh-05', wonAt: '2026-08-19 14:18', amountUsd: 2970800, gameName: 'Bay View Progressive',          gameType: 'Progressive Slot', betUsd: 5.0,  slotNo: 'SLT-A-0903', nationality: '대한민국',   flag: '🇰🇷' },
  { id: 'sjh-06', wonAt: '2026-08-17 09:44', amountUsd: 2340500, gameName: 'Solaire Diamond Pool',          gameType: 'High Roller VIP', betUsd: 500.0, slotNo: 'VIP-D-007',  nationality: '싱가포르',   flag: '🇸🇬' },
  { id: 'sjh-07', wonAt: '2026-08-15 03:26', amountUsd: 1890300, gameName: 'Luxury Suite Jackpot',          gameType: 'Video Slot',      betUsd: 3.0,  slotNo: 'SLT-L-1552', nationality: '베트남',     flag: '🇻🇳' },
  { id: 'sjh-08', wonAt: '2026-08-13 20:11', amountUsd: 1450700, gameName: 'VIP Table Grand Prize',         gameType: 'Table Game',      betUsd: 150.0, slotNo: 'TBL-G-021',  nationality: '홍콩',       flag: '🇭🇰' },
  { id: 'sjh-09', wonAt: '2026-08-11 16:39', amountUsd: 1120400, gameName: 'Premier Circle Jackpot',        gameType: 'Roulette Grand',  betUsd: 80.0, slotNo: 'TBL-R-009',  nationality: '대한민국',   flag: '🇰🇷' },
  { id: 'sjh-10', wonAt: '2026-08-09 11:05', amountUsd: 780900,  gameName: 'Golden Wave Progressive',       gameType: 'Progressive Slot', betUsd: 4.5,  slotNo: 'SLT-G-0678', nationality: '태국',       flag: '🇹🇭' },
  { id: 'sjh-11', wonAt: '2026-08-07 22:58', amountUsd: 560300,  gameName: 'City Lights Jackpot',           gameType: 'Slot Machine',    betUsd: 2.0,  slotNo: 'SLT-C-2044', nationality: '말레이시아', flag: '🇲🇾' },
  { id: 'sjh-12', wonAt: '2026-08-05 07:47', amountUsd: 390700,  gameName: 'Solaire Mini Grand',            gameType: 'Mini Jackpot',    betUsd: 1.0,  slotNo: 'SLT-A-0125', nationality: '대만',       flag: '🇹🇼' },
];
