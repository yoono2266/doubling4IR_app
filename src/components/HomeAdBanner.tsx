import React, { useEffect, useState } from 'react';
import { HOME_AD_BANNERS } from '../data/homeBannerData';

// 2026-10-03: 홈 상단 "라이브 프로그래시브" 카드(JackpotBanner)를 광고 BM용 배너로 교체.
// - 구글 애드센스 수평형 크기 비율 기준, 화면 좌우 끝까지(부모가 -mx-4로 펼침), 테두리·둥근 모서리 없음
// - 최대화: 728×90의 2배 비율(728:180, 390px 화면 약 96px) — 홈 첫 진입·맨 위에 있을 때
// - 최소화: 리더보드 728:90 비율(390px 화면 약 48px) — 아래로 스크롤하면 부드럽게 전환
//   높이는 padding-top %(폭 기준)로 잡아 화면 폭에 따라 비율 유지 + transition으로 부드럽게 변경
// - 원본 사진(흐림·어두운 덮개 없음) + 호텔명. 여러 장이면 4초마다 교차 페이드
// - 클릭 동작 없음: "오퍼 탭의 해당 호텔 상품 리스트"로 연결 예정 (추후 작업, homeBannerData의 offerHotelKey 사용)

const ROTATE_INTERVAL_MS = 4000;
const EXPANDED_RATIO = (180 / 728) * 100; // %
const COMPACT_RATIO = (90 / 728) * 100; // %

interface HomeAdBannerProps {
  isCompact: boolean;
}

export const HomeAdBanner: React.FC<HomeAdBannerProps> = ({ isCompact }) => {
  const banners = HOME_AD_BANNERS;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  return (
    <div
      className="relative w-full overflow-hidden bg-[#0D1B2A] transition-[padding-top] duration-500 ease-out"
      style={{ paddingTop: `${isCompact ? COMPACT_RATIO : EXPANDED_RATIO}%` }}
      role="region"
      aria-label="추천 리조트 배너"
    >
      {banners.map((banner, index) => (
        <img
          key={banner.id}
          src={banner.image}
          alt={banner.imageAlt}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: banner.imagePosition }}
          draggable={false}
        />
      ))}

      {/* 호텔명 가독성용 하단 그라데이션 (사진 하단 일부만) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/55 to-transparent" />

      {/* 호텔명 */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-1.5">
        <span
          key={banners[activeIndex].id}
          className={`font-bold text-white transition-[font-size] duration-500 animate-in fade-in ${
            isCompact ? 'text-[11px]' : 'text-[13px]'
          }`}
        >
          {banners[activeIndex].hotelName}
        </span>

        {/* 배너 위치 표시 (2개 이상일 때) */}
        {banners.length > 1 && (
          <div className="mb-1 flex items-center gap-1">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${banner.hotelName} 배너 보기`}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
