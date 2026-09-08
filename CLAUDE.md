# doubling4ir_app — 작업 가이드

React 19 + Vite 기반 앱. 실제 FE 개발은 이 폴더에서 진행합니다.
이 폴더의 상위 관계(배포 참조 폴더 등)는 `D:\dev\Doubling\CLAUDE.md`를 참고하세요.

## 응답 언어

**항상 한국어로 사고하고 한국어로 응답할 것.** 이 규칙은 세션이 새로 시작되어도
계속 적용됩니다.

## 기술 스택 (package.json / vite.config.ts / tsconfig.json / src 직접 확인 기준)

- React 19.0.0 / React DOM 19.0.0
- Vite 6.2.0, @vitejs/plugin-react 4.3.4
- Express 5.2.1 — `server.js`의 Vite 미들웨어 모드 dev 서버 (`npm run dev` = `node server.js`)
- framer-motion 12.4.10 — 애니메이션/트랜지션
- lucide-react 0.475.0 — 아이콘 (추가로 index.html에서 Material Symbols Outlined,
  bootstrap-icons를 CDN 로드, 폰트는 Pretendard)
- canvas-confetti 1.9.4 — 리워드/축하 연출
- Tailwind는 빌드 파이프라인이 아니라 `index.html`의 Play CDN(`cdn.tailwindcss.com`)으로
  로드되고, 디자인 토큰(gold `#C5A059`, navy surface 계열 등)은 같은 파일의 인라인
  `tailwind.config`에 정의되어 있음.
- 빌드: `npm run build` (`vite build`) / 린트: `npm run lint`는 `echo 'Linting OK'`
  placeholder — 실제 린트 미동작.

**TypeScript**
- `tsconfig.json` 존재: `strict: true`, `target ES2020`, `module ESNext`,
  `moduleResolution: bundler`, `jsx: react-jsx`, `types: ["vite/client"]`,
  `include: ["src"]`.
- `src/vite-env.d.ts`에 `ImportMetaEnv`(`VITE_API_BASE_URL`,
  `VITE_GOOGLE_CLIENT_ID`)와 Google Identity Services용 `window.google` 타입이 선언됨.
- 단, `typescript` 패키지 자체는 devDependencies에 없고 `build` 스크립트에 `tsc`
  단계도 없음. `vite build`는 esbuild 트랜스파일만 하므로 **타입 에러는 빌드를
  막지 않는다.** 타입 체크는 에디터(IDE) 수준에서만 동작 → "타입 통과"를 검증
  완료로 보지 말 것.

**개발 방향: PWA + AOS + iOS 3종 동시 유지·출시 (Capacitor)**

이 앱은 **PWA(Progressive Web App) 모바일 웹 앱**이 기준이고, 그 위에 AOS·iOS
앱스토어 출시가 **추가**되는 구조입니다. 최종적으로 **① PWA 웹, ② AOS 앱,
③ iOS 앱** 3가지를 동시에 유지·출시합니다.

- **기준(source of truth)은 웹 앱(React 코드베이스)입니다.** 화면·기능은 이 React
  코드에서 한 번 만들고, AOS/iOS는 `vite build` 결과물(`dist/`)을 Capacitor로 감쌉니다.
- **빌드 흐름:** `npm run build` = `vite build` 하나뿐이며 `build:android` /
  `build:ios` 같은 별도 스크립트는 **없는 것이 정상**입니다. `dist/`가 그대로
  AOS/iOS 원본이 되고 `npx cap sync android|ios`로 네이티브 셸을 씌웁니다.
- **현재 설정 상태 (확인된 사실):**
  - `package.json`: `@capacitor/core` · `@capacitor/cli` · `@capacitor/android`
    (모두 ^8.5.0), `@capacitor/push-notifications` ^8.1.2,
    `@capawesome/capacitor-google-sign-in` ^0.1.3. devDeps에 `@capacitor/assets`,
    `vite-plugin-pwa` ^1.3.0.
  - `vite.config.ts`: `VitePWA` 구성(manifest 인라인 `SpoOdds App`,
    `registerType: 'autoUpdate'`, `devOptions.enabled: false`).
  - `capacitor.config.json`: `appId: com.spoodds.prod`, `appName: doubling-app`,
    `webDir: dist`. `appId`는 BE/앱 등록 담당자가 관리하는 값이므로 FE에서 건드리지
    않습니다.
  - `android/` 네이티브 프로젝트 폴더 존재. iOS는 아직 `@capacitor/ios` 미설치,
    `ios/` 폴더 없음 — AOS보다 뒤늦게 진행 중인 단계.
- **앞으로 지킬 것:**
  - 이미 설치된 `@capacitor/*`, `vite-plugin-pwa` 등은 3종 출시 구조의 정상
    구성 요소 — 삭제·롤백 금지.
  - 네이티브 전용 기능은 웹(PWA)에서 깨지지 않도록 `Capacitor.isNativePlatform()`
    등으로 분기할 것. (App.tsx의 푸시 알림 초기화가 이 패턴의 예시.)
  - 화면·기능 작업 시 **항상 웹(PWA)에서 먼저 정상 동작 확인**.
  - `capacitor.config.json`, `android/` 등 네이티브 설정을 임의로 크게 바꾸지 말고,
    변경 시 이유를 커밋 메시지에 남길 것.

- **정리 대상 후보 (임의 삭제 금지, 별도 요청 시 처리):**
  - `public/manifest.json`, `public/sw.js`: `vite-plugin-pwa`가 자체 manifest·SW를
    생성하므로 수동 파일과 중복. `index.html`도 `/manifest.json`을 수동 link.
  - `src/main.tsx`의 수동 `navigator.serviceWorker.register('/sw.js')`: vite-plugin-pwa
    자동 SW 등록과 겹치는 레거시.
  - `src/screens/HomeScree_Backup.tsx`: 오타 파일명의 홈 화면 백업본. App.tsx에서
    import되지 않는 죽은 파일.

## 디렉터리 구조 개요

```
src/
├── App.tsx            # 루트. 라우터 없음 — currentTab(jackpot/poly/home/freeroom/my)
│                      #   + currentSubScreen 문자열 switch로 화면 전환. Landing 게이트,
│                      #   네이티브 푸시 초기화, useAppHistory 연결.
├── main.tsx           # React 진입점 (vite-plugin-pwa와 겹치는 수동 SW 등록 포함)
├── context/
│   └── AppContext.tsx # 전역 상태 (Context API only, Redux 없음). useApp() 훅으로 접근.
│                      #   apiCommonClient로 서버 PLM 콘텐츠를 받아 PolyMarketItem으로
│                      #   매핑 + 공통 에러토스트/세션만료 핸들러 등록. 지갑 DP·투표·
│                      #   게시물·예약·스트릭 등은 아직 인메모리 mock (하이브리드 상태).
├── hooks/
│   └── useAppHistory.ts  # 라우터가 없어 device/브라우저 뒤로가기가 앱을 바로 종료시키는
│                         #   문제를 해결. 화면 이동마다 합성 history 엔트리를 쌓아
│                         #   뒤로가기를 앱 내부 이동으로 처리하고, 홈에서 2초 내
│                         #   두 번 누르면 실제 종료.
├── utils/
│   ├── apiClient.ts   # 실제 API 계층. fetch 기반. 두 클라이언트를 export:
│   │                  #   - apiClient: 평범한 REST (get/post/put/patch/delete),
│   │                  #     localStorage authToken을 Bearer로 첨부.
│   │                  #   - apiCommonClient: 서버 공통 규격 {a:세션, b:플랫폼, c:param}
│   │                  #     엔벌로프로 감싸 전송(get/post). 응답의 result 코드로 공통
│   │                  #     에러 토스트 + result 2(세션만료) 시 자동 로그아웃.
│   │                  #   BASE_URL 자동 분기: localhost:3000 → '/api/v1'(Vite 프록시),
│   │                  #   그 외(앱/프로덕션) → 'https://dou-api.wildwynn.com/api/v1'.
│   │                  #   ResultCode enum이 서버 코드(0 성공, 2 세션없음 …)를 미러링.
│   │                  #   localStorage 키: sessionid, _platform_uid, _memid, guest_id,
│   │                  #   authToken, user_info.
│   ├── auth.ts        # 세션 헬퍼: hasStoredSession(), checkLogin()(/members/uchk 호출로
│   │                  #   세션 유효성 + 최신 회원정보 fetch), getStoredUserInfo(local|
│   │                  #   server), clearSession().
│   └── scrollMemory.ts # 공용 <main> 스크롤 컨테이너를 재사용하는 구조라 목록→상세
│                        #   진입 시 목록 스크롤 위치가 유실됨. saveMainScrollTop()으로
│                        #   진입 직전 scrollTop을 모듈 변수에 저장하고
│                        #   restoreMainScrollTop()으로 복귀 시 복원하는 경량 유틸.
├── components/        # 재사용 UI. Header, BottomNav, Logo, JackpotBanner,
│   │                  #   PwaInstallBanner, VideoPromoCard, DailyLoginBonusModal,
│   │                  #   AttendanceStreakWidget, StreakTracker,
│   │                  #   FreeRoomStickyBanner(App.tsx에서 주석 처리됨).
│   └── PolyMarketCarousel.tsx  # 홈 화면용 예측 챌린지(폴리마켓) 카드 캐러셀.
│                      #   polyMarkets를 4.5초 auto-rotate(hover/touch 시 정지),
│                      #   YES/NO → DP 프리셋(100/500/1K/5K) 확인 모달 →
│                      #   /members/plm-memberpick 전송, 성공(result 0) 시 castPolyVote로
│                      #   로컬 반영 + 결과 모달. 카드 클릭 시 poly-market-detail 이동.
├── screens/          # 탭/서브 화면. App.tsx에 연결된 것:
│   │                  #   Landing, Login, SignUp, EmailVerify, Home, JackpotMap,
│   │                  #   HotelJackpotDetail, JackpotHistory, PolyMarket,
│   │                  #   PolyMarketDetail, FreeRoom, MyPage + 모달(FreeRoomBooking,
│   │                  #   GamingRoomBooking, DiningBooking, WritePost), PostDetail.
│   │                  # 아직 App.tsx에 미연결(고아 후보): CompBenefitSelectionScreen,
│   │                  #   CurrentTripSummaryScreen, MembershipDashboardScreen,
│   │                  #   PolyLeaderboardScreen, PolyPortfolioHistoryScreen,
│   │                  #   HomeScree_Backup(죽은 백업).
│   └── PostDetailScreen.tsx  # 커뮤니티/프로모 게시물 상세. selectedPost 기반,
│                      #   tb_type===1(영상 프로모)이면 세로 video 자동재생, 그 외
│                      #   썸네일. 진입 시 미디어 앵커로 스크롤. 좋아요 토글
│                      #   (toggleLikePost)·공유(토스트)·댓글(로컬 state, 로그인 필요).
│                      #   댓글은 서버 미연동 — 하드코딩 초기값 2건.
├── data/             # 정적/mock 데이터: compBenefitData, jackpotData,
│                      #   jackpotHistoryData, membershipData, mockCounts,
│                      #   polyMarketData(INITIAL_POLY_MARKETS), streakData
│                      #   (STREAK_MILESTONES, STREAK_MAX_DAYS). API 호출 없음 — 전부 상수.
├── assets/           # 이미지, base64 로고
├── types.ts          # 전역 타입 (Post, UserPersona, Reservation, PolyVote 등)
└── vite-env.d.ts     # import.meta.env / window.google 타입 선언
```

**API 호출 계층: `src/utils/apiClient.ts` (신규).**
과거엔 API 계층이 없어 모든 데이터가 AppContext 인메모리 mock이었으나, BE 동기화
이후 실제 fetch 클라이언트(`apiClient` / `apiCommonClient`)가 이식됨. 현재는
**하이브리드 상태** — 로그인(`/members/uAuth`, `/members/uchk`), 폴리마켓 콘텐츠,
픽 전송(`/members/plm-memberpick`) 등 일부는 실연동이고, 지갑 DP·게시물·예약·댓글
등은 여전히 AppContext mock. 새 기능 추가 시 이 클라이언트를 재사용하고, mock을
쓰는 부분이면 그 사실을 코드/커밋에 명시할 것.

**API 요청 규격 (apiCommonClient):** 바디는 `{ a: {sessionid}, b: {_platform,
_platform_uid, _platform_bid(게스트 UUID), _memid, _connect_time, ...}, c: {param} }`
형태. GET은 이 a/b/c를 쿼리스트링으로 평탄화. 세션·식별자는 전부 localStorage에서
읽어옴. 이 규격은 BE 계약이므로 임의 변경 금지.

## 코딩 컨벤션

(형제 앱 `doubling-client-react` 분석 및 이 폴더 소스 확인 기반)

**네이밍**
- 화면 컴포넌트: PascalCase + `Screen` 접미사 (`HomeScreen.tsx`)
- 재사용 컴포넌트: PascalCase (`Header.tsx`, `PolyMarketCarousel.tsx`)
- 유틸/데이터/훅 파일: camelCase (`apiClient.ts`, `useAppHistory.ts`)
- 인터페이스/타입: PascalCase — 단 서버 응답 타입은 BE 필드명 그대로 유지
- 상태 변수: camelCase, boolean은 `is`/`has` 접두사
- 상수: UPPER_SNAKE_CASE
- 핸들러 함수: `toggle*`, `set*`, `add*`, `handle*` 패턴

**컴포넌트 스타일**
- `export const ComponentName: React.FC = () => { ... }` named export
- Tailwind 유틸리티 클래스로 스타일링, 색상은 인라인 hex(`#162639` 등) 직접 사용이 많음
- 조건부 렌더링은 삼항 연산자 위주

**상태 관리**
- 전역 상태는 `AppContext.tsx`에 집중, `useApp()` 훅으로 접근
- 불변성 유지: spread로 새 배열/객체 생성 후 setState (직접 mutation 금지)

**에러 처리**
- API: `try/catch` + `console.error()`, 사용자 피드백은 `showToast()`
- `apiCommonClient`는 result 코드 기반 공통 에러 토스트를 자동 처리
  (`suppressErrorToast: true`로 끄고 호출부에서 직접 처리 가능)

**임포트 순서**: React → 서드파티 → 내부 유틸/컨텍스트/컴포넌트 → 상대 경로

## 금지 패턴 (새 코드에서 반복 금지)

기존 코드에 존재하는 문제들이며, **새로 작성하는 코드에서는 반복하지 말 것**:

- **하드코딩된 mock 인증정보를 새로 만들지 말 것.**
  과거 `LoginScreen.tsx`에 있던 `password123` 기본값은 제거됐고, 로그인은
  Google Sign-In + `/members/uAuth`로 실연동됨. `kevin@antigravity.vc`는
  `EmailVerifyScreen.tsx`에 **UI 예시 문구**로만 남아 있음(자격증명 아님) —
  새 코드에서 이 문자열을 인증 로직에 재사용하지 말 것. 실제 백엔드 검증 없이
  "로그인 성공"을 흉내 내는 로직을 새로 추가하지 말 것.
- **실제 결제/트랜잭션은 미구현.**
  지갑 DP·포인트·베팅 정산은 AppContext 메모리 시뮬레이션. 실제 결제처럼 보이는
  UI/로직을 추가할 때는 mock인지 실연동인지 코드/커밋에 명확히 남길 것.
- **테스트 없이 대형 컴포넌트에 기능 누적 금지.**
  테스트 프레임워크가 전무하고 `AppContext.tsx`·`MyPageScreen` 등이 이미 비대함.
  새 기능은 별도 컴포넌트/훅으로 분리할 것.
- **실제 린트·타입 체크가 빌드를 막지 않음.**
  `npm run lint`는 placeholder, `vite build`는 타입 에러를 무시함. 둘 다 통과해도
  "검증 완료"가 아님 — 화면 작업 후 검증(아래) 절차를 따를 것.
- **더미 서드파티 이미지 URL(Unsplash 등)을 새로 늘리지 말 것.**
  새 데이터는 가능하면 로컬 asset이나 CDN 경로(`dou-cdn.wildwynn.com`) 규칙으로 분리.
- **웹(PWA)이 기준.** AOS 전용 기능은 웹에서 없을 때도 앱이 깨지지 않도록 분기할 것.

## BE 민감 영역 — 임의 수정 금지

BE 연동 계약에 해당하므로 **임의로 수정하지 말 것.** 수정이 필요해 보이면 코드를
고치지 말고 먼저 사용자에게 알릴 것.

**절대 건드리지 않을 파일/설정:**
- `server.js` (Express + Vite 미들웨어 설정)
- `capacitor.config.json` (appId `com.spoodds.prod` 등 — 앱 등록 담당자 관리)
- `android/` 폴더 전체, `google-services.json`, `*.keystore`
- `.env`, `.env.*` (환경변수)
- `vite.config.ts`의 `server.proxy` 타겟(`https://dou-api.wildwynn.com`) 및
  `apiClient.ts`의 `BASE_URL` 분기 로직·경로(`/api/v1`)
- `src/utils/apiClient.ts`의 a/b/c 요청 엔벌로프 구조, `ResultCode` enum 값,
  localStorage 키 이름(`sessionid`, `_memid`, `_platform_uid`, `guest_id` 등)
- `src/utils/auth.ts`의 엔드포인트 경로(`/members/uchk` 등)
- `package.json`의 Capacitor·서버 관련 `dependencies`/`scripts`
  (화면 작업용 UI 라이브러리 추가는 예외적으로 허용)

**신중하게 다룰 것 (삭제·리네이밍 금지, 추가만 허용):**
- `src/types.ts`의 기존 인터페이스 필드명, 서버 응답 타입의 필드명
  (`tb_index`, `pm_index`, `memberInfo` 등) — BE 연동 매핑 기준.
- `src/context/AppContext.tsx`의 기존 state 변수명.
- 기존 mock 데이터의 key 이름.

**작업 원칙:**
- 위 항목을 건드려야 할 것 같으면 코드를 고치지 말고 먼저 물어볼 것.
- git diff 전, 위 목록 파일이 의도치 않게 변경 목록에 있지 않은지 항상 확인할 것.

## 디자인 기준

새 화면/컴포넌트 작업 시 `.claude/skills/design-taste-frontend` 스킬 기준을 따를 것.
템플릿처럼 보이는 UI·과도한 기본 스타일 재사용을 피하고, 이 앱의 기존 톤
(gold `#C5A059` + navy surface, `index.html`의 `tailwind.config` 토큰,
`stitch_doubling_mobile_ui_design/` 참고 자료)과 일관되게 작업할 것.

## 화면 작업 후 검증

화면/UI 변경 후에는 **playwright 또는 chrome-devtools MCP로 직접 앱을 열어 확인**한
뒤에만 완료 보고할 것.
- 컴파일·타입 에러 없음만으로 "완료" 보고 금지.
- 최소한 변경된 화면을 실제 렌더링해서 스크린샷/스냅샷으로 확인.
- 확인 없이 "다 됐다" 금지.

## doubling-client-react 관련 주의사항

`Git_storage/doubling-client-react/`는 BE팀이 관리하는 배포 참조 폴더입니다.
- **읽기 전용으로만 참고할 것** — 컨벤션 비교, 배포 버전 확인 용도.
- 직접 수정 금지. FE 패치는 `doubling4ir_app`에서 작업 후 BE팀 전달 프로세스를
  따를 것 (자동 동기화 없음).
