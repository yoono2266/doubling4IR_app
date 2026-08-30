import { useEffect, useRef } from 'react';

// 이 앱은 라우터가 없고 화면 전환이 전부 Context 상태(currentTab / currentSubScreen 등)로만
// 이뤄진다. 그래서 브라우저·기기의 뒤로가기를 누르면 히스토리에 쌓인 게 없어 곧바로 앱 밖으로
// 나가 버린다. 아래 훅이 "화면 이동 = history 엔트리 1칸"을 유지시켜, 뒤로가기를 앱 내부
// 이동으로 처리한다.

export interface AppLocation {
  showLanding: boolean;
  currentTab: string;
  currentSubScreen: string | null;
  showWriteModal: boolean;
}

const keyOf = (l: AppLocation) =>
  `${l.showLanding ? 1 : 0}|${l.currentTab}|${l.currentSubScreen ?? ''}|${l.showWriteModal ? 1 : 0}`;

const NAV_STATE = { __doublingNav: true };
const EXIT_WINDOW_MS = 2000; // 홈에서 이 시간 안에 뒤로가기를 두 번 누르면 실제 종료
const MAX_STACK = 50;

interface Params {
  location: AppLocation;
  restore: (loc: AppLocation) => void;
  onExitHint: () => void;
}

export function useAppHistory({ location, restore, onExitHint }: Params) {
  const stackRef = useRef<AppLocation[]>([]);
  const prevRef = useRef<AppLocation | null>(null);
  const programmaticBackRef = useRef(0); // 우리가 유발한 history.back() 횟수
  const lastRootBackRef = useRef(0);

  const restoreRef = useRef(restore);
  const onExitHintRef = useRef(onExitHint);
  restoreRef.current = restore;
  onExitHintRef.current = onExitHint;

  // 마운트 시 1회: 가드 엔트리 1개를 쌓고 popstate 리스너 등록
  useEffect(() => {
    prevRef.current = location;
    window.history.pushState(NAV_STATE, '');

    const onPopState = () => {
      // 우리가 history.back()으로 되감은 경우는 그대로 흘려보낸다
      if (programmaticBackRef.current > 0) {
        programmaticBackRef.current -= 1;
        return;
      }

      const stack = stackRef.current;
      if (stack.length > 0) {
        const target = stack.pop() as AppLocation;
        // 이펙트가 이 상태 변경을 '앞으로 이동'으로 오인하지 않도록 선반영
        prevRef.current = target;
        restoreRef.current(target);
        return;
      }

      // 앱 최상단(홈)에서의 뒤로가기 → 2초 내 재입력 시에만 실제 종료
      if (Date.now() - lastRootBackRef.current < EXIT_WINDOW_MS) {
        window.history.back();
        return;
      }
      lastRootBackRef.current = Date.now();
      window.history.pushState(NAV_STATE, '');
      onExitHintRef.current();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 화면 이동 감지 → history 조작
  useEffect(() => {
    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = location;
      return;
    }
    if (keyOf(prev) === keyOf(location)) return;

    const stack = stackRef.current;
    const top = stack[stack.length - 1];

    if (top && keyOf(top) === keyOf(location)) {
      // 화면 안 '닫기'(X) 버튼 등으로 직전 위치에 그대로 복귀한 경우
      // → 브라우저 히스토리도 한 칸 되감아 중복 엔트리를 남기지 않는다
      stack.pop();
      prevRef.current = location;
      programmaticBackRef.current += 1;
      window.history.back();
      return;
    }

    // 앞으로 이동 → 뒤로가기 대상이 될 엔트리를 확보
    stack.push(prev);
    if (stack.length > MAX_STACK) stack.shift();
    prevRef.current = location;
    window.history.pushState(NAV_STATE, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyOf(location)]);
}
