import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useComments, COMMENT_TYPE_VIDEO, formatCommentTime } from '../hooks/useComments';

// 모바일 카드 폭 기준 2줄 정도로 보이는 글자 수 제한
const COMMENT_MAX_LENGTH = 60;

export const PostDetailScreen: React.FC = () => {
  const { selectedPost, setCurrentSubScreen, toggleLikePost, toggleBookmarkPost, showToast, requireLogin } = useApp();
  const [commentInput, setCommentInput] = useState('');
  const mediaAnchorRef = useRef<HTMLDivElement | null>(null);

  const {
    comments,
    commentsLoading,
    isSubmitting: isSubmittingComment,
    myUidx,
    submitComment,
    deleteComment: handleDeleteComment,
  } = useComments(COMMENT_TYPE_VIDEO, selectedPost?.tb_index || 0);

  // 목록에서 스크롤된 상태로 진입해도 상세 화면은 항상 비디오/썸네일부터 보이도록 앵커 처리
  useEffect(() => {
    mediaAnchorRef.current?.scrollIntoView({ block: 'start' });
  }, [selectedPost?.tb_index]);

  if (!selectedPost) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    const success = await submitComment(commentInput);
    if (success) setCommentInput('');
  };

  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      <button 
        onClick={() => setCurrentSubScreen(null)}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span>목록으로 돌아가기</span>
      </button>

      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        {/* Author Header */}
        {selectedPost.tb_type === 1 ? (
          <div className="border-b border-[#1F334D] pb-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">{selectedPost.tb_title}</h2>
              <span className="text-xs font-bold text-[#0D1B2A] bg-[#C5A059] px-2.5 py-1 rounded-full shadow-sm shrink-0">
                {selectedPost.cate_name}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[13px] text-slate-500">schedule</span>
              <span>{selectedPost.tb_reg_datetime || '방금 전'}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
            <div className="flex items-center gap-3">
              <img src={`https://dou-cdn.wildwynn.com/aimanager/logo/${selectedPost.tb_logo}`} alt={selectedPost.cate_name} className="w-10 h-10 rounded-full border border-[#C5A059]" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">{selectedPost.cate_name}</span>
                  <span className="text-[10px] text-[#C5A059] bg-[#C5A059]/15 px-1.5 py-0.2 rounded">
                    {selectedPost.tb_desc}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{selectedPost.tb_reg_datetime || '방금 전'}</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#C5A059] bg-[#0D1B2A] px-2.5 py-1 rounded-full border border-[#1F334D]">
            #{selectedPost.cate_name}
            </span>
            <span className="text-xs font-semibold text-[#C5A059] bg-[#0D1B2A] px-2.5 py-1 rounded-full border border-[#1F334D]">
            #{selectedPost.cate_sub_name}
            </span>
            <span className="text-xs font-semibold text-[#C5A059] bg-[#0D1B2A] px-2.5 py-1 rounded-full border border-[#1F334D]">
            #{selectedPost.class_name}
            </span>

          </div>
        )}

        {/* Post Title & Body (tb_type===1은 위 Author Header에서 타이틀을 이미 표시) */}
        {selectedPost.tb_type !== 1 && (
          <div>
            <h2 className="text-base font-bold text-white mb-2">{selectedPost.tb_title}</h2>
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{selectedPost.tb_title}</p>
          </div>
        )}

        {/* Video / Attached Image */}
        <div ref={mediaAnchorRef} />
        {selectedPost.tb_type === 1 ? (
          <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-[#0D1B2A] border border-[#1F334D] my-1">
            <video 
              src={`https://dou-cdn.wildwynn.com/contents/${selectedPost.tb_file_url}`} 
              poster={`https://dou-cdn.wildwynn.com/contents/thumb/${selectedPost.tb_thumb_url}`}
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          selectedPost.tb_thumb_url && (
            <div className="rounded-xl overflow-hidden max-h-60 w-full my-1">
              <img src={`https://dou-cdn.wildwynn.com/contents/thumb/${selectedPost.tb_thumb_url}`} alt={selectedPost.tb_title} className="w-full h-full object-cover" />
            </div>
          )
        )}

        {/* Hashtags for video promo */}
        {selectedPost.tb_type === 1  && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2.5 py-1 rounded border border-[#1F334D]">
            #{selectedPost.cate_name}
            </span>
            <span className="text-xs font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2.5 py-1 rounded border border-[#1F334D]">
            #{selectedPost.cate_sub_name}
            </span>
            <span className="text-xs font-semibold text-[#E2C28E] bg-[#0D1B2A] px-2.5 py-1 rounded border border-[#1F334D]">
            #{selectedPost.class_name}
            </span>
          </div>
        )}

        {/* Like & Bookmark & Share Action bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1F334D] text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (requireLogin()) void toggleLikePost(selectedPost.tb_index);
              }}
              className={`flex items-center gap-1.5 ${selectedPost.is_user_liked ? 'text-rose-400 font-bold' : 'text-slate-400'}`}
            >
              <span className={`material-symbols-outlined text-base ${selectedPost.is_user_liked ? 'fill-1' : ''}`}>
                favorite
              </span>
              <span>좋아요 ({selectedPost.count_like})</span>
            </button>

            <button
              onClick={() => {
                if (requireLogin()) void toggleBookmarkPost(selectedPost.tb_index);
              }}
              className={`flex items-center gap-1.5 ${selectedPost.is_user_bookmarked ? 'text-[#C5A059] font-bold' : 'text-slate-400'}`}
            >
              <span className={`material-symbols-outlined text-base ${selectedPost.is_user_bookmarked ? 'fill-1' : ''}`}>
                bookmark
              </span>
              <span>북마크 ({selectedPost.count_bookmark})</span>
            </button>
          </div>

          <button
            onClick={() => showToast('포스트 링크가 복사되었습니다.')}
            className="flex items-center gap-1 text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>공유하기</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {commentsLoading ? '불러오는 중...' : `댓글 (${comments.length})`}
          </h3>

          <div className="space-y-2">
            {comments.map((comment) => {
              const authorName = comment.u_name || comment.mem_name || `회원 ${comment.mem_index}`;
              const authorAvatar = comment.u_profile || comment.mem_profile || '';
              const isMine = myUidx != null && comment.mem_index === myUidx;

              return (
                <div key={comment.tb_index} className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-[#C5A059]/40"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-[#162639] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                          <span className="material-symbols-outlined text-sm">person</span>
                        </span>
                      )}
                      <span className="font-bold text-[#E2C28E]">{authorName}{isMine ? ' (나)' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{formatCommentTime(comment.reg_timestamp)}</span>
                      {isMine && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.tb_index)}
                          className="text-slate-500 hover:text-rose-400 transition"
                          aria-label="댓글 삭제"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-200 leading-relaxed pl-8 line-clamp-2">{comment.tb_comment}</p>
                </div>
              );
            })}
            {!commentsLoading && comments.length === 0 && (
              <p className="text-center text-slate-500 py-4">아직 등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex flex-col gap-1 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="댓글을 입력하세요..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                maxLength={COMMENT_MAX_LENGTH}
                disabled={isSubmittingComment}
                className="flex-1 bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#C5A059] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="px-3 py-2 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shrink-0 disabled:opacity-50"
              >
                등록
              </button>
            </div>
            <span className="text-[10px] text-slate-500 text-right font-mono pr-1">
              {commentInput.length}/{COMMENT_MAX_LENGTH}
            </span>
          </form>
        </div>

      </div>
    </div>
  );
};
