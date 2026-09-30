# PATCHNOTE — 2026-09-30 프로그래시브&오퍼_리뉴얼_260930_001 (Patch_Ver.260930-001)

## 1. 개요

- **범위**: FE be-sync/108e123 이후 커밋 중 BE 전달 대상 7 건
- **base**: BE `108e123` (20260928003) = FE 동기화 태그 `be-sync/108e123`
- **패치 개수**: 7 개

| 순번 | 파일 | 내용 |
|---|---|---|
| 0001 | `0001-fix-bottomnav-label-GNB.patch` | fix-bottomnav-label: GNB 프로그래시브 라벨 한 줄 표시 |
| 0002 | `0002-style-number-font-Roboto.patch` | style-number-font: 전 화면 숫자 폰트 Roboto 적용 |
| 0003 | `0003-fix-bottomnav-jackpot-tab-GNB.patch` | fix-bottomnav-jackpot-tab: GNB 프로그래시브 탭 리스트 화면 이동 |
| 0004 | `0004-feat-jackpot-list-resort.patch` | feat-jackpot-list-resort: 프로그래시브 리스트 국가 탭·리조트 목록 개편 |
| 0005 | `0005-feat-jackpot-php-krw-PHP-KRW.patch` | feat-jackpot-php-krw: 잭팟 상세·당첨 내역 PHP/KRW 표기 개편 |
| 0006 | `0006-feat-offer-room-renewal.patch` | feat-offer-room-renewal: 오퍼 탭 룸 오퍼 리뉴얼 |
| 0007 | `0007-feat-solaire-exterior-image.patch` | feat-solaire-exterior-image: 솔레어 상세 롤링·홈 배너 전경 사진 적용 |

## 2. ⚠️ 필수 확인 사항

- (추가 확인 사항 직접 기입)

## 3. 패치별 설명

### 0001 fix-bottomnav-label: GNB 프로그래시브 라벨 한 줄 표시

- 변경 파일: `src/components/BottomNav.tsx`
- 설명: (직접 기입)

### 0002 style-number-font: 전 화면 숫자 폰트 Roboto 적용

- 변경 파일: `index.html`, `src/components/JackpotBanner.tsx`
- 설명: (직접 기입)

### 0003 fix-bottomnav-jackpot-tab: GNB 프로그래시브 탭 리스트 화면 이동

- 변경 파일: `src/components/BottomNav.tsx`
- 설명: (직접 기입)

### 0004 feat-jackpot-list-resort: 프로그래시브 리스트 국가 탭·리조트 목록 개편

- 변경 파일: `src/data/jackpotData.ts`, `src/data/resortFacilities.ts`, `src/screens/JackpotMapScreen.tsx`
- 설명: (직접 기입)

### 0005 feat-jackpot-php-krw: 잭팟 상세·당첨 내역 PHP/KRW 표기 개편

- 변경 파일: `src/data/jackpotData.ts`, `src/data/jackpotHistoryData.ts`, `src/screens/HotelJackpotDetailScreen.tsx`, `src/screens/JackpotHistoryScreen.tsx`
- 설명: (직접 기입)

### 0006 feat-offer-room-renewal: 오퍼 탭 룸 오퍼 리뉴얼

- 변경 파일: `public/images/offer/solaire/buffet.jpg`, `public/images/offer/solaire/exterior-day.jpg`, `public/images/offer/solaire/exterior-night.jpg`, `public/images/offer/solaire/room-twin-bay.jpg`, `public/images/offer/solaire/room-twin-city.jpg`, `src/components/offer/OfferApplicationForm.tsx`, `src/components/offer/OfferImageCarousel.tsx`, `src/components/offer/OfferPlanSelector.tsx`, `src/components/offer/OfferTierStatus.tsx`, `src/data/offerRoomData.ts`, `src/screens/FreeRoomScreen.tsx`
- 설명: (직접 기입)

### 0007 feat-solaire-exterior-image: 솔레어 상세 롤링·홈 배너 전경 사진 적용

- 변경 파일: `src/components/JackpotBanner.tsx`, `src/components/RotatingHeroImages.tsx`, `src/data/offerRoomData.ts`, `src/screens/HotelJackpotDetailScreen.tsx`
- 설명: (직접 기입)

## 4. 검증 결과

- BE 폴더(`108e123`) 적용 시뮬레이션: 통과 (7 개 순서 적용)
- BE 폴더 실제 적용 후 서버 기동·화면 확인: OK
- 검증 후 BE 폴더 원복: 완료 (변경 0)
- 검증 시점 전체 차이: `검증완료_diff_참고용.txt`

```
 index.html                                     |  17 +++++++-
 public/images/offer/solaire/buffet.jpg         | Bin 0 -> 113203 bytes
 public/images/offer/solaire/exterior-day.jpg   | Bin 0 -> 90997 bytes
 public/images/offer/solaire/exterior-night.jpg | Bin 0 -> 90263 bytes
 public/images/offer/solaire/room-twin-bay.jpg  | Bin 0 -> 76440 bytes
 public/images/offer/solaire/room-twin-city.jpg | Bin 0 -> 91791 bytes
 src/components/BottomNav.tsx                   |  27 +++++++------
 src/components/JackpotBanner.tsx               |   7 +++-
 src/components/RotatingHeroImages.tsx          |  39 +++++++++++++++++++
 src/components/offer/OfferApplicationForm.tsx  | 312 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 src/components/offer/OfferImageCarousel.tsx    |  94 ++++++++++++++++++++++++++++++++++++++++++++
 src/components/offer/OfferPlanSelector.tsx     |  61 +++++++++++++++++++++++++++++
 src/components/offer/OfferTierStatus.tsx       |  84 +++++++++++++++++++++++++++++++++++++++
 src/data/jackpotData.ts                        |  39 +++++++++++++++++++
 src/data/jackpotHistoryData.ts                 |  28 +++++++------
 src/data/offerRoomData.ts                      | 111 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 src/data/resortFacilities.ts                   |  60 ++++++++++++++++++++++++++++
 src/screens/FreeRoomScreen.tsx                 | 102 ++++++++++++++++++++++++++++++++++++++++++------
 src/screens/HotelJackpotDetailScreen.tsx       |  61 ++++++++++++++++++-----------
 src/screens/JackpotHistoryScreen.tsx           | 114 ++++++++++++++++++++++++++++++++++++++++++++---------
 src/screens/JackpotMapScreen.tsx               | 109 ++++++++++++++++++++++++++++++++++++++++-----------
 21 files changed, 1162 insertions(+), 103 deletions(-)
```
