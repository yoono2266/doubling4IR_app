import React from 'react';
import { Post, useApp } from '../context/AppContext';

interface VideoPromoCardProps {
  post: Post;
}

export const VideoPromoCard: React.FC<VideoPromoCardProps> = ({ post }) => {
  const { toggleLikePost, toggleBookmarkPost, setSelectedPost, setCurrentSubScreen, requireLogin } = useApp();

  const handleCardClick = () => {
    if (!requireLogin()) return;
    setSelectedPost(post);
    setCurrentSubScreen('post-detail');
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-[#162639] border border-[#1F334D] rounded-2xl p-4 cursor-pointer hover:border-[#C5A059]/50 transition flex flex-col gap-3 shadow-md group"
    >
      {/* 1. Header: Title + Category Badge */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-bold text-white tracking-tight group-hover:text-[#F7E2AD] transition line-clamp-1">
          {post.tb_title}
        </h4>
        <span className="text-[11px] font-bold text-[#0D1B2A] bg-[#C5A059] px-2.5 py-0.5 rounded-full shrink-0 shadow-sm">
          {post.cate_name} 
        </span>
      </div>

      {/* 2. Date / Timestamp */}
      <div className="text-[11px] text-slate-400 font-mono -mt-1.5 flex items-center gap-1">
        <span className="material-symbols-outlined text-[13px] text-slate-500">schedule</span>
        <span>{post.tb_reg_datetime || '방금 전'}</span>
      </div>

      {/* 3. 1:1 Square Video Thumbnail with Play Button Overlay */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0D1B2A] border border-[#1F334D]/80">
        <img 
          src={`https://dou-cdn.wildwynn.com/static/upload/contents/thumb/${post.tb_thumb_url}`}
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

        {/* Live / HD Tag in thumbnail corner */}
        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span>PROMO HD</span>
        </div>
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

      {/* 5. Footer: Likes & Bookmark Count */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1F334D]/60 text-slate-400 text-xs">
        <div className="flex items-center gap-4">
          {/* 💡 좋아요 토글 버튼 */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (requireLogin()) void toggleLikePost(post.tb_index);
            }}
            className={`flex items-center gap-1.5 transition ${
              post.is_user_liked ? 'text-rose-400 font-bold' : 'hover:text-rose-400 text-slate-300'
            }`}
          >
            <span className={`material-symbols-outlined text-base ${post.is_user_liked ? 'text-rose-400 fill-1' : ''}`}>
              favorite
            </span>
            <span className="text-xs font-mono">{post.count_like || 0}</span>
          </button>

          {/* 💡 북마크 토글 버튼 */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (requireLogin()) void toggleBookmarkPost(post.tb_index);
            }}
            className={`flex items-center gap-1.5 transition ${
              post.is_user_bookmarked ? 'text-[#C5A059] font-bold' : 'hover:text-[#C5A059] text-slate-300'
            }`}
          >
            <span className={`material-symbols-outlined text-base ${post.is_user_bookmarked ? 'text-[#C5A059] fill-1' : ''}`}>
              bookmark
            </span>
            <span className="text-xs font-mono">{post.count_bookmark || 0}</span>
          </button>


        </div>

        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
          <span>상세보기</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
        </span>
      </div>
    </div>
  );
};
