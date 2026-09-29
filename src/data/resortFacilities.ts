// 2026-09-30: 프로그래시브 리스트 "보유 슬롯 / 보유 테이블" 표시용 정적 참고 데이터 (서버 데이터 아님).
// 출처: 사용자 제공 문서 "아시아 주요 복합리조트 카지노 시설(테이블 및 슬롯) 보유 현황 보고서"
//       (resort_slot_table_no.md — 운영사 공시·IR 자료·각국 규제 당국 발표 기반, 수치는 "약" 기준).
// - 문서에 범위로 적힌 값(예: 650 ~ 700대)은 최대값을 사용.
// - 슬롯 수에는 ETG(전자 테이블 게임) 단말기 포함.
// - 서버 /jackpot 응답에 slot_count·table_count가 오면 서버 값이 우선하고, 없을 때만 이 표를 쓴다
//   (jackpotData.ts mapJackpotApiHotels, BE 요청 REQ-260930-01).
// - 서버 hotel_code를 알 수 없어 서버 호텔 한글명(hotel_name_ko)으로 매칭한다. 공백은 무시하고 비교하며,
//   서버 표기가 문서와 다른 경우(원 팰리스·원 마카오·시티 오브 드림스)는 aliases로 함께 등록.

export interface ResortFacility {
  name: string;
  aliases?: string[];
  tables: number;
  slots: number;
  // 2026-09-30: 오픈 준비중 리조트 — 프로그래시브 리스트에서 클릭 불가 + "오픈 준비중" 표시.
  // 서버 제공 플래그가 없어 FE 정적 값으로 관리 (오픈 시 이 값을 지우면 됨).
  // 현재 솔레어 엔터테인먼트 시티만 오픈, 나머지 20곳은 준비중.
  isPreparing?: boolean;
}

export const RESORT_FACILITIES: ResortFacility[] = [
  // 마카오
  { name: '베네시안 마카오', tables: 800, slots: 3400, isPreparing: true },
  { name: '런던어 마카오', tables: 480, slots: 860, isPreparing: true },
  { name: '파리지앵 마카오', tables: 270, slots: 800, isPreparing: true },
  { name: '샌즈 마카오', tables: 160, slots: 560, isPreparing: true },
  { name: '갤럭시 마카오', tables: 700, slots: 1500, isPreparing: true }, // 문서: 650 ~ 700 / 1,200 ~ 1,500
  { name: '스타월드 마카오', tables: 170, slots: 250, isPreparing: true },
  { name: 'MGM 코타이', tables: 400, slots: 1500, isPreparing: true },
  { name: 'MGM 마카오', tables: 300, slots: 900, isPreparing: true },
  { name: '윈 팰리스', aliases: ['원 팰리스'], tables: 300, slots: 1000, isPreparing: true },
  { name: '윈 마카오', aliases: ['원 마카오'], tables: 250, slots: 600, isPreparing: true },
  { name: '시티 오브 드림스 마카오', aliases: ['시티 오브 드림스'], tables: 450, slots: 1500, isPreparing: true },
  { name: '스튜디오 시티', tables: 250, slots: 650, isPreparing: true },
  { name: '그랜드 리스보아 팰리스', tables: 300, slots: 1000, isPreparing: true },
  { name: '그랜드 리스보아', tables: 260, slots: 700, isPreparing: true },
  // 필리핀
  { name: '솔레어 엔터테인먼트 시티', tables: 400, slots: 2400 },
  { name: '오카다 마닐라', tables: 450, slots: 3000, isPreparing: true },
  { name: '뉴포트 월드 리조트', tables: 300, slots: 2000, isPreparing: true },
  { name: '시티 오브 드림스 마닐라', tables: 290, slots: 2200, isPreparing: true }, // 문서: 270 ~ 290 / 1,600 ~ 2,200
  { name: '한 카지노 리조트', tables: 200, slots: 1000, isPreparing: true },
  // 싱가포르
  { name: '마리나 베이 샌즈', tables: 600, slots: 2400, isPreparing: true }, // 문서: 470 ~ 600 / 2,300 ~ 2,400
  { name: '리조트 월드 센토사', tables: 500, slots: 2400, isPreparing: true }, // 문서: 450 ~ 500 / 2,000 ~ 2,400
];

const normalizeName = (name: string): string => name.replace(/\s+/g, '').toLowerCase();

const FACILITY_BY_NAME = new Map<string, ResortFacility>();
RESORT_FACILITIES.forEach(facility => {
  [facility.name, ...(facility.aliases ?? [])].forEach(name => FACILITY_BY_NAME.set(normalizeName(name), facility));
});

// 호텔 한글명으로 참고 시설 수를 찾는다. 등록되지 않은 이름이면 undefined (화면에는 '-' 표시).
export const findResortFacility = (hotelNameKo?: string): ResortFacility | undefined => {
  if (!hotelNameKo) return undefined;
  return FACILITY_BY_NAME.get(normalizeName(hotelNameKo));
};
