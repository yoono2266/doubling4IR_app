import React, { useEffect, useState } from 'react';

// 2026-09-30: 여러 장의 사진을 일정 간격으로 교차 페이드하며 롤링하는 히어로 이미지.
// 부모 요소(relative, 크기 지정) 안을 가득 채운다. 동작 줄이기(prefers-reduced-motion) 설정이면 첫 장만 고정 표시.

interface RotatingHeroImagesProps {
  images: { src: string; alt: string }[];
  intervalMs?: number;
}

export const RotatingHeroImages: React.FC<RotatingHeroImagesProps> = ({ images, intervalMs = 4000 }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    if (images.length < 2) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
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
