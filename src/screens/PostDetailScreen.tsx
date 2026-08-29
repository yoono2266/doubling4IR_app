import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PostDetailScreen: React.FC = () => {
  const { selectedPost, setCurrentSubScreen, toggleLikePost, showToast, requireLogin } = useApp();
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Alexander Kim', text: '스위트룸 버틀러 서비스 정보 유용하네요!', time: '10분 전' },
    { id: 'c2', author: 'David Park', text: '다음달 마닐라 출장 때 꼭 이용해보겠습니다.', time: '5분 전' }
  ]);

  if (!selectedPost) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    if (!commentInput.trim()) return;

    setComments(prev => [
      ...prev,
      { id: `c-${Date.now()}`, author: 'Kevin', text: commentInput, time: '방금 전' }
    ]);
    setCommentInput('');
    showToast('댓글이 등록되었습니다.');
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
          <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
            <div>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-slate-500">schedule</span>
                <span>{selectedPost.tb_reg_datetime || '방금 전'}</span>
              </span>
            </div>
            <span className="text-xs font-bold text-[#0D1B2A] bg-[#C5A059] px-2.5 py-1 rounded-full shadow-sm">
              {selectedPost.cate_name}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
            <div className="flex items-center gap-3">
              <img src={`https://dou-cdn.wildwynn.com/static/upload/aimanager/logo/${selectedPost.tb_logo}`} alt={selectedPost.cate_name} className="w-10 h-10 rounded-full border border-[#C5A059]" />
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

        {/* Post Title & Body */}
        <div>
          <h2 className="text-base font-bold text-white mb-2">{selectedPost.tb_title}</h2>
          {selectedPost.tb_type !== 1 && (
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{selectedPost.tb_title}</p>
          )}
        </div>

        {/* Video / Attached Image */}
        {selectedPost.tb_type === 1 ? (
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0D1B2A] border border-[#1F334D] my-1">
            <video 
              src={`https://dou-cdn.wildwynn.com/static/upload/contents/${selectedPost.tb_file_url}`} 
              poster={`https://dou-cdn.wildwynn.com/static/upload/contents/thumb/${selectedPost.tb_thumb_url}`}
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          selectedPost.tb_thumb_url && (
            <div className="rounded-xl overflow-hidden max-h-60 w-full my-1">
              <img src={`https://dou-cdn.wildwynn.com/static/upload/contents/thumb/${selectedPost.tb_thumb_url}`} alt={selectedPost.tb_title} className="w-full h-full object-cover" />
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

        {/* Like & Share Action bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1F334D] text-xs">
          <button 
            onClick={() => {
              if (requireLogin()) void toggleLikePost(selectedPost.tb_index);
            }}
            className={`flex items-center gap-1.5 ${selectedPost.is_user_liked ? 'text-rose-400 font-bold' : 'text-slate-400'}`}
          >
            <span className={`material-symbols-outlined text-base ${selectedPost.is_user_liked ? 'fill-1' : ''}`}>
              favorite
            </span>
            <span>좋아요 ({selectedPost.is_user_liked})</span>
          </button>

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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">댓글 ({comments.length})</h3>

          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#E2C28E]">{c.author}</span>
                  <span className="text-[10px] text-slate-500">{c.time}</span>
                </div>
                <p className="text-slate-200">{c.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input 
              type="text" 
              placeholder="댓글을 입력하세요..." 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-1 bg-[#0D1B2A] border border-[#1F334D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#C5A059] focus:outline-none"
            />
            <button 
              type="submit" 
              className="px-3 py-2 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs"
            >
              등록
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
