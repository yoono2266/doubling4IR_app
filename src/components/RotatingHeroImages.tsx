import React, { useEffect, useState } from 'react';

// 2026-09-30: 여러 장의 사진을 일정 간격으로 교차 페이드하며 롤링하는 히어로 이미지.
// 부모 요소(relative, 크기 지정) 안을 가득 채운다.
// 2026-09-30 변경: 동작 줄이기(prefers-reduced-motion, Windows "애니메이션 효과" 끄기) 설정이어도 롤링한다.
//   (기존: 해당 설정이면 첫 장만 고정 → 사용자 PC에서 롤링이 멈춘 것처럼 보이는 문제)
//   위치 이동 없이 투명도만 서서히 바뀌는 교차 페이드라 움직임 부담이 작다고 판단.

interface RotatingHeroImagesProps {
  images: { src: string; alt: string }[];
  intervalMs?: number;
}

export const RotatingHeroImages: React.FC<RotatingHeroImagesProps> = ({ images, intervalMs = 4000 }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    if (images.length < 2) return;
    // 2026-09-30 비활성화 (삭제하지 않고 주석 보존). 사유: 위 머리말 참고 — 설정과 무관하게 항상 롤링.
    // const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, intervalMs]);

  return (
    <>
      {images.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </>
  );
};
