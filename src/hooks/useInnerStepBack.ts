import { useEffect, useRef } from 'react';

// 2026-09-27: 한 서브화면 "안"의 단계(예: 포인트 교환소 목록 → 상품 상세)를 기기·브라우저 뒤로가기와 연결한다.
// useAppHistory는 currentSubScreen 단위로만 history를 쌓기 때문에, 화면 내부 단계에서 뒤로가기를 누르면
// 이전 서브화면(마이페이지)으로 나가 버린다. 이 훅은 active 동안 history 엔트리 1칸을 추가로 쌓고,
// 그 엔트리의 popstate를 useAppHistory보다 먼저 받아 전달을 막은 뒤 onBack을 호출한다.
// (useAppHistory.ts는 BE 로직이라 수정하지 않고 별도 훅으로 분리)
//
// window 대상 이벤트는 capture 여부와 관계없이 "등록 순서"대로 호출되므로, 리스너를 모듈 로드 시점
// (App 마운트 → useAppHistory 등록보다 앞)에 1회 등록한다.
//
// - active가 true가 되면 pushState 1회
// - 뒤로가기 → onBack() 호출 (엔트리 소모)
// - 화면 안 버튼으로 active가 false가 되면(엔트리가 남아 있음) history.back()으로 되감고 그 popstate는 무시
// - active 상태로 화면 자체가 닫히면(다른 서브화면 이동) 엔트리 1칸이 남는다. 이 경우 되감기는
//   useAppHistory의 pushState와 순서가 꼬일 수 있어 하지 않는다 (이후 뒤로가기 1회가 빈 이동으로 소모될 수 있음).

const INNER_STATE = { __doublingInnerStep: true };

interface InnerStepState {
  pushed: boolean;
  onBack: (() => void) | null;
}

const inner: InnerStepState = { pushed: false, onBack: null };
let ignoreCount = 0;

const onPopState = (e: PopStateEvent) => {
  if (ignoreCount > 0) {
    ignoreCount -= 1;
    e.stopImmediatePropagation();
    return;
  }
  if (!inner.pushed || !inner.onBack) return;
  inner.pushed = false;
  e.stopImmediatePropagation();
  inner.onBack();
};

if (typeof window !== 'undefined') {
  // HMR로 모듈이 다시 평가되어도 리스너가 중복되지 않도록 이전 것을 교체
  const w = window as unknown as { __doublingInnerStepPop?: (e: PopStateEvent) => void };
  if (w.__doublingInnerStepPop) window.removeEventListener('popstate', w.__doublingInnerStepPop);
  w.__doublingInnerStepPop = onPopState;
  window.addEventListener('popstate', onPopState);
}

export function useInnerStepBack(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // 언마운트 여부 — 아래 active 이펙트보다 먼저 선언해야 언마운트 시 cleanup이 먼저 실행된다
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    inner.onBack = () => onBackRef.current();
    if (!inner.pushed) {
      window.history.pushState(INNER_STATE, '');
      inner.pushed = true;
    }
    return () => {
      inner.onBack = null;
      if (inner.pushed) {
        inner.pushed = false;
        // 화면 안 버튼으로 단계가 닫힌 경우 → 남은 엔트리 되감기.
        // 화면 자체가 닫히는(언마운트) 경우는 위 주석대로 되감지 않는다.
        if (mountedRef.current) {
          ignoreCount += 1;
          window.history.back();
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
