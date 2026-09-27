import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// 2026-09-27: 프로그래시브 정보가 아직 없는(입점 전) 호텔 상세 화면용 Coming Soon 블록.
// HotelJackpotDetailScreen에서 게임(jackpots)이 0개일 때 요약 박스·트리맵·게임 목록 대신 표시한다.
// "입점 문의하기"는 서버 API 없이 이메일 안내만 한다(주소 복사).

const CONTACT_EMAIL = 'Contactus@wildwynn.com';

const UPCOMING_FEATURES = [
  { icon: 'payments', label: '실시간 누적 프로그래시브 금액' },
  { icon: 'casino', label: '게임별 프로그래시브 현황' },
  { icon: 'history', label: '당첨 기록 / 당첨금 / 당첨자 국적' },
];

interface ProgressiveComingSoonProps {
  hotelName: string;
}

export const ProgressiveComingSoon: React.FC<ProgressiveComingSoonProps> = ({ hotelName }) => {
  const { showToast } = useApp();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  // 2026-09-27 비활성화: 메일 보내기 기능은 아직 제공하지 않음(아래 버튼 주석 참고).
  // const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[DOUBLE RING] ${hotelName} 입점 문의`)}`;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      showToast('이메일 주소가 복사되었습니다.');
    } catch (error) {
      console.error('이메일 주소 복사 실패:', error);
      showToast(`복사에 실패했습니다. ${CONTACT_EMAIL} 로 문의해 주세요.`);
    }
  };

  return (
    <>
      <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E]">
            <span className="material-symbols-outlined text-2xl">hourglass_top</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold leading-tight tracking-tight text-[#E2C28E]">Coming Soon</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 break-keep">
              {hotelName}의 프로그래시브 정보를 준비하고 있습니다.
            </p>
          </div>
        </div>

        <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-slate-400">입점이 완료되면 아래 정보를 제공합니다.</p>
          <ul className="flex flex-col gap-2.5">
            {UPCOMING_FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-2.5 text-xs font-semibold text-slate-200">
                <span className="material-symbols-outlined text-base text-[#C5A059]">{feature.icon}</span>
                <span>{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setIsInquiryOpen(true)}
          className="w-full py-3.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-lg">mail</span>
          <span>입점 문의하기</span>
        </button>
      </div>

      {/* z-[45]: 헤더·하단 네비(z-40) 위, 앱 공통 토스트(z-50) 아래 — 복사 완료 토스트가 가려지지 않도록 */}
      {isInquiryOpen && (
        <div
          className="fixed inset-0 z-[45] flex items-center justify-center bg-[#0D1B2A]/80 px-4"
          onClick={() => setIsInquiryOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="progressive-inquiry-title"
            className="w-full max-w-[380px] bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 id="progressive-inquiry-title" className="text-base font-extrabold text-white">입점 문의</h3>
              <button
                type="button"
                onClick={() => setIsInquiryOpen(false)}
                aria-label="닫기"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0D1B2A] transition"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 break-keep">
              {hotelName} 입점 및 제휴 문의는 아래 이메일로 보내 주세요.
            </p>

            <div className="bg-[#0D1B2A] border border-[#1F334D] rounded-xl pl-4 pr-2 py-2 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-bold text-[#E2C28E]">{CONTACT_EMAIL}</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-200 border border-[#1F334D] hover:border-[#C5A059]/60 transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>복사</span>
              </button>
            </div>

            {/* 2026-09-27 비활성화 (삭제하지 않고 주석 보존).
                사유: 메일 보내기 기능은 아직 제공하지 않기로 함. 이메일 주소 복사 버튼만 사용.
                되살릴 경우 위 mailtoHref 주석도 함께 해제.
            <a
              href={mailtoHref}
              className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              <span>메일 보내기</span>
            </a>
            */}
          </div>
        </div>
      )}
    </>
  );
};
