import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const WritePostModal: React.FC = () => {
  const { addPost, setShowWriteModal, user } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('호텔/여행 후기');

  const categories = ['호텔/여행 후기', '폴리마켓', '잭팟/팁', '자유게시판'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addPost(title, content, category);
    setShowWriteModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D1B2A] border border-[#C5A059] rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F334D] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">edit_note</span>
            <h3 className="text-sm font-bold text-white">커뮤니티 포스트 작성</h3>
          </div>
          <button 
            onClick={() => setShowWriteModal(false)}
            className="text-slate-400 hover:text-white text-base"
          >
            ✕
          </button>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-3 bg-[#162639] p-2.5 rounded-xl border border-[#1F334D]">
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-[#C5A059]" />
          <div>
            <span className="text-xs font-bold text-white block">{user.name}</span>
            <span className="text-[10px] text-slate-400">{user.title}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">카테고리</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full border transition ${
                    category === cat
                      ? 'bg-[#C5A059] text-[#0D1B2A] border-[#C5A059] font-bold'
                      : 'bg-[#162639] text-slate-300 border-[#1F334D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">제목</label>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#162639] border border-[#1F334D] rounded-xl px-3 py-2 text-white font-medium focus:border-[#C5A059] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">내용</label>
            <textarea
              rows={4}
              placeholder="더블링 파트너들과 공유할 후기나 의견을 작성해 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#162639] border border-[#1F334D] rounded-xl p-3 text-white font-medium focus:border-[#C5A059] focus:outline-none resize-none"
              required
            ></textarea>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowWriteModal(false)}
              className="w-1/3 py-3 rounded-xl bg-[#162639] border border-[#1F334D] text-slate-300 font-bold"
            >
              취소
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow-md"
            >
              게시글 등록하기
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
