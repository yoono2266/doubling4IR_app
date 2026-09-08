import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { JackpotBanner } from '../components/JackpotBanner';
import { PolyMarketCarousel } from '../components/PolyMarketCarousel';
import { displayLikeCount, displayBookmarkCount } from '../data/mockCounts';
import { VideoPromoCard } from '../components/VideoPromoCard';
import { apiCommonClient, ApiError, ResultCode, CommonResponse } from '../utils/apiClient';
import { saveMainScrollTop, restoreMainScrollTop } from '../utils/scrollMemory';

// /contents/main-content API 요청/응답 타입
interface MainContentParam {
  page: number;
  limit: number;
}

interface ServerPostItem {
  tb_index: number;
  tb_title: string;
  tb_type: number;
  tb_writer_id: number;
  tb_status: number;
  tb_file_url: string;
  tb_upd_timestamp: number;
  tb_reg_timestamp: number;
  class_name: string;
  cate_name: string;
  cate_sub_name: string;
  sub_name: string;
  tb_class_index: number;
  tb_cate_index: number;
  tb_thumb_url: string;
  tb_link: string;
  ai_index: string;
  tb_main_name: string;
  tb_sub_name: string;
  tb_logo: string;
  tb_desc: string;
  tb_country: string;
  count_like: number;
  is_user_liked: number;
  count_bookmark: number;
  is_user_bookmarked: number;
  tb_reg_datetime: string;
}

interface MainContentResponse {
  table?: ServerPostItem[];
  hasMore?: boolean;
  [key: string]: any;
  data?: any;
  totalRecord: number; // 서버에서 내려오는 전체 레코드 수
}

export const HomeScreen: React.FC = () => {
  const {
    posts,
    setPosts,
    setSelectedPost,
    setCurrentTab,
    setCurrentSubScreen,
    toggleLikePost,
    toggleBookmarkPost, // 💡 추가
    isLoggedIn,
    requireLogin,
    setSelectedHotelId,
    refreshPlmContents,
  } = useApp();

  const handlePolyCardClick = () => {
    if (!requireLogin()) return;
    setCurrentTab('poly');
  };

  // "라이브 잭팟" 전체보기 → 잭팟 리스트가 아닌 "솔레어 리조트 앤 카지노" 상세로 직접 이동
  const handleJackpotMoreClick = () => {
    if (!requireLogin()) return;
    setSelectedHotelId('solaire');
    setCurrentSubScreen('hotel-jackpot-detail');
  };
 const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 게시글 상세에서 목록으로 돌아왔을 때, 상세 진입 전 스크롤 위치를 복원한다.
  useEffect(() => {
    restoreMainScrollTop();
  }, []);

  // 💡 비디오 플레이어 모달 상태 관리
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    videoPosterUrl?: string;
    title: string;
  }>({
    isOpen: false,
    videoUrl: '',
    videoPosterUrl: '',
    title: '',
  });

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // HomeScreen.tsx 내 fetchPosts 및 IntersectionObserver 수정 코드

// HomeScreen.tsx 내 fetchPosts 및 무한 스크롤 관련 코드 수정

// API 서버에서 Post 목록을 불러오는 함수
const fetchPosts = useCallback(async (pageNum: number) => {
  const limit = 5; // 한 번에 불러올 포스트 개수
  if (isLoading) return;

  if (!isLoggedIn && pageNum > 1) {
    setHasMore(false);
    requireLogin();
    return;
  }

  setIsLoading(true);

  try {
    const endpoint = isLoggedIn ? '/contents/main-content' : '/contents/sample-content';
    const response = await apiCommonClient.post<CommonResponse<MainContentResponse>, MainContentParam>(
      endpoint,
      { page: pageNum, limit: limit }
    );

    if (response && (response.result === ResultCode.SUCCESS)) {
      console.log(`${endpoint} (page: ${pageNum}) 응답0:`, response);  
      const responseData = response.data as any;
      const rawList: ServerPostItem[] = responseData.table || [];

      // 💡 [수정] 서버에서 내려오는 단수형 totalRecord 및 다양한 키 체크
      const totalCount = responseData.totalRecord ?? 0;

      const mappedPosts = rawList.map((item) => ({
        ...item,
        tb_logo: item.tb_logo?.trim() || '',
        tb_thumb_url: item.tb_thumb_url?.trim() || '',
        tb_file_url: item.tb_file_url?.trim() || '',
      }));

      if (pageNum === 1) {
        setPosts(mappedPosts);
      } else {
        setPosts((prev) => {
          // 기존에 존재하는 tb_index 목록 추출
          const existingIds = new Set(prev.map((p) => p.tb_index));
          // 중복되지 않은 새 데이터만 필터링
          const uniqueNewPosts = mappedPosts.filter((p) => !existingIds.has(p.tb_index));
          return [...prev, ...uniqueNewPosts];
        });
      }

      // 💡 [다음 페이지 판별 핵심 로직]
      // 현재까지 누적해서 불러온 총 개수 (예: page 1 -> 10개, page 2 -> 20개...)
      const currentLoadedCount = (pageNum - 1) * limit + rawList.length;

      if (
        rawList.length === 0 || 
        rawList.length < limit || 
        (totalCount > 0 && currentLoadedCount >= totalCount)
      ) {
        console.log('더 이상 불러올 포스트가 없습니다. (hasMore = false)');
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } else {
      console.warn('포스트 목록 조회 실패:', response?.message);
      setHasMore(false);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`포스트 API 에러 (${error.status}):`, error.message);
    } else {
      console.error('포스트 목록 요청 중 오류:', error);
    }
    setHasMore(false);
  } finally {
    setIsLoading(false);
  }
}, [isLoading, isLoggedIn, requireLogin, setPosts]);

// 마운트 시 1페이지 데이터 로드
useEffect(() => {
  fetchPosts(1);
}, []);

useEffect(() => {
  console.log('[HomeScreen] mount -> refreshPlmContents()');
  refreshPlmContents();
}, [refreshPlmContents]);

// 무한 스크롤 관찰자 (IntersectionObserver)
useEffect(() => {
  // 비로그인 사용자는 sample-content 1페이지만 노출합니다.
  // 감지 영역이 처음부터 화면에 보이면 2페이지 요청이 자동 발생할 수 있습니다.
  if (!isLoggedIn || !hasMore || isLoading) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          fetchPosts(nextPage);
          return nextPage;
        });
      }
    },
    {
      root: null, // 뷰포트 기준
      rootMargin: '100px', // 스크롤 바닥에 도달하기 100px 전에 미리 로드하여 더 부드럽게 감지
      threshold: 0.1,
    }
  );

  const currentTarget = observerTarget.current;
  if (currentTarget) {
    observer.observe(currentTarget);
  }

  return () => {
    if (currentTarget) {
      observer.unobserve(currentTarget);
    }
  };
}, [hasMore, isLoading, isLoggedIn, fetchPosts]);



  // 💡 썸네일 클릭 시 비디오 모달 오픈 핸들러
  const handleThumbClick = (e: React.MouseEvent, post: ServerPostItem) => {
    e.stopPropagation(); // 카드 전체 클릭 이벤트(상세페이지 이동) 방지

    // 비디오 파일 URL 구성 (상대경로/절대경로 판별)
    let videoFullUrl = post.tb_file_url || '';
    if (videoFullUrl && !videoFullUrl.startsWith('http')) {
      videoFullUrl = `https://dou-cdn.wildwynn.com/static/upload/contents/${videoFullUrl}`;
    }

    // 비디오 썸네일 파일 URL 구성 (상대경로/절대경로 판별)
    let videoThumbUrl = post.tb_thumb_url || '';
    if (videoThumbUrl && !videoThumbUrl.startsWith('http')) {
      videoThumbUrl = `https://dou-cdn.wildwynn.com/static/upload/contents/thumb/${videoThumbUrl}`;
    }

    setVideoModal({
      isOpen: true,
      videoUrl: videoFullUrl,
      videoPosterUrl: videoThumbUrl,
      title: post.tb_title || '동영상 플레이어',
    });
  };

  // 비디오 모달 닫기
  const closeVideoModal = () => {
    setVideoModal({ isOpen: false, videoUrl: '', title: '' });
  };

  // 비디오 파일 확장자 체크 (mp4, webm 등)
  const isDirectVideoFile = (url: string) => {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
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
            onClick={handleJackpotMoreClick}
            className="text-[11px] text-slate-400 hover:text-[#C5A059] flex items-center gap-0.5"
          >
            <span>전체보기</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
        <JackpotBanner />
      </div>

      {/* 2. 실시간 예측 챌린지 캐러셀 배너 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">query_stats</span>
            실시간 예측 챌린지 (100~5,000 DP)
          </h3>
          <button
            onClick={handlePolyCardClick}
            className="text-[11px] text-slate-400 hover:text-[#C5A059] flex items-center gap-0.5"
          >
            <span>마켓 전체보기</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>

        <PolyMarketCarousel />
      </div>

      {/* 4. Community Feed */}
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
            if (post.tb_type === 1) {
              return <VideoPromoCard key={post.tb_index} post={post} />;
            }

            return (
              <div 
                key={post.tb_index}
                onClick={() => {
                  if (!requireLogin()) return;
                  saveMainScrollTop();
                  setSelectedPost(post);
                  setCurrentSubScreen('post-detail');
                }}
                className={`bg-[#162639] border border-[#1F334D] rounded-2xl p-4 cursor-pointer hover:border-[#C5A059]/50 transition flex flex-col gap-2.5 shadow-md ${
                  post.tb_status ? 'ring-1 ring-[#C5A059] bg-[#162639]/95' : ''
                }`}
              >
                {/* Post Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://dou-cdn.wildwynn.com/static/upload/aimanager/logo/${post.tb_logo}`}
                      alt={post.cate_name} 
                      className="w-8 h-8 rounded-full object-cover border border-[#C5A059]/40"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{post.cate_name} </span>
                        <span className="text-[10px] text-slate-400 font-medium bg-[#0D1B2A] px-1.5 py-0.2 rounded border border-[#1F334D]">
                          {post.cate_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{post.tb_reg_datetime || '방금 전'}</span>
                    </div>
                  </div>

                  {post.tb_type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059] text-[#0D1B2A] font-extrabold animate-pulse">
                      NEW
                    </span>
                  )}
                </div>

                {/* Title & Content */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{post.tb_title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{post.tb_desc}</p>
                </div>

                {/* Attached Image if exists */}
                {post.tb_thumb_url && (
                  <div className="rounded-xl overflow-hidden h-36 w-full my-1">
                    <img src={`https://dou-cdn.wildwynn.com/static/upload/contents/thumb/${post.tb_thumb_url}`}  alt={post.tb_title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Footer Likes & Comments */}
                <div className="flex items-center justify-between text-slate-400 text-xs pt-1 border-t border-[#1F334D]/60">
                  <span className="text-[11px] font-semibold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded">
                    #{post.cate_name}
                  </span>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (requireLogin()) void toggleLikePost(post.tb_index);
                      }}
                      className={`flex items-center gap-1 hover:text-[#C5A059] transition ${
                        post.is_user_liked ? 'text-rose-400 font-bold' : ''
                      }`}
                    >
                      <span className={`material-symbols-outlined text-sm ${post.is_user_liked ? 'fill-1 text-rose-400' : ''}`}>
                        favorite
                      </span>
                      <span>{displayLikeCount(post.tb_index, post.count_like)}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bookmark</span>
                      <span>{displayBookmarkCount(post.tb_index, post.count_bookmark)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 무한 스크롤 감지 영역 */}
          <div ref={observerTarget} className="py-4 text-center">
            {isLoading && (
              <p className="text-xs text-[#C5A059] animate-pulse">포스트를 불러오는 중입니다...</p>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-xs text-slate-500">모든 포스트를 불러왔습니다.</p>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};
