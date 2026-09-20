import React from 'react';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  MARKETING_CONSENT,
  LegalDocument,
  LegalSection,
} from '../data/legalContent';

export type TermsModalType = 'terms' | 'privacy' | 'marketing';

const DOCUMENTS: Record<TermsModalType, LegalDocument> = {
  terms: TERMS_OF_SERVICE,
  privacy: PRIVACY_POLICY,
  marketing: MARKETING_CONSENT,
};

interface TermsModalProps {
  open: boolean;
  type: TermsModalType;
  onClose: () => void;
}

// 원문의 "**강조**" 마크다운 표기를 <strong>으로 변환
function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`} className="text-slate-100">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  );
}

function DocumentBody({ body }: { body: string }) {
  return (
    <>
      {body.split('\n').map((line, idx) => (
        <p
          key={idx}
          className={`text-xs text-slate-300 leading-relaxed ${line.startsWith('-') ? 'pl-3' : ''}`}
        >
          {line ? renderInline(line, String(idx)) : ' '}
        </p>
      ))}
    </>
  );
}

function DocumentTable({ table }: { table: NonNullable<LegalSection['table']> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#1F334D]">
      <table className="w-full text-[10px] text-slate-300">
        <thead>
          <tr className="bg-[#0D1B2A]">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className="px-2 py-1.5 text-left font-bold text-slate-200 border-b border-[#1F334D] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 ? 'bg-[#0D1B2A]/40' : ''}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1.5 align-top border-b border-[#1F334D]/50">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentSection({ section }: { section: LegalSection }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-extrabold text-[#E2C28E]">{section.heading}</h4>
      {section.table && <DocumentTable table={section.table} />}
      {section.body && <DocumentBody body={section.body} />}
    </div>
  );
}

// 회원가입 등 여러 화면에서 재사용 가능한 약관/정책 문서 뷰어 모달.
// type에 해당하는 LegalDocument(legalContent.ts)를 그대로 렌더링한다.
export const TermsModal: React.FC<TermsModalProps> = ({ open, type, onClose }) => {
  if (!open) return null;

  const doc = DOCUMENTS[type];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#162639] border border-[#1F334D] rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1F334D]">
          <div>
            <h3 className="text-base font-black text-white">{doc.title}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">시행일자 {doc.effectiveDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto no-scrollbar space-y-5">
          {doc.sections.map((section, idx) => (
            <DocumentSection key={idx} section={section} />
          ))}
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow hover:brightness-110 active:scale-[0.98] transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
