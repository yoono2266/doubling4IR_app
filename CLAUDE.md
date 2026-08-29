# doubling4ir_app — 작업 가이드

React 19 + Vite 기반 앱. 실제 FE 개발은 이 폴더에서 진행합니다.
이 폴더의 상위 관계(배포 참조 폴더 등)는 `D:\dev\Doubling\CLAUDE.md`를 참고하세요.

## 응답 언어

**항상 한국어로 사고하고 한국어로 응답할 것.** 이 규칙은 세션이 새로 시작되어도
계속 적용됩니다.

## 기술 스택 (package.json, vite.config.ts, src/ 직접 확인 기준)

- React 19.0.0 / React DOM 19.0.0
- Vite 6.2.0, @vitejs/plugin-react 4.3.4
- Express 5.2.1 — `server.js`를 통한 dev 서버 (`npm run dev` = `node server.js`)
- framer-motion 12.4.10 — 애니메이션/트랜지션
- lucide-react 0.475.0 — 아이콘
- canvas-confetti 1.9.4 — 리워드/축하 연출
- 빌드: `npm run build` (vite build) / 린트: `npm run lint`는
  `echo 'Linting OK'` placeholder — 실제 린트 미동작

**TypeScript — [확인 필요]**
소스 파일은 `.tsx`/`.ts`로 작성되어 있으나, 이 폴더에는 `tsconfig.json`이
없고 `package.json` dependencies에도 `typescript`, `@types/react`,
`@types/react-dom`이 전혀 등록되어 있지 않음. strict 모드 여부, 실제 타입
체크가 빌드 과정에 포함되는지 확인되지 않음. 새로 타입 관련 작업을 하기 전에
이 프로젝트가 실제로 어떻게 타입을 체크하는지(전역 설치? 별도 설정?) 먼저
확인할 것.

**방향 전환: PWA → 앱스토어 정식 네이티브 앱 (Capacitor)**
이 앱은 원래 PWA(Progressive Web App)로 설계되었으나, 이후 방향이 바뀌어
**안드로이드/애플 앱스토어 정식 출시용 네이티브 앱**으로 개발하기로 결정된
상태입니다. Capacitor 도입은 PWA를 확장하려는 목적이 아니라, **스토어
배포를 위한 네이티브 래핑**이 목적입니다.

- **현재 코드 상태 (전환 이전 단계):**
  - `package.json`, `vite.config.ts`, `src/` 어디에도 Capacitor 관련
    패키지·설정이 아직 없음 — 이 단계에서는 정상 상태이며 문제가 아님.
  - 다만 **PWA 시절의 잔재가 실제로 남아 있음**: `public/manifest.json`,
    `public/sw.js`, 그리고 `src/main.tsx`의 서비스워커 등록 코드
    (`navigator.serviceWorker.register('/sw.js')`)가 확인됨. 이는 이전
    방향(PWA)의 흔적이며, 새 방향(스토어 네이티브 앱)과는 맞지 않는
    레거시 코드입니다.
- **앞으로 지킬 것:**
  - 목표는 스토어 배포용 네이티브 앱이지 PWA가 아님을 항상 전제로 작업할 것.
  - PWA 관련 요소(manifest.json 갱신, service worker 로직 추가/강화,
    `vite-plugin-pwa` 등 PWA 플러그인 도입 등)를 **새로 추가하지 말 것** —
    방향에 맞지 않음.
  - Capacitor 관련 의존성(`@capacitor/*`)이나 `capacitor.config.json`을
    지금 임의로 추가하지 말 것 — 도입 시점과 방식은 별도로 결정됨.
  - 기존 PWA 잔재(manifest.json, sw.js, 서비스워커 등록 코드)는 정리 대상
    후보이지만, 이 문서는 코딩 규칙 문서이므로 **임의로 삭제하지 말고**
    별도 작업 요청이 있을 때 처리할 것.
  - 모바일 전용 기능(네이티브 푸시 알림, 네이티브 Google 로그인 등)을 지금
    구현하려 하지 말 것 — Capacitor 도입 이후로 미룰 것.

## 디렉터리 구조 개요

```
src/
├── App.tsx           # 루트 컴포넌트, 탭 라우팅
├── main.tsx          # React 진입점 (PWA 서비스워커 등록 잔재 포함 — 위 참고)
├── components/       # 재사용 UI 컴포넌트 (Header, BottomNav, JackpotBanner 등)
├── screens/          # 탭/서브 화면 (HomeScreen, LoginScreen, MyPageScreen 등)
├── context/          # AppContext.tsx — 전역 상태 (Redux 없음, Context API만 사용)
├── data/             # 정적/mock 데이터 (jackpotData.ts, polyMarketData.ts 등)
├── assets/           # 이미지, base64 로고
└── types.ts          # 전역 타입 정의 (Post, UserPersona, Reservation 등)
```

**API 호출 계층: 없음.**
`src/` 전체를 확인한 결과 `fetch`, `axios`, 별도 API 클라이언트 파일이
존재하지 않습니다. 모든 데이터는 `src/context/AppContext.tsx`에 인메모리
mock 상태로 하드코딩되어 있고, 화면들은 이 컨텍스트를 `useApp()` 훅으로
구독할 뿐 실제 백엔드 통신은 하지 않습니다. (형제 앱인
`doubling-client-react`에는 `src/utils/apiClient.ts`라는 별도 API 클라이언트가
있지만, 이 폴더에는 아직 이식되지 않은 상태입니다.) 실제 API 연동 작업을
시작할 때는 이 부재 상태를 전제로 새 클라이언트를 설계해야 합니다.

## 코딩 컨벤션

(형제 앱 `doubling-client-react` 분석 및 이 폴더 소스 확인 기반)

**네이밍**
- 화면 컴포넌트: PascalCase + `Screen` 접미사 (`HomeScreen.tsx`, `LoginScreen.tsx`)
- 재사용 컴포넌트: PascalCase (`Header.tsx`, `BottomNav.tsx`)
- 유틸/데이터 파일: camelCase (`jackpotData.ts`)
- 인터페이스/타입: PascalCase (`Post`, `UserPersona`, `Reservation`)
- 상태 변수: camelCase, boolean은 `is`/`has` 접두사
- 상수: UPPER_SNAKE_CASE
- 핸들러 함수: `toggle*`, `set*`, `add*` 패턴

**컴포넌트 스타일**
- `export const ComponentName: React.FC = () => { ... }` 형태의 named export
- Tailwind CSS 클래스로 스타일링 (컴포넌트에 비즈니스 로직 없이 props만 받음)
- 조건부 렌더링은 삼항 연산자 위주

**상태 관리**
- 전역 상태는 `AppContext.tsx`에 집중, `useApp()` 훅으로 접근
- 불변성 유지: spread 연산자로 새 배열/객체 생성 후 setState
  (직접 mutation 금지 — ARCHITECTURE.md에서 안티패턴으로 지적된 부분)

**에러 처리**
- try/catch + `console.error()`, 실패 시 `showToast()`로 사용자 피드백

**주석**
- 기본적으로 "왜"를 설명할 때만 작성, "무엇"을 설명하는 주석은 지양
- 한국어/영어 혼용 허용되나 새 코드에서는 과도한 이모지 주석 지양 권장

**임포트 순서**: React → 서드파티 → 내부 유틸/컴포넌트 → 상대 경로

## 금지 패턴 (CONCERNS.md 기반 — 새 코드에서 반복 금지)

기존 코드에 이미 존재하는 문제들이며, **새로 작성하는 코드에서는 절대 반복하지 말 것**:

- **하드코딩된 mock 인증정보 삽입 금지.**
  현재 `src/screens/LoginScreen.tsx:7-8`에 `kevin@antigravity.vc` /
  `password123`이 기본값으로 박혀 있고, 로그인은 실제 검증 없이
  `setIsLoggedIn(true)`만 호출함. 새 인증 관련 코드는 이 패턴을 복제하지
  말 것 — 실제 백엔드 인증 없이 "로그인 성공"을 흉내 내는 로직을 새로
  추가하지 말 것.
  **이 mock 계정(`kevin@antigravity.vc` / `password123`)은 폐기 예정입니다.**
  새로 작업하는 코드에서 이 계정 정보를 참조하거나 재사용하지 말 것.
- **실제 결제/트랜잭션 처리 미구현 상태.**
  지갑/포인트/베팅 관련 로직은 현재 전부 AppContext 내 메모리 시뮬레이션임.
  새 기능에서 실제 결제인 것처럼 보이는 UI/로직을 추가할 때는 반드시
  "이것이 mock인지 실제 연동인지"를 명확히 구분하고, mock이면 그 사실을
  코드 또는 커밋 메시지에 남길 것.
- **테스트 없이 대형 컴포넌트에 기능 누적 금지.**
  현재 테스트 프레임워크가 전무하고 일부 화면(`MyPageScreen` 등)이 이미
  비대함. 새 기능을 기존 대형 컴포넌트에 그냥 얹지 말고, 가능하면 별도
  컴포넌트/훅으로 분리할 것.
- **실제 린트 없음.** `npm run lint`는 placeholder이므로 통과해도 코드 품질을
  보장하지 않음 — 린트 통과를 "검증 완료"로 착각하지 말 것.
- **더미 서드파티 이미지 URL(Unsplash 등)을 새로 늘리지 말 것.**
  이미 다수 존재하는 하드코딩 패턴이며, 새 데이터 추가 시 가능하면
  로컬 asset이나 설정값으로 분리할 것.
- **PWA 관련 요소를 새로 추가하지 말 것.**
  방향이 스토어 네이티브 앱으로 바뀌었으므로, `manifest.json`/`sw.js` 갱신,
  서비스워커 로직 강화, PWA 플러그인 도입 등은 하지 말 것 (위 [기술 스택]
  섹션 참고).

## 디자인 기준

새 화면/컴포넌트 작업 시 `.claude/skills/design-taste-frontend` 스킬의
기준을 따를 것. 템플릿처럼 보이는 UI, 과도한 기본 스타일 재사용을 피하고
이 앱의 기존 디자인 톤(예: `stitch_doubling_mobile_ui_design/` 참고 자료)과
일관되게 작업할 것.

## 화면 작업 후 검증

화면/UI 변경 작업을 마친 뒤에는 **playwright 또는 chrome-devtools MCP로
직접 앱을 열어 확인**한 후에만 완료 보고를 할 것.
- 코드가 컴파일되거나 타입 에러가 없다는 것만으로 "완료"라고 보고하지 말 것.
- 최소한 변경된 화면을 실제로 렌더링해서 스크린샷/스냅샷으로 확인할 것.
- 확인 없이 "다 됐다"고 말하는 것 금지.

## doubling-client-react 관련 주의사항

`Git_storage/doubling-client-react/`는 BE팀이 관리하는 배포 참조 폴더입니다.
- **읽기 전용으로만 참고할 것** — 컨벤션 비교, 배포된 버전 확인 등 목적으로만 열람.
- 이 폴더의 파일을 직접 수정하지 말 것. FE 패치는 항상 `doubling4ir_app`에서
  작업한 뒤, BE팀에게 전달하는 별도 프로세스를 따를 것 (자동 동기화 없음).
