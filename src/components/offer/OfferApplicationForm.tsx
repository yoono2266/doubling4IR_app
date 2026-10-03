import React, { useMemo, useState } from 'react';
import { OfferPlan, OfferRoom } from '../../data/offerRoomData';

// 2026-09-30: 오퍼 신청 정보 입력 화면 (오퍼 탭 리뉴얼).
// 본 플랫폼에서는 결제가 없다. 신청 정보를 받아 호텔과 직접 부킹하고, 호텔 확정 후
// 확정 내용과 예약 번호를 메일로 보내는 방식 (고객은 호텔에서 예약 번호로 이후 절차 진행).
// 💡 신청 접수 API가 아직 없어 제출은 화면 안에서만 처리되는 mock이다 (BE 요청 REQ-260930-03).
//    여권 번호·사본, 호텔 멤버십 카드 사진 등 개인정보는 어디에도 저장·전송하지 않으며, 화면을 닫으면 사라진다.

interface OfferApplicationFormProps {
  hotelName: string;
  room: OfferRoom;
  plan: OfferPlan;
  defaultEmail?: string;
  onClose: () => void;
}

type FieldKey =
  | 'checkIn'
  | 'checkOut'
  | 'surname'
  | 'givenName'
  | 'passportNo'
  | 'email'
  | 'arrivalAt'
  | 'departureAt'
  | 'passportFile'
  | 'membershipCardFile'
  | 'agree';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const toLocalDate = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const inputClass =
  'w-full rounded-xl border border-[#1F334D] bg-[#0D1B2A] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-[#C5A059] focus:outline-none [color-scheme:dark]';

const Field: React.FC<{ label: string; htmlFor: string; error?: string; helper?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  error,
  helper,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-300">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-[11px] font-semibold text-amber-300">{error}</p>
    ) : (
      helper && <p className="text-[11px] text-slate-500">{helper}</p>
    )}
  </div>
);

export const OfferApplicationForm: React.FC<OfferApplicationFormProps> = ({ hotelName, room, plan, defaultEmail, onClose }) => {
  const today = useMemo(() => toLocalDate(new Date()), []);
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [surname, setSurname] = useState<string>('');
  const [givenName, setGivenName] = useState<string>('');
  const [passportNo, setPassportNo] = useState<string>('');
  const [email, setEmail] = useState<string>(defaultEmail ?? '');
  const [arrivalFlight, setArrivalFlight] = useState<string>('');
  const [arrivalAt, setArrivalAt] = useState<string>('');
  const [departureFlight, setDepartureFlight] = useState<string>('');
  const [departureAt, setDepartureAt] = useState<string>('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  // 2026-09-30: 보유한 호텔 멤버십 카드 사진 (호텔 최소 등급 확인용).
  // 조건부 1+1만 필수, Free Room·할인·일반 예약은 선택.
  const [membershipCardFile, setMembershipCardFile] = useState<File | null>(null);
  const isMembershipCardRequired = plan.id === 'conditional';
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000;
    return diff > 0 ? Math.round(diff) : 0;
  }, [checkIn, checkOut]);

  const validate = (): Partial<Record<FieldKey, string>> => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!checkIn) next.checkIn = '체크인 날짜를 선택해 주세요.';
    if (!checkOut) next.checkOut = '체크아웃 날짜를 선택해 주세요.';
    else if (checkIn && checkOut <= checkIn) next.checkOut = '체크아웃은 체크인 다음 날 이후여야 해요.';
    if (!/^[A-Za-z][A-Za-z\s-]*$/.test(surname.trim())) next.surname = '여권과 같은 영문 성을 입력해 주세요.';
    if (!/^[A-Za-z][A-Za-z\s-]*$/.test(givenName.trim())) next.givenName = '여권과 같은 영문 이름을 입력해 주세요.';
    if (!/^[A-Za-z0-9]{6,12}$/.test(passportNo.trim())) next.passportNo = '여권번호를 영문·숫자로 정확히 입력해 주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = '확정 메일을 받을 이메일을 입력해 주세요.';
    // 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 항공편 정보 입력란 전체 삭제 요청 → 관련 검사도 제외.
    // if (arrivalFlight.trim() && !arrivalAt) next.arrivalAt = '도착 일시를 입력해 주세요.';
    // if (departureFlight.trim() && !departureAt) next.departureAt = '출발 일시를 입력해 주세요.';
    if (!passportFile) next.passportFile = '여권 사본을 첨부해 주세요.';
    // 2026-10-03 비활성화 (삭제하지 않고 주석 보존). 사유: 호텔 멤버십 카드 사진 입력란 삭제 요청 → 조건부 1+1 필수 검사도 제외
    //   (입력란이 없는데 필수 검사가 남으면 조건부 1+1 신청서를 제출할 수 없음).
    // if (isMembershipCardRequired && !membershipCardFile) next.membershipCardFile = '보유하신 호텔 멤버십 카드 사진을 첨부해 주세요.';
    if (!isAgreed) next.agree = '개인정보 수집 및 호텔 제공에 동의해 주세요.';
    return next;
  };

  // 첨부 파일 공통 처리 (여권 사본 / 호텔 멤버십 카드) — 10MB 초과 시 첨부하지 않고 안내
  const handleFileChange =
    (key: 'passportFile' | 'membershipCardFile', setFile: (file: File | null) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (file && file.size > MAX_FILE_BYTES) {
        setFile(null);
        setErrors(prev => ({ ...prev, [key]: '10MB 이하의 파일만 첨부할 수 있어요.' }));
        event.target.value = '';
        return;
      }
      setFile(file);
      setErrors(prev => ({ ...prev, [key]: undefined }));
    };

  const handleSubmit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // mock: 신청 접수 API 연동 전이라 서버로 보내지 않고 접수 완료 화면만 표시
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-[#070E17]/80">
      <div className="flex h-full w-full max-w-[430px] flex-col bg-[#0D1B2A]">
        {/* 헤더 */}
        <div className="flex items-center gap-3 border-b border-[#1F334D] px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1F334D] text-slate-300 transition active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">{isSubmitted ? '신청 접수 완료' : '예약 정보 입력'}</h2>
            <p className="truncate text-[11px] text-slate-400">
              {room.name} ({plan.title})
            </p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="material-symbols-outlined text-4xl text-[#C5A059]">mark_email_read</span>
              <h3 className="text-base font-extrabold text-white">예약 신청이 접수되었어요</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                호텔 확정 후 {email.trim()}(으)로 확정 내용과 예약 번호를 보내드려요.
                <br />
                호텔에서 예약 번호로 이후 절차를 진행하시면 돼요.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-[#1F334D] bg-[#162639] p-4 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">호텔</span>
                <span className="text-right font-semibold text-white">{hotelName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">객실</span>
                <span className="text-right font-semibold text-white">{room.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">오퍼</span>
                <span className="text-right font-semibold text-white">{plan.title}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">일정</span>
                <span className="text-right font-semibold text-white tabular-nums">
                  {checkIn} ~ {checkOut} ({nights}박)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-auto w-full rounded-xl py-3.5 text-sm font-extrabold text-[#0D1B2A] gold-button-gradient transition active:scale-[0.98]"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
              <p className="rounded-xl border border-[#1F334D] bg-[#162639] p-3 text-[11px] leading-relaxed text-slate-300">
                DOUBLE RING에서는 결제가 진행되지 않아요. 입력하신 정보로 호텔에 직접 부킹하고, 호텔 확정 후 예약 번호를 메일로 보내드려요.
              </p>

              {/* 일정 */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white">숙박 일정</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="체크인" htmlFor="offer-check-in" error={errors.checkIn}>
                    <input id="offer-check-in" type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="체크아웃" htmlFor="offer-check-out" error={errors.checkOut}>
                    <input id="offer-check-out" type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)} className={inputClass} />
                  </Field>
                </div>
                {nights > 0 && (
                  <p className="text-[11px] text-slate-400">
                    총 {nights}박{plan.id === 'conditional' ? ' (조건부 1+1은 4박 기준이에요)' : ''}
                  </p>
                )}
              </section>

              {/* 투숙객 정보 */}
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-white">투숙객 정보</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="영문 성" htmlFor="offer-surname" error={errors.surname}>
                    <input id="offer-surname" type="text" autoComplete="family-name" placeholder="HONG" value={surname} onChange={e => setSurname(e.target.value.toUpperCase())} className={inputClass} />
                  </Field>
                  <Field label="영문 이름" htmlFor="offer-given-name" error={errors.givenName}>
                    <input id="offer-given-name" type="text" autoComplete="given-name" placeholder="GILDONG" value={givenName} onChange={e => setGivenName(e.target.value.toUpperCase())} className={inputClass} />
                  </Field>
                </div>
                <Field label="여권번호" htmlFor="offer-passport-no" error={errors.passportNo} helper="여권에 적힌 번호를 그대로 입력해 주세요.">
                  <input id="offer-passport-no" type="text" autoComplete="off" placeholder="M12345678" value={passportNo} onChange={e => setPassportNo(e.target.value.toUpperCase())} className={inputClass} />
                </Field>
                <Field label="여권 사본" htmlFor="offer-passport-file" error={errors.passportFile} helper="사진 면이 잘 보이는 이미지 또는 PDF (10MB 이하)">
                  <label
                    htmlFor="offer-passport-file"
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#1F334D] bg-[#0D1B2A] px-3.5 py-3 text-sm text-slate-300 transition hover:border-[#C5A059]/60"
                  >
                    <span className="material-symbols-outlined text-lg text-[#C5A059]">upload_file</span>
                    <span className="truncate">{passportFile ? passportFile.name : '파일 선택'}</span>
                  </label>
                  <input id="offer-passport-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange('passportFile', setPassportFile)} className="sr-only" />
                </Field>
                {/* 2026-10-03 비활성화 (삭제하지 않고 보존). 사유: 호텔 멤버십 카드 사진 입력란 삭제 요청. 복구 시 false 제거. */}
                {false && (
                <Field
                  label={isMembershipCardRequired ? '호텔 멤버십 카드 사진' : '호텔 멤버십 카드 사진 (선택)'}
                  htmlFor="offer-membership-card-file"
                  error={errors.membershipCardFile}
                  helper={
                    isMembershipCardRequired
                      ? '보유하신 호텔 멤버십 카드의 이름·등급이 보이게 찍어 주세요 (10MB 이하)'
                      : '보유하신 호텔 멤버십 카드가 있으면 첨부해 주세요 (10MB 이하)'
                  }
                >
                  <label
                    htmlFor="offer-membership-card-file"
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#1F334D] bg-[#0D1B2A] px-3.5 py-3 text-sm text-slate-300 transition hover:border-[#C5A059]/60"
                  >
                    <span className="material-symbols-outlined text-lg text-[#C5A059]">badge</span>
                    <span className="truncate">{membershipCardFile ? membershipCardFile.name : '파일 선택'}</span>
                  </label>
                  <input id="offer-membership-card-file" type="file" accept="image/*,application/pdf" onChange={handleFileChange('membershipCardFile', setMembershipCardFile)} className="sr-only" />
                </Field>
                )}
                <Field label="확정 메일 받을 이메일" htmlFor="offer-email" error={errors.email}>
                  <input id="offer-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                </Field>
              </section>

              {/* 2026-10-03 비활성화 (삭제하지 않고 보존). 사유: 항공편 정보 전체 삭제 요청. 복구 시 false 제거. */}
              {false && (
              /* 항공편 (픽업 서비스용) */
              <section className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">항공편 정보</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">공항 픽업·샌딩을 원하시면 입력해 주세요.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="도착 편명" htmlFor="offer-arrival-flight">
                    <input id="offer-arrival-flight" type="text" placeholder="KE621" value={arrivalFlight} onChange={e => setArrivalFlight(e.target.value.toUpperCase())} className={inputClass} />
                  </Field>
                  <Field label="도착 일시" htmlFor="offer-arrival-at" error={errors.arrivalAt}>
                    <input id="offer-arrival-at" type="datetime-local" value={arrivalAt} onChange={e => setArrivalAt(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="출발 편명" htmlFor="offer-departure-flight">
                    <input id="offer-departure-flight" type="text" placeholder="KE622" value={departureFlight} onChange={e => setDepartureFlight(e.target.value.toUpperCase())} className={inputClass} />
                  </Field>
                  <Field label="출발 일시" htmlFor="offer-departure-at" error={errors.departureAt}>
                    <input id="offer-departure-at" type="datetime-local" value={departureAt} onChange={e => setDepartureAt(e.target.value)} className={inputClass} />
                  </Field>
                </div>
              </section>
              )}

              {/* 동의 */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={e => setIsAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#C5A059]"
                  />
                  {/* 2026-10-03 문구 변경 요청 (기존: 예약을 위해 여권 정보, 여권 사본, 호텔 멤버십 카드 사진을 수집하고 {hotelName}에 제공하는 데 동의합니다.) */}
                  <span>예약을 위해 여권 정보, 여권 사본을 수집하고 제공하는 데 동의합니다.</span>
                </label>
                {errors.agree && <p className="text-[11px] font-semibold text-amber-300">{errors.agree}</p>}
              </div>
            </div>

            <div className="border-t border-[#1F334D] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-xl py-3.5 text-sm font-extrabold text-[#0D1B2A] gold-button-gradient transition hover:brightness-110 active:scale-[0.98]"
              >
                예약 신청하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
