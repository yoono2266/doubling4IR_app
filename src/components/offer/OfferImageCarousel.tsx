import React, { useRef, useState } from 'react';

// 2026-09-30: 오퍼 탭 리뉴얼 — 호텔 외관·객실 사진 공용 스와이프 슬라이드.
// CSS scroll-snap으로 손가락 스와이프를 처리하고, 좌우 버튼·인디케이터는 같은 스크롤 위치를 따른다.
export interface OfferCarouselSlide {
  key: string;
  image: string;
  alt: string;
  overlay?: React.ReactNode; // 이미지 하단 그라데이션 위에 올릴 내용
}

interface OfferImageCarouselProps {
  slides: OfferCarouselSlide[];
  heightClass: string; // 예: 'h-40', 'aspect-[16/10]'
  onIndexChange?: (index: number) => void;
}

export const OfferImageCarousel: React.FC<OfferImageCarouselProps> = ({ slides, heightClass, onIndexChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
      onIndexChange?.(index);
    }
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-[#1F334D] bg-[#0D1B2A] ${heightClass}`}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto no-scrollbar"
      >
        {slides.map(slide => (
          <div key={slide.key} className="relative h-full w-full shrink-0 snap-start">
            <img src={slide.image} alt={slide.alt} className="h-full w-full object-cover" />
            {slide.overlay && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/30 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 p-4">{slide.overlay}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-end gap-1.5 p-3">
          <button
            type="button"
            aria-label="이전 사진"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#0D1B2A]/70 text-slate-200 transition active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === slides.length - 1}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#0D1B2A]/70 text-slate-200 transition active:scale-95 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1" aria-hidden="true">
          {slides.map((slide, index) => (
            <span
              key={slide.key}
              className={`h-1 rounded-sm transition-all ${index === activeIndex ? 'w-5 bg-[#C5A059]' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
