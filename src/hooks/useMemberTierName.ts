import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MEMBERSHIP_TIERS } from '../data/membershipData';

// 2026-10-03: 현재 로그인 계정의 멤버십 등급 정보 (마이페이지 닉네임 옆 MembershipBadge와 같은 값).
// MyPageScreen.tsx의 tierDisplayName 계산과 동일: 서버 memberShip 우선, 로컬 membershipData로 보완, 없으면 'White'.
// 마이페이지를 거치지 않고 들어오면 등급 정보가 비어 있을 수 있어, 없으면 전체 회원 정보(/members/{uidx})를 한 번 다시 불러온다.

// 등급 englishName → 순위 (MEMBERSHIP_TIERS 순서 = 낮은 등급 → 높은 등급). 모르는 값은 -1
export const getDrTierRank = (englishName: string): number =>
  MEMBERSHIP_TIERS.findIndex((tier) => tier.englishName === englishName);

export const useMemberTierInfo = (): { displayName: string; englishName: string | null; rank: number } => {
  const { myProfile, isLoggedIn, refreshMemberProfile } = useApp();
  const hasTier = !!(myProfile?.memberShip && typeof myProfile.memberShip === 'object' && Object.keys(myProfile.memberShip).length > 0);

  useEffect(() => {
    if (!isLoggedIn || hasTier) return;
    void refreshMemberProfile();
  }, [isLoggedIn, hasTier, refreshMemberProfile]);

  const apiTier = myProfile?.memberShip && typeof myProfile.memberShip === 'object' ? myProfile.memberShip : null;
  const localTier = apiTier ? MEMBERSHIP_TIERS.find((t) => t.id === String(apiTier.tb_index)) || null : null;
  const displayName = apiTier?.tb_title_ko || localTier?.koreanName || apiTier?.tb_title_en || localTier?.englishName || 'White';
  // 순위 계산용 등급: tb_index 매칭이 안 되면 서버 등급명(한글·영문)으로 다시 찾는다
  const rankTier =
    localTier ||
    (apiTier
      ? MEMBERSHIP_TIERS.find(
          (t) =>
            t.koreanName === apiTier.tb_title_ko ||
            t.englishName === String(apiTier.tb_title_en || '').trim().toUpperCase()
        ) || null
      : null);
  const englishName = isLoggedIn && rankTier ? rankTier.englishName : null;
  return { displayName, englishName, rank: englishName ? getDrTierRank(englishName) : -1 };
};

export const useMemberTierName = (): string => useMemberTierInfo().displayName;
