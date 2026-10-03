import { useSyncExternalStore } from 'react';
import { getStoredUserInfo } from '../utils/auth';

// 2026-10-03: 하단 내비게이터(GNB) 고정(핀) 설정 — 켜면 스크롤해도 자동으로 숨지 않고 항상 표시.
// 내비게이터의 핀 버튼과 마이페이지 > 앱 설정 스위치가 같은 값을 공유한다(구독형 저장소).
// ⚠️ 저장 위치: 서버 회원 설정에 항목이 없어 우선 이 기기 localStorage에 계정별로 저장(다른 기기에서는 유지 안 됨).
//    서버 필드 추가는 BE 요청서(REQ-261003-03, 예: /members/usetting의 u_gnb_pin)로 요청 — 제공되면 서버 값으로 교체.

const STORAGE_PREFIX = 'gnb_pin_';
const listeners = new Set<() => void>();

const storageKey = () => `${STORAGE_PREFIX}${getStoredUserInfo()?.u_id || 'guest'}`;

const readPinned = (): boolean => {
  try {
    return localStorage.getItem(storageKey()) === '1';
  } catch {
    return false;
  }
};

export const setGnbPinned = (pinned: boolean) => {
  try {
    localStorage.setItem(storageKey(), pinned ? '1' : '0');
  } catch {
    // 저장 불가(시크릿 모드 등) — 화면 상태만 반영되지 않을 수 있음
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useGnbPin = (): [boolean, (pinned: boolean) => void] => {
  const pinned = useSyncExternalStore(subscribe, readPinned, () => false);
  return [pinned, setGnbPinned];
};
