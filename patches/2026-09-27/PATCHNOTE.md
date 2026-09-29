# PATCHNOTE — 2026-09-27 UIUX최적화(프로그래스,챌린지,마이페이지)_260927_001 (Patch_Ver.260927-001)

## 1. 개요

- **범위**: FE be-sync/a03c10a 이후 커밋 중 BE 전달 대상 18 건
- **base**: BE `a03c10a` (20260921004) = FE 동기화 태그 `be-sync/a03c10a`
- **패치 개수**: 18 개

| 순번 | 파일 | 내용 |
|---|---|---|
| 0001 | `0001-fix-forgot-password.patch` | fix-forgot-password: 비밀번호 찾기 버튼 준비 중 안내로 대체 |
| 0002 | `0002-fix-jackpot-summary-mobile.patch` | fix-jackpot-summary-mobile: 프로그래시브 요약 바 모바일 줄바꿈 수정 |
| 0003 | `0003-fix-home-scroll-reset.patch` | fix-home-scroll-reset: 탭 이동 시 홈 스크롤 위치 오복원 수정 |
| 0004 | `0004-fix-hotel-detail-summary.patch` | fix-hotel-detail-summary: 호텔 상세 금액 크기 통일 및 빈 설명 박스 숨김 |
| 0005 | `0005-style-jackpot-list-summary-2.patch` | style-jackpot-list-summary: 프로그래시브 리스트 제목 변경 및 요약 박스 2행 정렬 |
| 0006 | `0006-fix-usd-two-decimals.patch` | fix-usd-two-decimals: 달러 금액 표기 소수점 두 자리 고정 |
| 0007 | `0007-style-hotel-detail-progressive.patch` | style-hotel-detail-progressive: 호텔 상세 프로그래시브 트리맵·당첨 내역·게임 목록 가독성 개선 |
| 0008 | `0008-style-jackpot-history.patch` | style-jackpot-history: 프로그래시브 당첨 내역 화면 용어·글꼴·금액 표기 통일 |
| 0009 | `0009-style-jackpot-list.patch` | style-jackpot-list: 프로그래시브 리스트 요약 한화 회색 및 카지노 목록 글꼴 통일 |
| 0010 | `0010-chore-hide-badges.patch` | chore-hide-badges: 프로그래시브 화면 뱃지 전체 임시 비활성화 |
| 0011 | `0011-feat-progressive-coming-soon-Coming-Soon.patch` | feat-progressive-coming-soon: 입점 전 호텔 Coming Soon 화면 및 입점 문의 추가 |
| 0012 | `0012-style-mypage-readability.patch` | style-mypage-readability: 마이페이지 메인·설정 화면 가독성 정리 및 표시값 통일 |
| 0013 | `0013-feat-point-exchange.patch` | feat-point-exchange: 포인트 교환소 진입 버튼·태그형 목록·상세 화면 개편 |
| 0014 | `0014-style-mypage-profile.patch` | style-mypage-profile: 프로필 정보 화면 정리 및 공용 멤버십 뱃지 도입 |
| 0015 | `0015-style-offer-history.patch` | style-offer-history: 오퍼 신청 내역 카드 분리·가독성 정리 및 오퍼 탭 연결 |
| 0016 | `0016-style-challenge-history.patch` | style-challenge-history: 예측 챌린지 참여 내역 화면 가독성 정리 |
| 0017 | `0017-style-membership-dashboard.patch` | style-membership-dashboard: 멤버십 등급 관리 화면 정리 및 혜택 신청 오퍼 탭 연결 |
| 0018 | `0018-style-challenge-screens.patch` | style-challenge-screens: 예측 챌린지 목록·상세·리더보드 정리 및 투표 모달 공용화 |

## 2. ⚠️ 필수 확인 사항

- (추가 확인 사항 직접 기입)

## 3. 패치별 설명

### 0001 fix-forgot-password: 비밀번호 찾기 버튼 준비 중 안내로 대체

- 변경 파일: `src/screens/LoginScreen.tsx`
- 설명: (직접 기입)

### 0002 fix-jackpot-summary-mobile: 프로그래시브 요약 바 모바일 줄바꿈 수정

- 변경 파일: `src/screens/JackpotMapScreen.tsx`
- 설명: (직접 기입)

### 0003 fix-home-scroll-reset: 탭 이동 시 홈 스크롤 위치 오복원 수정

- 변경 파일: `src/components/BottomNav.tsx`, `src/utils/scrollMemory.ts`
- 설명: (직접 기입)

### 0004 fix-hotel-detail-summary: 호텔 상세 금액 크기 통일 및 빈 설명 박스 숨김

- 변경 파일: `src/screens/HotelJackpotDetailScreen.tsx`
- 설명: (직접 기입)

### 0005 style-jackpot-list-summary: 프로그래시브 리스트 제목 변경 및 요약 박스 2행 정렬

- 변경 파일: `src/screens/JackpotMapScreen.tsx`
- 설명: (직접 기입)

### 0006 fix-usd-two-decimals: 달러 금액 표기 소수점 두 자리 고정

- 변경 파일: `src/components/JackpotBanner.tsx`, `src/data/jackpotData.ts`
- 설명: (직접 기입)

### 0007 style-hotel-detail-progressive: 호텔 상세 프로그래시브 트리맵·당첨 내역·게임 목록 가독성 개선

- 변경 파일: `src/screens/HotelJackpotDetailScreen.tsx`
- 설명: (직접 기입)

### 0008 style-jackpot-history: 프로그래시브 당첨 내역 화면 용어·글꼴·금액 표기 통일

- 변경 파일: `src/screens/JackpotHistoryScreen.tsx`
- 설명: (직접 기입)

### 0009 style-jackpot-list: 프로그래시브 리스트 요약 한화 회색 및 카지노 목록 글꼴 통일

- 변경 파일: `src/screens/JackpotMapScreen.tsx`
- 설명: (직접 기입)

### 0010 chore-hide-badges: 프로그래시브 화면 뱃지 전체 임시 비활성화

- 변경 파일: `src/screens/HotelJackpotDetailScreen.tsx`, `src/screens/JackpotMapScreen.tsx`
- 설명: (직접 기입)

### 0011 feat-progressive-coming-soon: 입점 전 호텔 Coming Soon 화면 및 입점 문의 추가

- 변경 파일: `src/components/ProgressiveComingSoon.tsx`, `src/screens/HotelJackpotDetailScreen.tsx`
- 설명: (직접 기입)

### 0012 style-mypage-readability: 마이페이지 메인·설정 화면 가독성 정리 및 표시값 통일

- 변경 파일: `src/components/CopyTextButton.tsx`, `src/screens/MyPageScreen.tsx`
- 설명: (직접 기입)

### 0013 feat-point-exchange: 포인트 교환소 진입 버튼·태그형 목록·상세 화면 개편

- 변경 파일: `src/data/pointRedemptionData.ts`, `src/hooks/useInnerStepBack.ts`, `src/screens/MyPageScreen.tsx`, `src/screens/PointRedemptionScreen.tsx`
- 설명: (직접 기입)

### 0014 style-mypage-profile: 프로필 정보 화면 정리 및 공용 멤버십 뱃지 도입

- 변경 파일: `src/components/MembershipBadge.tsx`, `src/screens/MyPageScreen.tsx`
- 설명: (직접 기입)

### 0015 style-offer-history: 오퍼 신청 내역 카드 분리·가독성 정리 및 오퍼 탭 연결

- 변경 파일: `src/components/OfferReservationCard.tsx`, `src/screens/MyPageScreen.tsx`
- 설명: (직접 기입)

### 0016 style-challenge-history: 예측 챌린지 참여 내역 화면 가독성 정리

- 변경 파일: `src/screens/PolyPortfolioHistoryScreen.tsx`
- 설명: (직접 기입)

### 0017 style-membership-dashboard: 멤버십 등급 관리 화면 정리 및 혜택 신청 오퍼 탭 연결

- 변경 파일: `src/data/membershipData.ts`, `src/screens/MembershipDashboardScreen.tsx`
- 설명: (직접 기입)

### 0018 style-challenge-screens: 예측 챌린지 목록·상세·리더보드 정리 및 투표 모달 공용화

- 변경 파일: `src/components/PolyVoteControls.tsx`, `src/components/PolyVoteModals.tsx`, `src/screens/PolyLeaderboardScreen.tsx`, `src/screens/PolyMarketDetailScreen.tsx`, `src/screens/PolyMarketScreen.tsx`
- 설명: (직접 기입)

## 4. 검증 결과

- BE 폴더(`a03c10a`) 적용 시뮬레이션: 통과 (18 개 순서 적용)
- BE 폴더 실제 적용 후 서버 기동·화면 확인: OK
- 검증 후 BE 폴더 원복: 완료 (변경 0)
- 검증 시점 전체 차이: `검증완료_diff_참고용.txt`

```
 src/components/BottomNav.tsx               |   4 ++
 src/components/CopyTextButton.tsx          |  39 ++++++++++++++
 src/components/JackpotBanner.tsx           |   2 +-
 src/components/MembershipBadge.tsx         |  47 +++++++++++++++++
 src/components/OfferReservationCard.tsx    | 124 ++++++++++++++++++++++++++++++++++++++++++++
 src/components/PolyVoteControls.tsx        |  65 +++++++++++++++++++++++
 src/components/PolyVoteModals.tsx          | 254 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 src/components/ProgressiveComingSoon.tsx   | 131 ++++++++++++++++++++++++++++++++++++++++++++++
 src/data/jackpotData.ts                    |   3 +-
 src/data/membershipData.ts                 |   3 +-
 src/data/pointRedemptionData.ts            |  13 ++---
 src/hooks/useInnerStepBack.ts              |  82 +++++++++++++++++++++++++++++
 src/screens/HotelJackpotDetailScreen.tsx   | 144 ++++++++++++++++++++++++++++++++++++---------------
 src/screens/JackpotHistoryScreen.tsx       |  46 ++++++++++------
 src/screens/JackpotMapScreen.tsx           |  45 +++++++++++++---
 src/screens/LoginScreen.tsx                |   7 +++
 src/screens/MembershipDashboardScreen.tsx  | 401 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----------------------------------------------------------------------
 src/screens/MyPageScreen.tsx               | 300 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++------------------------
 src/screens/PointRedemptionScreen.tsx      | 251 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------
 src/screens/PolyLeaderboardScreen.tsx      | 167 +++++++++++++++++++++++++++++++++++++++++++++++++++++++----
 src/screens/PolyMarketDetailScreen.tsx     | 290 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++---------------
 src/screens/PolyMarketScreen.tsx           | 232 +++++++++++++++++++++++++++++++++++++++++----------------------------------------
 src/screens/PolyPortfolioHistoryScreen.tsx | 426 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------------------------------------------------------------------------
 src/utils/scrollMemory.ts                  |  25 ++++++++-
 24 files changed, 2340 insertions(+), 761 deletions(-)
```
