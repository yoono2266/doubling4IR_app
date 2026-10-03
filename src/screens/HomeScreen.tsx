import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
// 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 홈 상단 카드형 JackpotBanner를 광고 BM용 HomeAdBanner로 교체.
// import { JackpotBanner } from '../components/JackpotBanner';
import { HomeAdBanner } from '../components/HomeAdBanner';
import { useScrolledPastTop } from '../hooks/useScrolledPastTop';
import { PolyMarketCarousel } from '../components/PolyMarketCarousel';
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
    authChecked,
    requireLogin,
    setSelectedHotelId,
    refreshPlmContents,
  } = useApp();

  const handlePolyCardClick = () => {
    if (!requireLogin()) return;
    setCurrentTab('poly');
  };

  // "라이브 잭팟" 전체보기 → 잭팟 리스트가 아닌 "솔레어 리조트 앤 카지노" 상세로 직접 이동
  // "라이브 프로그래시브" 섹션(전체보기 버튼) 클릭 시, 실제 잭팟 데이터가 등록된
  // "솔레어 엔터테인먼트 시티"(jp_index=19, hotel_code=SREC) 상세로 바로 이동한다.
  // id는 mapJackpotApiHotels()가 쓰는 것과 동일하게 hotel_code 기준('SREC')이어야 한다.
  const handleJackpotMoreClick = () => {
    if (!requireLogin()) return;
    setSelectedHotelId('SREC');
    setCurrentSubScreen('hotel-jackpot-detail');
  };
  // 2026-10-03: 상단 광고 배너 최대화/최소화 — 맨 위에서 8px 이상 스크롤하면 최소화
  const {
    sentinelRef: adBannerSentinelRef,
    sentinelHeight: adBannerSentinelHeight,
    isScrolledPastTop: isAdBannerCompact,
  } = useScrolledPastTop(8);
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
// authChecked(서버 세션 확인 완료)를 기다리지 않으면 isLoggedIn이 아직 false인 상태로
// fetchPosts가 호출되어, 실제로는 로그인된 사용자에게도 sample-content가 요청되는 문제가 있었다.
useEffect(() => {
  if (!authChecked) return;
  fetchPosts(1);
}, [authChecked]);

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
      videoFullUrl = `https://dou-cdn.wildwynn.com/contents/${videoFullUrl}`;
    }

    // 비디오 썸네일 파일 URL 구성 (상대경로/절대경로 판별)
    let videoThumbUrl = post.tb_thumb_url || '';
    if (videoThumbUrl && !videoThumbUrl.startsWith('http')) {
      videoThumbUrl = `https://dou-cdn.wildwynn.com/contents/thumb/${videoThumbUrl}`;
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
    <div className="relative flex flex-col gap-5 pb-44">
      {/* 2026-10-03: 맨 위 감지용 표시 요소 — 이 높이만큼 스크롤하면 상단 광고 배너가 최소화된다 (useScrolledPastTop) */}
      <div
        ref={adBannerSentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 w-px"
        style={{ height: adBannerSentinelHeight }}
      />
      {/* 1. Auto-Rolling Jackpot & FreeRoom Banner (Sticky Top) */}
      {/* 2026-10-03: 광고 배너가 화면과 구분되어 보이지 않도록 고정 영역의 아래 경계선·그림자 제거, 배너 아래 여백(pb-3) 제거
          (기존 className: "sticky top-0 z-30 bg-[#0D1B2A] -mx-4 px-4 pt-2.5 pb-3 border-b border-[#1F334D]/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)]")
          2026-10-03: 헤더(DOUBLE RING) 경계선과 배너 사이 틈을 없애도록 위 여백(pt-2.5, 10px)도 제거 */}
      <div className="sticky top-0 z-30 bg-[#0D1B2A] -mx-4 px-4">
        {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존).
            사유: 상단을 광고 BM용 배너(HomeAdBanner)로 바꾸면서 "라이브 프로그래시브 / 전체보기" 제목 줄 전체를 노출하지 않기로 함.
                  프로그래시브 목록은 하단 GNB "프로그래시브" 탭으로 계속 진입 가능. 복구 시 handleJackpotMoreClick과 함께 사용.
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">local_fire_department</span>
            라이브 프로그래시브
          </h3>
          <button
            onClick={handleJackpotMoreClick}
            className="text-[11px] text-slate-400 hover:text-[#C5A059] flex items-center gap-0.5"
          >
            <span>전체보기</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
        */}
        {/* 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 광고 BM용 배너(HomeAdBanner)로 교체.
        <JackpotBanner />
        */}
        {/* 광고 배너: 화면 좌우 끝까지(-mx-4), 홈 첫 진입·맨 위 = 최대화, 스크롤하면 최소화 */}
        <div className="-mx-4">
          <HomeAdBanner isCompact={isAdBannerCompact} />
        </div>
      </div>

      {/* 2. 실시간 예측 챌린지 캐러셀 배너 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">query_stats</span>
            실시간 예측 챌린지
          </h3>
          <button
            onClick={handlePolyCardClick}
            className="text-[11px] text-slate-400 hover:text-[#C5A059] flex items-center gap-0.5"
          >
            <span>전체보기</span>
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
            파트너스 커뮤니티
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
                      src={`https://dou-cdn.wildwynn.com/aimanager/logo/${post.tb_logo}`}
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
                    <img src={`https://dou-cdn.wildwynn.com/contents/thumb/${post.tb_thumb_url}`}  alt={post.tb_title} className="w-full h-full object-cover" />
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
                      <span>{post.count_like}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (requireLogin()) void toggleBookmarkPost(post.tb_index);
                      }}
                      className={`flex items-center gap-1 hover:text-[#C5A059] transition ${
                        post.is_user_bookmarked ? 'text-[#C5A059] font-bold' : ''
                      }`}
                    >
                      <span className={`material-symbols-outlined text-sm ${post.is_user_bookmarked ? 'fill-1 text-[#C5A059]' : ''}`}>
                        bookmark
                      </span>
                      <span>{post.count_bookmark}</span>
                    </button>
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
