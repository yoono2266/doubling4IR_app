import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { apiCommonClient, ApiError, ResultCode } from '../utils/apiClient';
import { StreakTracker } from '../components/StreakTracker';
import { MembershipDashboardScreen } from './MembershipDashboardScreen';
import { PolyPortfolioHistoryScreen } from './PolyPortfolioHistoryScreen';
import { CompBenefitSelectionScreen } from './CompBenefitSelectionScreen';
import { CurrentTripSummaryScreen } from './CurrentTripSummaryScreen';
import { MEMBERSHIP_TIERS } from '../data/membershipData';

// Unix timestamp(초) → "yyyy-mm-dd hh:mm:ss" 문자열 변환
const formatDateTime = (timestamp: any): string => {
  const ts = Number(timestamp);
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 💡 안전한 localStorage JSON 파싱 헬퍼 함수
const getSafeUserInfo = () => {
  try {
    const item = localStorage.getItem('user_info');
    return item && item.trim() !== '' ? JSON.parse(item) : {};
  } catch (e) {
    console.error('user_info 파싱 오류:', e);
    return {};
  }
};

interface MemberResponse {
  result: ResultCode | number;
  memberInfo?: any;
  memberShip?: any;
  memPickList?: any;
  memberReward?: any;
  data?: any;
  message?: string;
}

interface memberParam {
  u_id: string;
}

// MyPageScreen.tsx - SUB-MENU 7: SETTINGS 부분

// API 요청/응답 타입 정의 (컴포넌트 상단 또는 파일 외부에 선언)
interface UsettingParam {
  uidx?: number;
  u_notification?: number;
  u_select_1?: number;
}

interface UsettingResponse {
  result: ResultCode | number;
  message?: string;
  data?: any;
}

export const MyPageScreen: React.FC = () => {
  const {
    myProfile,
    setMyProfile,
    user,
    reservations,
    polyVotes,
    settings,
    updateSettings,
    hasActiveTrip,
    setHasActiveTrip,
    currentSubScreen,
    setCurrentSubScreen,
    setIsLoggedIn,
    showToast
  } = useApp();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 💡 API 서버에서 회원 데이터 조회 및 myProfile 상태 저장 함수
  const getMemberData = useCallback(async () => {
    const uinfoMy = getSafeUserInfo();
    const uidx = uinfoMy['uidx'];
    const u_id = uinfoMy['u_id'];

    if (!uidx || isLoading) return;

    setIsLoading(true);

    try {
      console.log(`[회원정보 요청] uidx: ${uidx}, u_id: ${u_id}`);

      const response = await apiCommonClient.post<MemberResponse, memberParam>(
        `/members/${Number(uidx)}`,
        { u_id: u_id || '' }
      );

      console.log('회원 정보 API 응답:', response);

      if (response && (response.result === ResultCode.SUCCESS || response.result === 0)) {
        // 서버 응답 객체 추출 (data 껍질 지원)
        const resData = response.data || response;
        
        const memberInfo = resData.memberInfo || resData.uinfo || {};
        const memberShip = resData.memberShip || {};
        const memPickList = resData.memPickList || []
        const memberReward = resData.memberReward || [];

        console.log('저장할 memberInfo:', memberInfo);

        // 💡 [핵심] AppContext의 setMyProfile로 4개 객체 전달하여 상태 저장
        setMyProfile(memberInfo, memberShip, memPickList, memberReward);
      } else {
        console.warn('회원 정보 조회 실패:', response?.message);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`회원 정보 API 에러 (${error.status}):`, error.message);
      } else {
        console.error('회원 정보 요청 중 오류:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setMyProfile]);

  // 마운트 시 데이터 수신
  useEffect(() => {
    getMemberData();
  }, []);

  const rewardUserCode = () => {
    return `DBL-${myProfile?.memberInfo.u_language}-10${myProfile?.memberInfo?.uidx}00`;
  }
  const handleCopyReferral = () => {
    
    navigator.clipboard.writeText(`https://doubling.wildwynn.com/ref/${rewardUserCode()}`);
    showToast('추천인 초대 링크가 클립보드에 복사되었습니다!');
  };

  console.log('저장한 myProfile?.memberInfo:', myProfile?.memberInfo);
  console.log('저장한 myProfile?.memberShip:', myProfile?.memberShip);
  console.log('저장한 myProfile?.memPickList:', myProfile?.memPickList);
  console.log('저장한 myProfile?.memberReward:', myProfile?.memberReward);

  // 💡 myProfile에서 실시간으로 저장된 사용자 정보 꺼내기
  const memberInfo = myProfile?.memberInfo || {};
  const userName = memberInfo?.u_name || user?.name || '회원';

  // 서버 memberShip(현재 등급)의 tb_index를 로컬 membershipData의 id와 매칭해 보완 정보(주얼리 컨셉 등)를 찾고,
  // 표시값은 기본적으로 API(memberShip) 데이터를 우선 사용한다.
  const apiTier = myProfile?.memberShip && typeof myProfile.memberShip === 'object' ? myProfile.memberShip : null;
  const localTier = apiTier ? MEMBERSHIP_TIERS.find((t) => t.id === String(apiTier.tb_index)) || null : null;
  const tierDisplayName = apiTier?.tb_title_ko || localTier?.koreanName || apiTier?.tb_title_en || localTier?.englishName || 'White';
  
  // 프로필 이미지 주소 판별 (상대경로 대응)
  let profileImg = memberInfo?.u_profile || user?.avatar || '';
  if (profileImg && !profileImg.startsWith('http')) {
    profileImg = `https://dou-cdn.wildwynn.com/static/upload/member/${profileImg}`;
  }

  // 사용자가 직접 등록한 프로필 사진 (mock — 실제 업로드 API 연동이 아니라 브라우저 로컬 저장).
  // 새로고침 후에도 유지되며, "기본 이미지로 변경"으로 해제 가능.
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    try {
      return localStorage.getItem('custom_profile_img') || '';
    } catch {
      return '';
    }
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // 최종 표시용 프로필 이미지 (직접 등록 > 서버/기본값)
  const displayAvatar = customAvatar || profileImg;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 등록할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('5MB 이하 이미지만 등록할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      setCustomAvatar(dataUrl);
      try {
        localStorage.setItem('custom_profile_img', dataUrl);
      } catch (err) {
        console.error('프로필 사진 저장 실패:', err);
      }
      showToast('프로필 사진이 변경되었습니다.');
    };
    reader.onerror = () => showToast('이미지를 읽는 중 오류가 발생했습니다.');
    reader.readAsDataURL(file);
  };

  const handleAvatarReset = () => {
    setCustomAvatar('');
    try {
      localStorage.removeItem('custom_profile_img');
    } catch (err) {
      console.error('프로필 사진 초기화 실패:', err);
    }
    showToast('프로필 사진이 기본 이미지로 변경되었습니다.');
  };

  // 배포 기준: 멤버십 등급 관리 / 예측 포트폴리오 / Comp 혜택 신청 / 이번 여행 요약은 전용 화면으로 위임
  if (currentSubScreen === 'my-membership' || currentSubScreen === 'membership-dashboard') {
    return <MembershipDashboardScreen />;
  }
  if (currentSubScreen === 'my-poly-history') {
    return <PolyPortfolioHistoryScreen />;
  }
  if (currentSubScreen === 'comp-benefits') {
    return <CompBenefitSelectionScreen />;
  }
  if (currentSubScreen === 'current-trip-summary') {
    if (!hasActiveTrip) {
      setCurrentSubScreen(null);
      return null;
    }
    return <CurrentTripSummaryScreen />;
  }

  // SUB-MENU 1: PROFILE
  if (currentSubScreen === 'my-profile') {
    return (
      <div className="flex flex-col gap-4 pb-44 pt-2">
        <button 
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059]">badge</span>
          파트너 프로필 정보
        </h2>

        <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-5 flex flex-col gap-4 shadow-md">
          <div className="flex items-center gap-4 border-b border-[#1F334D] pb-4">
            {/* 프로필 사진 (클릭 또는 카메라 버튼으로 변경) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="block w-16 h-16 rounded-full overflow-hidden border-2 border-[#C5A059] focus:outline-none focus:ring-2 focus:ring-[#E2C28E]"
                title="프로필 사진 변경"
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full bg-[#0D1B2A] flex items-center justify-center text-[#C5A059]">
                    <span className="material-symbols-outlined text-3xl">person</span>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gold-button-gradient text-[#0D1B2A] border-2 border-[#162639] flex items-center justify-center shadow hover:brightness-110 active:scale-95 transition"
                title="프로필 사진 변경"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">{userName} 님</h3>
              <p className="text-xs text-[#E2C28E] font-medium">{tierDisplayName} VIP Member</p>
              <p className="text-xs text-slate-400">{myProfile?.memberInfo?.company || '-'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-[11px] font-bold text-[#0D1B2A] gold-button-gradient px-2 py-0.5 rounded hover:brightness-110 active:scale-95 transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">upload</span>
                  <span>사진 등록/변경</span>
                </button>
                {customAvatar && (
                  <button
                    type="button"
                    onClick={handleAvatarReset}
                    className="text-[11px] font-bold text-slate-300 bg-[#0D1B2A] border border-[#1F334D] px-2 py-0.5 rounded hover:border-[#C5A059]/50 hover:text-white transition"
                  >
                    기본 이미지로 변경
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1F334D]/60">
              <span className="text-slate-400">그룹</span>
              <span className="font-bold text-white">마카오</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1F334D]/60">
              <span className="text-slate-400">멤버십 등급</span>
              <span className="font-bold text-[#E2C28E]">{tierDisplayName} VIP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1F334D]/60">
              <span className="text-slate-400">추천인 코드</span>
              <span className="font-mono font-bold text-[#C5A059]">{rewardUserCode()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUB-MENU: RESERVATION HISTORY (FreePlay 스위트 / 게이밍룸 / 다이닝 3종)
  if (currentSubScreen === 'my-reservations') {
    return (
      <div className="flex flex-col gap-4 pb-44 pt-2">
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C5A059]">calendar_month</span>
            오퍼 신청 내역 ({reservations?.length || 0}건)
          </h2>
          <button
            onClick={() => setCurrentSubScreen('comp-benefits')}
            className="text-[11px] font-bold text-[#E2C28E] hover:underline flex items-center gap-0.5"
          >
            <span>+ 추가 혜택 신청</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        <div className="space-y-3">
          {(reservations || []).map((res) => {
            const bType = res.benefitType || 'freeplay_suite';
            return (
              <div key={res.id} className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {bType === 'freeplay_suite' && (
                        <span className="text-[10px] font-extrabold text-[#0D1B2A] bg-[#C5A059] px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-xs">king_bed</span>
                          오퍼 스위트
                        </span>
                      )}
                      {bType === 'gaming_room' && (
                        <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">casino</span>
                          멤버십 게이밍룸
                        </span>
                      )}
                      {bType === 'dining' && (
                        <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">restaurant</span>
                          멤버십 다이닝
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        res.status === '승인완료' || res.status === '확정'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : res.status === '심사중'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse'
                          : 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                      }`}>
                        상태: {res.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5">{res.hotelName}</h3>
                    <p className="text-xs text-slate-300">{res.roomType}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{res.id}</span>
                </div>

                <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] text-xs space-y-1.5">
                  {bType === 'freeplay_suite' && (
                    <>
                      <div className="flex justify-between text-slate-300">
                        <span>체크인 - 체크아웃:</span>
                        <span className="font-mono font-bold text-white">{res.checkIn} ~ {res.checkOut}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>투숙 정보:</span>
                        <span>{res.nights || 2}박 / {res.guests}인</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-[#1F334D]">
                        <span>디포짓 코인:</span>
                        <span className="font-mono font-extrabold text-[#E2C28E]">
                          {(res.totalCoins ?? res.totalDp ?? 0).toLocaleString()} 코인
                        </span>
                      </div>
                    </>
                  )}
                  {bType === 'gaming_room' && (
                    <>
                      <div className="flex justify-between text-slate-300">
                        <span>이용 일자:</span>
                        <span className="font-mono font-bold text-white">{res.checkIn}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>이용 인원:</span>
                        <span>성인 {res.guests}인</span>
                      </div>
                      {res.optionsList && res.optionsList.length > 0 && (
                        <div className="flex justify-between text-slate-300">
                          <span>선택 옵션:</span>
                          <span className="text-slate-200 text-right truncate max-w-[200px]">{res.optionsList.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-[#1F334D]">
                        <span>비용 혜택:</span>
                        <span className="font-bold text-purple-300">VIP 살롱 전액 무상 의전</span>
                      </div>
                    </>
                  )}
                  {bType === 'dining' && (
                    <>
                      <div className="flex justify-between text-slate-300">
                        <span>이용 일자:</span>
                        <span className="font-mono font-bold text-white">{res.checkIn}</span>
                      </div>
                      {res.timeSlot && (
                        <div className="flex justify-between text-slate-300">
                          <span>이용 시간대:</span>
                          <span className="font-bold text-[#E2C28E]">{res.timeSlot}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-300">
                        <span>예약 인원:</span>
                        <span>성인 {res.guests}인</span>
                      </div>
                      {res.optionsList && res.optionsList.length > 0 && (
                        <div className="flex justify-between text-slate-300">
                          <span>선택 옵션:</span>
                          <span className="text-slate-200 text-right truncate max-w-[200px]">{res.optionsList.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-[#1F334D]">
                        <span>바우처 지원:</span>
                        <span className="font-bold text-amber-300">VIP 다이닝 바우처 전액 지원</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SUB-MENU 3: COIN WALLET
  if (currentSubScreen === 'my-wallet') {
    return (
      <div className="flex flex-col gap-4 pb-44 pt-2">
        <button 
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059]">account_balance_wallet</span>
          더블링 포인트 (Doubling Point)
        </h2>

        <div className="bg-gradient-to-br from-[#162639] via-[#1f334d] to-[#0D1B2A] border border-[#C5A059] rounded-2xl p-5 shadow-xl flex flex-col gap-3">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">사용 가능 포인트</span>
          <p className="text-2xl font-extrabold text-[#FFF0D0] gold-gradient-text font-mono">
            {(memberInfo.u_dp || 0).toLocaleString()} <span className="text-sm text-slate-300">DP</span>
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button 
              onClick={() => showToast('현재 포인트를 사용할 수 없습니다.')}
              className="py-2.5 rounded-xl gold-button-gradient text-[#0D1B2A] font-extrabold text-xs shadow"
            >
              포인트 사용
            </button>
            <button 
              onClick={() => showToast('현재 포인트를 사용할 수 없습니다.')}
              className="py-2.5 rounded-xl bg-[#0D1B2A] border border-[#C5A059]/40 text-[#E2C28E] font-bold text-xs hover:border-[#C5A059]"
            >
              포인트 사용처
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">포인트 지급 및 차감 내역</h3>
          <div className="space-y-2">
            {(Array.isArray(myProfile?.memberReward)
              ? myProfile.memberReward
              : Object.values(myProfile?.memberReward || {})
            ).map((reward: any, idx: number) => {
              const title = reward?.dp_message;
              const date = formatDateTime(Number(reward?.pm_reg_timestamp) - (60*60*9));
              const txHash = reward?.txHash ?? reward?.tx_hash ?? reward?.reward_index ?? '';
              const isPositive = reward?.pm_status === 1;
              const amount = Math.abs(Number(reward?.dp_amount) || 0);
              const key = reward?.id ?? reward?.reward_index ?? idx;

              return (
                <div key={key} className="bg-[#162639] border border-[#1F334D] p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{title}</p>
                    <p className="text-[10px] text-slate-400">{date}{txHash ? ` • ${txHash}` : ''}</p>
                  </div>
                  <span className={`font-mono font-extrabold ${
                    isPositive ? 'text-emerald-400' : 'text-[#E2C28E]'
                  }`}>
                    {isPositive ? '+' : '-'}{amount.toLocaleString()} DT
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // SUB-MENU 4: POLY MARKET HISTORY
  if (currentSubScreen === 'my-poly-history') {
    return (
      <div className="flex flex-col gap-4 pb-44 pt-2">
        <button 
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059]">history</span>
          예측 챌린지 참여 내역 ({polyVotes?.length || 0}건)
        </h2>

        <div className="space-y-3">
          {(polyVotes || []).map((v) => (
            <div key={v.id} className="bg-[#162639] border border-[#1F334D] p-4 rounded-2xl flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#C5A059] font-bold bg-[#C5A059]/15 px-2 py-0.5 rounded">
                  {v.category}
                </span>
                <span className="text-slate-400 font-mono">{v.date}</span>
              </div>
              <h3 className="font-bold text-white">{v.title}</h3>
              <div className="flex items-center justify-between bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D] mt-1">
                <span className={`font-bold ${v.choice === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  투표 선택: {v.choice} ({v.currentOdds})
                </span>
                <span className="font-mono font-extrabold text-[#E2C28E]">
                  {v.amountDp.toLocaleString()} DP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SUB-MENU 6: REFERRAL
  if (currentSubScreen === 'my-referral') {
    return (
      <div className="flex flex-col gap-4 pb-44 pt-2">
        <button 
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059]">group_add</span>
          추천인 리워드 관리
        </h2>

        <div className="bg-[#162639] border border-[#1F334D] p-5 rounded-2xl flex flex-col gap-3 shadow-md">
          <span className="text-xs text-slate-400">나의 고유 추천인 코드</span>
          <div className="flex items-center justify-between bg-[#0D1B2A] p-3 rounded-xl border border-[#C5A059]/40 font-mono font-bold text-sm text-[#E2C28E]">
            <span>{rewardUserCode()}</span>
            <button 
              onClick={handleCopyReferral}
              className="text-xs bg-[#C5A059] text-[#0D1B2A] px-2.5 py-1 rounded font-sans font-bold hover:brightness-110"
            >
              복사
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2">
            <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D]">
              <span className="text-slate-400 block">초대한 파트너</span>
              <span className="text-base font-bold text-white font-mono">14명</span>
            </div>
            <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D]">
              <span className="text-slate-400 block">추천인 누적 리워드</span>
              <span className="text-base font-bold text-[#E2C28E] font-mono">2,000 DT</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUB-MENU: SETTINGS (배포 기준 — 알림/마케팅 토글 + 월간 예약 자기제한 + 데모 상태 초기화)
  if (currentSubScreen === 'my-settings') {
    const uinfoMy = getSafeUserInfo();
    const uidx = uinfoMy['uidx'];

    // u_notification (0: 꺼짐, 0 이외: 켜짐)
    const isNotificationOn = myProfile?.memberInfo?.u_notification !== 0;

    // u_select_1 (0: 꺼짐, 0 이외: 켜짐)
    const isMarketingOn = myProfile?.memberInfo?.u_select_1 !== 0;

    // 설정 변경 API 호출 함수 (/members/usetting)
    const handleToggleSetting = async (key: 'u_notification' | 'u_select_1', currentValue: boolean) => {
      // 변경할 값: 기존이 켜짐(true)이면 0(꺼짐), 꺼짐(false)이면 1(켜짐)
      const newValue = currentValue ? 0 : 1;

      try {
        const response = await apiCommonClient.post<UsettingResponse, UsettingParam>(
          '/members/usetting',
          { [key]: newValue, uidx }
        );

        console.log('/members/usetting 응답:', response);

        if (response && (response.result === ResultCode.SUCCESS || response.result === 0)) {
          // 백엔드 성공 시 AppContext의 myProfile 데이터 실시간 업데이트
          const updatedMemberInfo = {
            ...(myProfile?.memberInfo || {}),
            [key]: newValue
          };

          setMyProfile(
            updatedMemberInfo,
            myProfile?.memberShip,
            myProfile?.memPickList,
            myProfile?.memberReward
          );

          showToast('설정이 변경되었습니다.');
        } else {
          showToast(response?.message || '설정 변경에 실패했습니다.');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          console.error(`설정 변경 API 오류 (${error.status}):`, error.message);
        } else {
          console.error('설정 변경 처리 중 오류:', error);
        }
        showToast('설정 변경 중 오류가 발생했습니다.');
      }
    };

    return (
      <div className="flex flex-col gap-4 pb-44 pt-2">
        <button
          onClick={() => setCurrentSubScreen(null)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>마이페이지로 돌아가기</span>
        </button>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059]">settings</span>
          설정 (Settings)
        </h2>

        <div className="bg-[#162639] border border-[#1F334D] p-4 rounded-2xl flex flex-col gap-4 shadow-md text-xs">
          {/* Toggle 1: 푸시 알림 수신 (u_notification) */}
          <div className="flex items-center justify-between py-2 border-b border-[#1F334D]">
            <div>
              <p className="font-bold text-white">푸시 알림 수신</p>
              <p className="text-[10px] text-slate-400">예약 확정 및 예측 챌린지 오즈 변동 알림</p>
            </div>
            <button
              onClick={() => handleToggleSetting('u_notification', isNotificationOn)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                isNotificationOn ? 'bg-[#C5A059]' : 'bg-[#0D1B2A]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isNotificationOn ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Toggle 2: 마케팅 수신 동의 (u_select_1) */}
          <div className="flex items-center justify-between py-2 border-b border-[#1F334D]">
            <div>
              <p className="font-bold text-white">마케팅 수신 동의</p>
              <p className="text-[10px] text-slate-400">VIP 전용 리조트 프로모션 수신</p>
            </div>
            <button
              onClick={() => handleToggleSetting('u_select_1', isMarketingOn)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                isMarketingOn ? 'bg-[#C5A059]' : 'bg-[#0D1B2A]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isMarketingOn ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Monthly Booking Self Limit Stepper 
          <div className="flex items-center justify-between py-2 border-b border-[#1F334D]">
            <div>
              <p className="font-bold text-white">월간 예약 자기 제한 수</p>
              <p className="text-[10px] text-slate-400">과도한 포인트 소진 방지 보호 설정</p>
            </div>
            <div className="flex items-center gap-2 bg-[#0D1B2A] px-2 py-1 rounded-lg border border-[#1F334D]">
              <button
                onClick={() => updateSettings({ monthlyBookingLimit: Math.max(1, settings.monthlyBookingLimit - 1) })}
                className="w-5 h-5 rounded bg-[#162639] text-[#C5A059] font-bold text-xs"
              >
                -
              </button>
              <span className="font-mono font-bold text-white">{settings.monthlyBookingLimit}회</span>
              <button
                onClick={() => updateSettings({ monthlyBookingLimit: settings.monthlyBookingLimit + 1 })}
                className="w-5 h-5 rounded bg-[#162639] text-[#C5A059] font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
            */}
          {/* Demo State Reset: Active Trip / Check-in State 
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#D4AF37] text-sm">restart_alt</span>
                  <span>데모 상태 초기화</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  현재 투숙(체크인) 상태를 초기화(미투숙/체크아웃)합니다.
                </p>
              </div>
              <button
                onClick={() => {
                  setHasActiveTrip(false);
                  showToast('투숙 상태가 초기화되었습니다 (체크아웃 상태로 전환)');
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95"
              >
                <span className="material-symbols-outlined text-xs">refresh</span>
                <span>데모 상태 초기화</span>
              </button>
            </div>
            <div className="mt-2.5 text-[10px] text-slate-400 bg-[#0D1B2A] p-2.5 rounded-xl border border-[#1F334D] flex items-center justify-between">
              <span>현재 투숙 상태: <strong className={hasActiveTrip ? 'text-emerald-400 font-mono font-bold' : 'text-slate-400 font-mono font-bold'}>{hasActiveTrip ? '투숙 중 (In-House · 체크인됨)' : '미투숙 (체크인 전)'}</strong></span>
              {hasActiveTrip ? (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              ) : (
                <span className="text-[9px] text-slate-500">대기</span>
              )}
            </div>
          </div>
            */}
        </div>
      </div>
    );
  }

  // 메인 마이페이지 화면
  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* User Header Summary Card — 데모 페르소나(Kevin, 50대 VC 임원) 고정 표시.
          mock 표시용 값이며 실제 회원 데이터가 아닙니다. */}
      <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-5 flex items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt="Kevin" className="w-14 h-14 rounded-full object-cover border-2 border-[#C5A059] shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#0D1B2A] border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Kevin 님</h2>
              {/* ETERNITY 등급 뱃지 — 클릭 시 멤버십 등급 관리로 이동 */}
              <button
                onClick={() => setCurrentSubScreen('my-membership')}
                title="더블링 멤버십 등급 관리"
                className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#C5A059]/30 to-[#E2C28E]/20 border border-[#C5A059]/60 text-white font-black hover:brightness-125 transition shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-xs text-[#E2C28E]">workspace_premium</span>
                <span>{tierDisplayName}</span>
              </button>
            </div>
            <p className="text-xs text-[#E2C28E] font-medium">DOUBLING VIP</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">CODE: KEVIN-VIP-2026</p>
          </div>
        </div>

        {/* Tier Score — 우측 정렬, 클릭 시 멤버십 등급 관리로 이동 */}
        <button
          onClick={() => setCurrentSubScreen('my-membership')}
          className="flex flex-col items-end text-right hover:opacity-80 transition shrink-0"
        >
          <span className="text-[10px] text-slate-400 font-medium">누적 Tier Score</span>
          <span className="text-sm font-black text-[#E2C28E] font-mono flex items-center gap-0.5">
            {(memberInfo?.u_exp || 0).toLocaleString()}<span className="text-[10px] text-slate-400">점</span>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
          </span>
        </button>
      </div>

      {/* Wallet Balance Cards — DP / 코인 분리. 둘 다 AppContext mock 잔액(실결제 미연동). */}
      <div className="grid grid-cols-1 gap-3">
        {/* 더블링포인트(DP) 카드 */}
        <div
          onClick={() => setCurrentSubScreen('my-wallet')}
          className="bg-gradient-to-br from-[#162639] to-[#0D1B2A] border border-[#C5A059]/60 hover:border-[#C5A059] p-4 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E] shrink-0">
                <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">더블링포인트 (DP)</span>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap inline-block mt-0.5">
                  예측 챌린지 전용 · 무료
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-[#E2C28E] transition text-sm shrink-0">open_in_new</span>
          </div>

          <div>
            <p className="text-xl font-black text-[#FFF0D0] font-mono leading-none text-right">
              {(memberInfo.u_dp || 0).toLocaleString()} <span className="text-xs text-[#E2C28E] font-sans font-bold">DP</span>
            </p>
          </div>

          <div className="pt-2 border-t border-[#1F334D] flex items-center justify-between text-[11px] text-[#E2C28E] font-bold">
            <span>상세 내역 보기</span>
            <span>→</span>
          </div>
        </div>

        {/* 코인 월렛 카드 
        <div
          onClick={() => showToast('코인 입출금은 다음 업데이트에서 제공됩니다')}
          className="bg-gradient-to-br from-[#162639] to-[#0D1B2A] border border-[#1F334D] hover:border-[#7FD4B8]/50 p-4 rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition shadow-md group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#7FD4B8]/15 border border-[#7FD4B8]/40 flex items-center justify-center text-[#7FD4B8] shrink-0">
                <span className="material-symbols-outlined text-xl">toll</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">코인 월렛</span>
                <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 whitespace-nowrap inline-block mt-0.5">
                  오퍼 실결제용
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition text-sm shrink-0">chevron_right</span>
          </div>

          <div>
            <p className="text-xl font-bold text-[#7FD4B8] font-mono leading-none text-right">
              {user.walletCoin.toLocaleString()} <span className="text-xs text-slate-400 font-sans">코인</span>
            </p>
          </div>

          <div className="pt-2 border-t border-[#1F334D] flex items-center justify-between text-[11px] text-slate-300 font-bold group-hover:text-[#7FD4B8]">
            <span>입출금 및 결제 관리</span>
            <span>→</span>
          </div>
        </div>
        */}
      </div>

      {/* 연속 출석 스트릭 (공용 컴포넌트) */}
      <StreakTracker />

      {/* SUB-MENU LIST */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider px-1">마이페이지 메뉴 (7)</h3>

        {/* 1. 파트너 프로필 정보 */}
        <div
          onClick={() => setCurrentSubScreen('my-profile')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-lg">badge</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">1. 파트너 프로필 정보</span>
              <span className="text-[10px] text-slate-400">회원 기본 정보 및 추천인 코드</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">chevron_right</span>
        </div>

        {/* 2. FreePlay 신청 내역 */}
        <div
          onClick={() => setCurrentSubScreen('my-reservations')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">2. 오퍼 신청 내역</span>
              <span className="text-[10px] text-slate-400">스위트룸 · 게이밍룸 · 다이닝 신청 관리</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              {reservations?.length || 0}건
            </span>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </div>
        </div>

        {/* 3. 코인 월렛 / 입출금 
        <div
          onClick={() => showToast('코인 입출금은 다음 업데이트에서 제공됩니다')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#7FD4B8]/50 transition cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#7FD4B8]/40 flex items-center justify-center text-[#7FD4B8] shrink-0">
              <span className="material-symbols-outlined text-lg">toll</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">3. 코인 월렛 / 입출금</span>
              <span className="text-[10px] text-slate-400">잔액: {user.walletCoin.toLocaleString()} 코인</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">chevron_right</span>
        </div>
          */}
        {/* 4. 예측 챌린지 참여 내역 */}
        <div
          onClick={() => setCurrentSubScreen('my-poly-history')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-lg">history</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">3. 예측 챌린지 참여 내역</span>
              <span className="text-[10px] text-[#E2C28E] font-medium">잔액: {user.walletDp.toLocaleString()} DP</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              {polyVotes?.length || 0}건
            </span>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </div>
        </div>

        {/* 5. 더블링 멤버십 등급 관리 */}
        <div
          onClick={() => setCurrentSubScreen('my-membership')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-lg">workspace_premium</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block group-hover:text-[#E2C28E] transition">4. 더블링 멤버십 등급 관리</span>
              <span className="text-[10px] text-slate-400">등급 혜택 및 승급 진행률</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[#E2C28E] bg-[#C5A059]/15 border border-[#C5A059]/30 px-2 py-0.5 rounded-full">
              {user.membershipTier}
            </span>
            <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </div>
        </div>

        {/* 6. 추천인 리워드 관리 */}
        <div
          onClick={() => setCurrentSubScreen('my-referral')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-lg">group_add</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">5. 추천인 리워드 관리</span>
              <span className="text-[10px] text-slate-400">초대 링크 공유 및 리워드 현황</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">chevron_right</span>
        </div>

        {/* 6. 앱 설정 & 제한 */}
        <div
          onClick={() => setCurrentSubScreen('my-settings')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
              <span className="material-symbols-outlined text-lg">settings</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">6. 앱 설정 & 제한</span>
              <span className="text-[10px] text-slate-400">알림 · 마케팅 수신 · 월간 예약 제한</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">chevron_right</span>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={() => {
          localStorage.setItem('sessionid', '');
          localStorage.setItem('user_info', '');
          setIsLoggedIn(false);
          setCurrentSubScreen('login');
        }}
        className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/20 transition mt-2"
      >
        로그아웃
      </button>
    </div>
  );
};
