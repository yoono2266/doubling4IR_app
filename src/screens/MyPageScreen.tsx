import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiCommonClient, ApiError, ResultCode } from '../utils/apiClient';

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
  memberPoly?: any;
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
    walletTransactions,
    polyVotes,
    settings,
    updateSettings,
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
        const memberPoly = resData.memberPoly || {};
        const memberReward = resData.memberReward || {};

        console.log('저장할 memberInfo:', memberInfo);

        // 💡 [핵심] AppContext의 setMyProfile로 4개 객체 전달하여 상태 저장
        setMyProfile(memberInfo, memberShip, memberPoly, memberReward);
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
  // 💡 myProfile에서 실시간으로 저장된 사용자 정보 꺼내기
  const memberInfo = myProfile?.memberInfo || {};
  const userName = memberInfo?.u_name || user?.name || '회원';
  
  // 프로필 이미지 주소 판별 (상대경로 대응)
  let profileImg = memberInfo?.u_profile || user?.avatar || '';
  if (profileImg && !profileImg.startsWith('http')) {
    profileImg = `https://dou-cdn.wildwynn.com/static/upload/member/${profileImg}`;
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
          회원 프로필 정보
        </h2>

        <div className="bg-[#162639] border border-[#1F334D] rounded-2xl p-5 flex flex-col gap-4 shadow-md">
          <div className="flex items-center gap-4 border-b border-[#1F334D] pb-4">
            {profileImg ? (
              <img src={profileImg} alt={userName} className="w-16 h-16 rounded-full object-cover border-2 border-[#C5A059]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#0D1B2A] border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059]">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">{userName} 님</h3>
              <p className="text-xs text-[#E2C28E] font-medium">{myProfile?.memberShip.tb_reward || 'SILVER'} VIP Member</p>
              <p className="text-xs text-slate-400">{myProfile?.memberInfo?.company || '-'}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1F334D]/60">
              <span className="text-slate-400">그룹</span>
              <span className="font-bold text-white">마카오</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1F334D]/60">
              <span className="text-slate-400">멤버십 등급</span>
              <span className="font-bold text-[#E2C28E]">{myProfile?.memberShip.tb_reward || 'White'} VIP</span>
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

  // SUB-MENU 2: RESERVATION HISTORY
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

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#C5A059]">calendar_month</span>
          FreeRoom 예약 내역 ({reservations?.length || 0}건)
        </h2>

        <div className="space-y-3">
          {(reservations || []).map((res) => (
            <div key={res.id} className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    상태: {res.status}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">{res.hotelName}</h3>
                  <p className="text-xs text-slate-300">{res.roomType}</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{res.id}</span>
              </div>

              <div className="bg-[#0D1B2A] p-3 rounded-xl border border-[#1F334D] text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>체크인 - 체크아웃:</span>
                  <span className="font-mono font-bold text-white">{res.checkIn} ~ {res.checkOut}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>투숙 정보:</span>
                  <span>{res.nights}박 / {res.guests}인</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-[#1F334D]">
                  <span>결제 코인:</span>
                  <span className="font-mono font-extrabold text-[#E2C28E]">{res.totalDp?.toLocaleString() || 0} DP</span>
                </div>
              </div>
            </div>
          ))}
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
            {myProfile?.memberInfo?.u_dp?.toLocaleString() ?? '0'} <span className="text-sm text-slate-300">DP</span>
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
            {(walletTransactions || []).map((tx) => (
              <div key={tx.id} className="bg-[#162639] border border-[#1F334D] p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{tx.title}</p>
                  <p className="text-[10px] text-slate-400">{tx.date} • {tx.txHash}</p>
                </div>
                <span className={`font-mono font-extrabold ${
                  tx.amount > 0 ? 'text-emerald-400' : 'text-[#E2C28E]'
                }`}>
                  {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount?.toLocaleString()} DT
                </span>
              </div>
            ))}
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
          폴리마켓 투표 참여 내역 ({polyVotes?.length || 0}건)
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
                  {v.amountDp} DP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SUB-MENU 5: MEMBERSHIP
  if (currentSubScreen === 'my-membership') {
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
          <span className="material-symbols-outlined text-[#C5A059]">workspace_premium</span>
          멤버십 등급 관리
        </h2>

        <div className="bg-[#162639] border border-[#C5A059] p-5 rounded-2xl flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#E2C28E] font-bold uppercase tracking-wider">현재 멤버십 등급</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C5A059] text-[#0D1B2A] font-extrabold">
              {myProfile?.memberShip.tb_reward || 'White'}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-white">{myProfile?.memberShip.tb_reward || 'White'} VIP Member</h3>
          <p className="text-xs text-slate-300">{myProfile?.memberShip.tb_reward_value1}</p>
          
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{myProfile?.memberShip.next_membership.tb_reward || '가족'} 승급까지 잔여 포인트</span>
              <span className="font-mono text-[#E2C28E] font-bold">{myProfile?.memberInfo.u_exp?.toLocaleString() || 0} / {myProfile?.memberShip.next_membership.tb_max_exp?.toLocaleString() || 0} EXP</span>
            </div>
            <div className="w-full bg-[#0D1B2A] h-2.5 rounded-full overflow-hidden border border-[#1F334D]">
              <div className="bg-gradient-to-r from-[#C5A059] to-[#E2C28E] h-full" style={{ width: `${(myProfile?.memberInfo.u_exp / myProfile?.memberShip.next_membership.tb_max_exp) * 100}%` }}></div>
            </div>
          </div>
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

  // SUB-MENU 7: SETTINGS
  if (currentSubScreen === 'my-settings') {
    const uinfoMy = getSafeUserInfo();
    const uidx = uinfoMy['uidx'];

    // 💡 1. u_notification (0: 꺼짐, 0 이외: 켜짐)
    const isNotificationOn = myProfile?.memberInfo?.u_notification !== 0;

    // 💡 2. u_select_1 (0: 꺼짐, 0 이외: 켜짐)
    const isMarketingOn = myProfile?.memberInfo?.u_select_1 !== 0;

    // 💡 3. 설정 변경 API 호출 함수
    const handleToggleSetting = async (key: 'u_notification' | 'u_select_1', currentValue: boolean) => {
      // 변경할 값: 기존이 켜짐(true)이면 0(꺼짐), 꺼짐(false)이면 1(켜짐)
      const newValue = currentValue ? 0 : 1;

      try {
        const response = await apiCommonClient.post<UsettingResponse, UsettingParam>(
          '/members/usetting',
          { [key]: newValue, uidx: uidx }
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
            myProfile?.memberPoly,
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
          <span>마이페이지로 돌아가지</span>
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
              <p className="text-[10px] text-slate-400">예약 확정 및 폴리마켓 오즈 변동 알림</p>
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
        </div>
      </div>
    );
  }

  // 메인 마이페이지 화면
  return (
    <div className="flex flex-col gap-4 pb-44 pt-2">
      {/* User Header Summary Card */}
      <div className="bg-[#162639] border border-[#C5A059]/40 rounded-2xl p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          {profileImg ? (
            <img src={profileImg} alt={userName} className="w-14 h-14 rounded-full object-cover border-2 border-[#C5A059]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#0D1B2A] border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059]">
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{userName} 님</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#C5A059] text-[#0D1B2A] font-extrabold">
                {myProfile?.memberShip.tb_reward || 'White'}
              </span>
            </div>
            <p className="text-xs text-[#E2C28E] font-medium">KOREA</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">CODE: {rewardUserCode()}</p>
          </div>
        </div>
      </div>

      {/* Wallet Balance Display Box */}
      <div 
        onClick={() => setCurrentSubScreen('my-wallet')}
        className="bg-gradient-to-r from-[#162639] to-[#0D1B2A] border border-[#C5A059]/40 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#C5A059] transition shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#E2C28E]">
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">더블링 포인트</span>
            <p className="text-base font-extrabold text-[#E2C28E] font-mono">
              {myProfile?.memberInfo?.u_dp?.toLocaleString() ?? '0'} <span className="text-xs text-slate-400">DP</span>
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
      </div>

      {/* SUB-MENU LIST */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider px-1">마이페이지 메뉴</h3>

        {/* 1. Profile */}
        <div 
          onClick={() => setCurrentSubScreen('my-profile')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#C5A059]">badge</span>
            <span className="text-xs font-bold text-white">1. 회원 프로필 정보</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
        </div>

        {/* 2. Membership */}
        <div 
          onClick={() => setCurrentSubScreen('my-membership')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#C5A059]">workspace_premium</span>
            <span className="text-xs font-bold text-white">2. 멤버십 등급 관리</span>
          </div>
          <span className="text-xs font-bold text-[#E2C28E]">{myProfile?.memberShip.tb_reward || 'SILVER'}</span>
        </div>

        {/* 3. Poly Market History */}
        <div 
          onClick={() => setCurrentSubScreen('my-poly-history')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#C5A059]">history</span>
            <span className="text-xs font-bold text-white">3. 폴리마켓 참여 내역</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
        </div>

        {/* 4. Referral */}
        <div 
          onClick={() => setCurrentSubScreen('my-referral')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#C5A059]">group_add</span>
            <span className="text-xs font-bold text-white">4. 추천인 리워드 관리</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
        </div>

        {/* 5. Settings */}
        <div 
          onClick={() => setCurrentSubScreen('my-settings')}
          className="p-3.5 rounded-2xl bg-[#162639] border border-[#1F334D] hover:border-[#C5A059]/50 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#C5A059]">settings</span>
            <span className="text-xs font-bold text-white">5. 앱 설정 & 제한</span>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
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