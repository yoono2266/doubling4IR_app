import React from 'react';
import { Post, useApp } from '../context/AppContext';
import { saveMainScrollTop } from '../utils/scrollMemory';

interface VideoPromoCardProps {
  post: Post;
}

export const VideoPromoCard: React.FC<VideoPromoCardProps> = ({ post }) => {
  const { toggleLikePost, toggleBookmarkPost, setSelectedPost, setCurrentSubScreen, requireLogin } = useApp();

  const handleCardClick = () => {
    if (!requireLogin()) return;
    saveMainScrollTop();
    setSelectedPost(post);
    setCurrentSubScreen('post-detail');
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 cursor-pointer hover:border-[#C5A059]/50 transition flex flex-col gap-3 shadow-md group"
    >
      {/* 1. Header: Title + 좋아요·즐겨찾기 (2026-09-30: 카테고리 뱃지 자리로 이동) */}
      <div className="flex items-center justify-between gap-3">
        <h4 className="min-w-0 flex-1 text-base font-bold text-white tracking-tight group-hover:text-[#F7E2AD] transition line-clamp-1">
          {post.tb_title}
        </h4>
        {/*
          2026-09-30 비활성화 (삭제하지 않고 주석 보존).
          사유: 우측 상단 카테고리 뱃지("프로|미정", "캐릭터|팡팡" 등 cate_name 전 종류)를 노출하지 않기로 함.
                이 자리에 좋아요·즐겨찾기 버튼을 배치 (카테고리는 아래 해시태그 #cate_name으로 계속 표시).
        <span className="text-[11px] font-bold text-[#0D1B2A] bg-[#C5A059] px-2.5 py-0.5 rounded-full shrink-0 shadow-sm">
          {post.cate_name}
        </span>
        */}
        <div className="flex items-center gap-3 shrink-0 text-xs">
          {/* 💡 좋아요 토글 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (requireLogin()) void toggleLikePost(post.tb_index);
            }}
            aria-label={post.is_user_liked ? '좋아요 취소' : '좋아요'}
            className={`flex items-center gap-1 transition ${
              post.is_user_liked ? 'text-rose-400 font-bold' : 'hover:text-rose-400 text-slate-300'
            }`}
          >
            <span className={`material-symbols-outlined text-base ${post.is_user_liked ? 'text-rose-400 fill-1' : ''}`}>
              favorite
            </span>
            <span className="text-xs font-mono">{post.count_like}</span>
          </button>

          {/* 💡 북마크(즐겨찾기) 토글 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (requireLogin()) void toggleBookmarkPost(post.tb_index);
            }}
            aria-label={post.is_user_bookmarked ? '즐겨찾기 취소' : '즐겨찾기'}
            className={`flex items-center gap-1 transition ${
              post.is_user_bookmarked ? 'text-[#C5A059] font-bold' : 'hover:text-[#C5A059] text-slate-300'
            }`}
          >
            <span className={`material-symbols-outlined text-base ${post.is_user_bookmarked ? 'text-[#C5A059] fill-1' : ''}`}>
              bookmark
            </span>
            <span className="text-xs font-mono">{post.count_bookmark}</span>
          </button>
        </div>
      </div>

      {/* 2. Date / Timestamp */}
      <div className="text-[11px] text-slate-400 font-mono -mt-1.5 flex items-center gap-1">
        <span className="material-symbols-outlined text-[13px] text-slate-500">schedule</span>
        <span>{post.tb_reg_datetime || '방금 전'}</span>
      </div>

      {/* 3. 1:1 Square Video Thumbnail with Play Button Overlay */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0D1B2A] border border-[#1F334D]/80">
        <img 
          src={`https://dou-cdn.wildwynn.com/contents/thumb/${post.tb_thumb_url}`}
          alt={post.tb_title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Dark gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/70 via-black/20 to-transparent"></div>

        {/* Center Play (▶) Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-[#FFF0D0] group-hover:scale-110 group-hover:bg-[#C5A059] group-hover:text-[#0D1B2A] group-hover:border-[#C5A059] shadow-2xl transition-all duration-300">
            <span className="material-symbols-outlined text-3xl font-bold ml-1">play_arrow</span>
          </div>
        </div>

        {/*
          2026-09-30 비활성화 (삭제하지 않고 주석 보존).
          사유: 동영상 썸네일 좌측 상단 "PROMO HD" 뱃지를 노출하지 않기로 함.
        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span>PROMO HD</span>
        </div>
        */}
      </div>

      {/* 4. Hashtags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {/* {(post.hashtags && post.hashtags.length > 0 ? post.hashtags : ['뉴스', '더블링뉴스', '뉴스', '더블링']).map((tag, idx) => (
          <span 
            key={idx} 
            className="text-[11px] font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D] hover:border-[#C5A059]/40 transition"
          >
            #{tag}
            
          </span>
        ))} */}
        <span className="text-[11px] font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D] hover:border-[#C5A059]/40 transition">
        #{post.cate_name}
        </span>
        <span className="text-[11px] font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D] hover:border-[#C5A059]/40 transition">
        #{post.cate_sub_name}
        </span>
        <span className="text-[11px] font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2 py-0.5 rounded border border-[#1F334D] hover:border-[#C5A059]/40 transition">
        #{post.class_name}
        </span>
      </div>

      {/*
        2026-09-30 비활성화 (삭제하지 않고 주석 보존).
        사유: 하단 줄(구분선 + 좋아요·북마크 + "상세보기")을 통째로 없애기로 함.
              좋아요·북마크 버튼은 상단 제목 줄 오른쪽(기존 카테고리 뱃지 자리)으로 이동했고,
              "상세보기" 안내는 삭제 (카드 전체 클릭 시 상세로 이동하는 동작은 그대로).
        [원본 구조 — 버튼 코드는 상단으로 옮겼으므로 생략]
      <div className="flex items-center justify-between pt-2 border-t border-[#1F334D]/60 text-slate-400 text-xs">
        <div className="flex items-center gap-4">
          (좋아요 토글 버튼 / 북마크 토글 버튼)
        </div>

        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
          <span>상세보기</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
        </span>
      </div>
      */}
    </div>
  );
};
