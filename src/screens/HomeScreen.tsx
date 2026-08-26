import React from 'react';
import { useApp } from '../context/AppContext';
import { JackpotBanner } from '../components/JackpotBanner';
import { VideoPromoCard } from '../components/VideoPromoCard';
import { PolyMarketCarousel } from '../components/PolyMarketCarousel';

export const HomeScreen: React.FC = () => {
  const {
    posts,
    setSelectedPost,
    setCurrentTab,
    setCurrentSubScreen,
    toggleLikePost
  } = useApp();

  const handlePolyMoreClick = () => {
    setCurrentTab('poly');
    setCurrentSubScreen(null);
  };

  return (
    <div className="flex flex-col gap-5 pb-44">
      {/* 1. Auto-Rolling Jackpot & FreeRoom Banner (Sticky Top) */}
      <div className="sticky top-0 z-30 bg-[#0D1B2A] -mx-4 px-4 pt-2.5 pb-3 border-b border-[#1F334D]/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">local_fire_department</span>
            라이브 잭팟
          </h3>
          <button 
            onClick={() => {
              setCurrentTab('jackpot');
              setCurrentSubScreen(null);
            }}
            className="text-[11px] text-slate-400 hover:text-[#C5A059] flex items-center gap-0.5"
          >
            <span>전체보기</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
        <JackpotBanner />
      </div>

      {/* 2. Real-time Prediction Challenge Carousel Banner */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">query_stats</span>
            실시간 예측 챌린지 (100~5,000 DP)
          </h3>
          <button 
            onClick={handlePolyMoreClick}
            className="text-[11px] text-slate-400 hover:text-[#C5A059] flex items-center gap-0.5"
          >
            <span>마켓 전체보기</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>

        {/* Carousel Component */}
        <PolyMarketCarousel />
      </div>

      {/* 3. Community Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">forum</span>
            더블링 파트너스 커뮤니티
          </h3>
        </div>

        {/* Post Feed List */}
        <div className="space-y-3">
          {posts.map((post) => {
            if (post.postType === 'video_promo') {
              return <VideoPromoCard key={post.id} post={post} />;
            }

            return (
              <div 
                key={post.id}
                onClick={() => {
                  setSelectedPost(post);
                  setCurrentSubScreen('post-detail');
                }}
                className={`bg-[#162639] border border-[#1F334D] rounded-2xl p-4 cursor-pointer hover:border-[#C5A059]/50 transition flex flex-col gap-2.5 shadow-md ${
                  post.isNew ? 'ring-1 ring-[#C5A059] bg-[#162639]/95' : ''
                }`}
              >
                {/* Post Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={post.avatar} 
                      alt={post.author} 
                      className="w-8 h-8 rounded-full object-cover border border-[#C5A059]/40"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{post.author}</span>
                        <span className="text-[10px] text-slate-400 font-medium bg-[#0D1B2A] px-1.5 py-0.2 rounded border border-[#1F334D]">
                          {post.authorRole || 'Member'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{post.timeAgo}</span>
                    </div>
                  </div>

                  {post.isNew && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059] text-[#0D1B2A] font-extrabold animate-pulse">
                      NEW
                    </span>
                  )}
                </div>

                {/* Title & Content */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{post.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{post.content}</p>
                </div>

                {/* Attached Image if exists */}
                {post.image && (
                  <div className="rounded-xl overflow-hidden h-36 w-full my-1">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Footer Likes & Comments */}
                <div className="flex items-center justify-between text-slate-400 text-xs pt-1 border-t border-[#1F334D]/60">
                  <span className="text-[11px] font-semibold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded">
                    #{post.category}
                  </span>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikePost(post.id);
                      }}
                      className={`flex items-center gap-1 hover:text-[#C5A059] transition ${
                        post.isLiked ? 'text-rose-400 font-bold' : ''
                      }`}
                    >
                      <span className={`material-symbols-outlined text-sm ${post.isLiked ? 'fill-1 text-rose-400' : ''}`}>
                        favorite
                      </span>
                      <span>{post.likes}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">chat_bubble</span>
                      <span>{post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
