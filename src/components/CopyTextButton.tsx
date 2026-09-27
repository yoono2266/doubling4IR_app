import React from 'react';
import { useApp } from '../context/AppContext';

// 2026-09-27: 텍스트 복사용 작은 아이콘 버튼 (마이페이지 CODE 복사 등).
// 복사 성공/실패를 앱 공통 토스트로 알린다. 부모가 클릭 가능한 카드여도 이벤트가 전파되지 않게 막는다.

interface CopyTextButtonProps {
  text: string;
  successMessage: string;
  ariaLabel: string;
  className?: string;
}

export const CopyTextButton: React.FC<CopyTextButtonProps> = ({ text, successMessage, ariaLabel, className = '' }) => {
  const { showToast } = useApp();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      showToast('복사에 실패했습니다. 직접 선택해 복사해 주세요.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-md border border-[#1F334D] text-slate-400 hover:text-[#E2C28E] hover:border-[#C5A059]/50 active:scale-95 transition shrink-0 ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]">content_copy</span>
    </button>
  );
};
