import { useEffect, useRef, useState } from 'react';

// 2026-10-03: 스크롤 컨테이너가 맨 위에서 벗어났는지 여부 (홈 광고 배너 최대화/최소화 전환용).
// 스크롤 이벤트 대신 IntersectionObserver로, 화면 맨 위에 둔 표시 요소(sentinel)가 보이는지만 감지한다.
// 표시 요소 높이(thresholdPx)만큼 내려가면 "벗어남"(true), 다시 그 안으로 올라오면 false.
// 앱은 라우터 없이 <main>(overflow-y-auto)이 스크롤되므로 가장 가까운 <main>을 기준으로 삼는다.
export const useScrolledPastTop = (thresholdPx = 8) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const root = sentinel.closest('main');
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolledPastTop(!entry.isIntersecting),
      { root, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, sentinelHeight: thresholdPx, isScrolledPastTop };
};
