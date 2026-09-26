# PATCHNOTE — 2026-09-20 FE 작업분 패치 (0003~0008)

## 1. 개요

- **범위**: 9/18 이후 FE(`doubling4ir_app`)에서 작업한 변경사항 중 아직 BE에 전달되지 않은 6건.
- **base 커밋**: `3b99471`(2026-09-14, "포인트 사용처 신규 구현" 커밋) — 단, `doubling4ir_app` 쪽에서 CLAUDE.md 갱신 전용 커밋 1건을 `git rebase --onto`로 제외한 뒤 생성한 패치입니다.
- **패치 개수**: 6개(0003~0008). 원래 base~HEAD 사이에는 0001(BE 3-way 병합 반영 커밋), 0002(dist 빌드산출물 gitignore 정리 커밋)도 포함돼 있었으나, 둘 다 **BE가 이미 보유한 코드이거나 BE 전달과 무관한 내용이라 이번 전달 대상에서 제외**했습니다(`제외_BE전달안함/` 폴더에 별도 보관).

| 순번 | 파일 | 내용 |
|---|---|---|
| 0003 | `0003-DOUBLING-DOUBLE-RING-3-PWA-no-wordmark-2-WILDWYNN.patch` | DOUBLING→DOUBLE RING 리브랜딩(전역 텍스트/로고/문구) |
| 0004 | `0004-fix-YES-NO.patch` | 예측 챌린지 YES/NO 퍼센트 표시 제거 |
| 0005 | `0005-feat.patch` | 회원가입 약관 상세보기 모달 + 로그인/가입 공용 Footer |
| 0006 | `0006-feat.patch` | 연속 출석 스트릭 위젯 개편 + 로그인 보너스 계단식 지급 연동 |
| 0007 | `0007-chore-5-flex-grid-grid-cols-5.patch` | 하단 네비 5탭 간격 균등화 |
| 0008 | `0008-feat-App.tsx-AppContext.tsx-BE-API.patch` | App.tsx(Footer 적용범위 확장) / AppContext.tsx(스트릭·로그인보너스 로직) — BE 민감 영역 |

---

## 2. ⚠️ 필수 확인 사항 — 패치 적용 전 반드시 먼저 확인해주세요

**이 패치를 적용하기 전에, 직전 배치(9/13~14 작업분, 9/19 리브랜딩+BE 병합 반영분)가 이미 BE 쪽에 반영되어 있는지 먼저 확인해 주시기 바랍니다.**

저희 쪽에서 패치 생성 후 `doubling-client-react`(BE 참조 저장소) 기준으로 시뮬레이션 적용을 해봤는데, base 시점 산정 기준 불일치로 몇 차례 혼선이 있었습니다(자세한 내용은 각 패치 설명 참고). 적용 전 기준점이 서로 다르면 이 패치들이 예상과 다르게 충돌하거나, 반대로 조용히 잘못 적용될 수 있으니 꼭 사전에 맞춰주세요.

---

## 3. 패치별 상세 설명

### 0003 — 리브랜딩 (DOUBLING → DOUBLE RING)
- 대부분의 파일(App.tsx, AppContext.tsx, Header.tsx, Logo.tsx, LoginScreen.tsx, LandingScreen.tsx, PwaInstallBanner.tsx, EmailVerifyScreen.tsx, SignUpScreen.tsx, MembershipDashboardScreen.tsx, 로고 이미지 6개, landing.html 등)은 문제없이 적용됩니다.
- **`MyPageScreen.tsx`만 예외**: BE 쪽에서 이 파일의 다른 부분(추천인 코드 생성 로직, 프로필 이미지 URL 규칙 변경 등)을 이미 수정해두어 줄 번호가 밀려 있을 수 있습니다. 이 경우 패치가 실패하더라도 **리브랜딩 대상 텍스트 2곳만 수동으로 찾아 치환**하면 됩니다:
  1. `더블링 포인트 (Doubling Point)` → `더블링 포인트 (Double Ring Point)`
  2. `DOUBLING VIP` → `DOUBLE RING VIP`
- 나머지 코드(추천인 코드 로직 등)는 건드릴 필요 없습니다.

### 0004 — 예측 챌린지 YES/NO 퍼센트 제거
- 홈 카드 / 목록 / 상세 화면에서 막대그래프 위·버튼 텍스트의 퍼센트 숫자만 제거. 막대그래프 자체(비율 계산)는 그대로 유지됩니다. 특이사항 없음.

### 0005 — 회원가입 약관 모달 + 공용 Footer
- `Footer.tsx`, `TermsModal.tsx`, `legalContent.ts` 신규 파일 추가 + `SignUpScreen.tsx` 연결. 특이사항 없음.
- 단, 0008(App.tsx)이 이 신규 `Footer` 컴포넌트를 import하므로, **0005보다 0008을 먼저 적용하면 빌드가 깨집니다.** 반드시 0005를 먼저 적용해 주세요(파일명 번호 순서대로 적용하면 자연히 문제없습니다).

### 0006 — 연속 출석 스트릭 위젯 개편 ⚠️ 가장 중요, BE 사전 확인 필요
- **BE가 이미 `StreakTracker.tsx`에 `claimableMilestone`/`lastClaimedDays` 기반의 헤더 원터치 수령 버튼 로직을 구현해둔 상태**임을 저희 쪽에서 확인했습니다(3/7/14/30일 마일스톤 전체에 범용 대응하는 로직으로, FE의 예전 7일 전용 하드코딩보다 더 발전된 형태였습니다).
- 이번 FE 패치(0006)는 **이 헤더 버튼 로직을 완전히 제거**하고, 4개 마일스톤 노드를 각각 클릭하는 방식(3단계 색상 + D-day 진행 화살표)으로 **일원화**하는 결정을 포함하고 있습니다.
- **BE가 만든 기능을 FE가 대체하는 것이므로, 이 패치를 그대로 적용하기 전에 반드시 BE와 사전 확인을 거쳐주시기를 요청드립니다.** (헤더 원터치 버튼을 없애도 괜찮은지, UX 방향에 동의하는지)
- 참고로 BE의 `claimableMilestone`/`lastClaimedDays`는 서버 API 응답 필드가 아니라 `attendanceStreak`/`claimedStreakMilestones`(둘 다 기존 mock 상태)로부터 그때그때 계산되는 **순수 로컬 파생값**입니다. 즉 이 패치가 서버 데이터 흐름이나 API 계약에 주는 영향은 없습니다 — 순수 UI/UX 로직 문제입니다.

### 0008 — App.tsx / AppContext.tsx (BE 민감 영역)
- App.tsx는 0005에서 만든 `Footer` 컴포넌트를 import하고, 로그인 화면 전용이던 기존 인라인 footer를 로그인+회원가입 공용으로 교체합니다.
- AppContext.tsx는 로그인 보너스 지급액을 고정 150 DP → `streakData.ts`(0006)의 `getLoginBonusAmount()` 계단식 계산으로 변경하고, `claimedStreakMilestones` 초기값의 mock 결함(`[3]`→`[]`)을 수정합니다.
- **⚠️ 순서 의존성**: 이 패치는 0003(리브랜딩 텍스트)이 먼저 적용되어야 정상 적용됩니다. 0003보다 먼저 0008을 적용하면 `App.tsx`의 컨텍스트 라인이 맞지 않아 **실패**할 수 있습니다. 또한 `getLoginBonusAmount`는 0006에서 `streakData.ts`에 추가되는 함수이므로, **0006 없이 0008만 적용하면 import 에러(런타임 시 `getLoginBonusAmount is not a function`)가 발생**합니다. 반드시 0003 → 0006 → 0008 순서(또는 0003~0008 전체를 순서대로)로 적용해 주세요.

---

## 4. 검증 완료 사실

FE 측에서 `doubling-client-react`를 대상으로 한 별도 검증 브랜치(`test/patch-260920-verify`, 로컬 보관 중)에서 이미 아래를 확인했습니다:

- 0003~0008 전체 병합 후 `npm run build` **프로덕션 빌드 통과**
- 실제 앱 구동 후 콘솔 에러 0건 확인
- **실제 구글 OAuth 로그인(`yoono47@gmail.com`)으로 정상 로그인 확인** (캐시된 세션이 아닌 실제 인증 플로우로 재검증)
- 홈/챌린지 목록/상세 화면의 퍼센트 제거, 마이페이지 리브랜딩 텍스트, 스트릭 위젯(헤더 배지만 노출 + 노드 클릭 방식) 모두 정상 렌더링 확인

**별도로 강조드릴 점**: 검증 중 로그인 보너스 모달이 뜨지 않는 현상을 발견했습니다. 원인은 `/members/uAuth` 응답의 `create_date` 필드가 빈 문자열로 내려오는 것이었고, `LoginScreen.tsx`의 `if (!createDate || alreadyClaimed)` 분기 때문에 모달 자체가 스킵됩니다. **이 문제는 이번 0003~0008 패치와는 무관한 기존 BE 응답 데이터 이슈**이며, 로그인 보너스 계단식 지급 로직(`getLoginBonusAmount`) 자체는 코드상 정상입니다. `create_date` 값이 채워지면 정상 노출될 것으로 예상되니, 별도 확인 부탁드립니다.
