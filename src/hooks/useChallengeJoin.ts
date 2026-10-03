import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PolyMarketItem } from '../data/polyMarketData';
import { apiCommonClient } from '../utils/apiClient';
import { isChallengeDummy } from '../data/challengeDummyData';

// 2026-10-03: 챌린지 참여 흐름 공용 훅 (목록·상세·홈 캐러셀).
// YES/NO 선택 → 확인 창 → 서버 참여 기록 → 앱 내 참여 기록·보상 안내. 한 번 참여하면 선택 변경 불가.
// ⚠️ 서버 연동 (BE 요청서 REQ-261003-02):
//   - 기존 /members/plm-memberpick을 dp_amount: 0으로 호출 (DP를 걸지 않는 방식). 서버가 0을 거부하면 참여 실패 안내
//   - +50DP는 화면 안내(mock): castPolyVote(AppContext, BE 로직)가 앱 내 mock 잔액에 반영하고 안내 토스트를 띄움.
//     실제 DP 지급은 BE가 참여 시 지급(BO 설정 금액) 기능을 넣어야 반영됨 → 성공 후 회원 정보 재조회로 서버 잔액 갱신 시도

interface PendingJoin {
  market: PolyMarketItem;
  choice: 'YES' | 'NO';
}

export const useChallengeJoin = () => {
  const { castPolyVote, getUserVoteForMarket, requireLogin, showToast, refreshMemberProfile } = useApp();
  const [pendingJoin, setPendingJoin] = useState<PendingJoin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestJoin = (market: PolyMarketItem, choice: 'YES' | 'NO', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!requireLogin()) return;
    if (getUserVoteForMarket(market.id)) {
      showToast('이미 참여한 챌린지예요. 선택은 바꿀 수 없어요.');
      return;
    }
    setPendingJoin({ market, choice });
  };

  const cancelJoin = () => {
    if (!isSubmitting) setPendingJoin(null);
  };

  const confirmJoin = async () => {
    if (!pendingJoin || isSubmitting) return;
    const { market, choice } = pendingJoin;
    const odds = choice === 'YES' ? market.yesOdds : market.noOdds;
    setIsSubmitting(true);

    // 2026-10-03: 테스트 더미 챌린지(localhost 전용)는 서버에 없으므로 서버 호출 없이 앱 안에서만 참여 처리
    if (isChallengeDummy(market.id)) {
      castPolyVote(market.id, market.title, market.category, choice, odds, 0);
      setIsSubmitting(false);
      setPendingJoin(null);
      return;
    }

    try {
      const response: any = await apiCommonClient.post(
        '/members/plm-memberpick',
        {
          pm_index: Number(market.id.replace(/^plm-/, '')) || 0,
          user_pick: choice === 'YES' ? 1 : 2,
          user_pick_value: parseFloat(odds.replace(/[^0-9.]/g, '')) || 0,
          dp_amount: 0,
        },
        { suppressErrorToast: true }
      );
      const result = response?.result ?? response?.data?.result ?? -1;
      if (result !== 0) {
        console.warn('[plm-memberpick] 챌린지 참여 실패:', response);
        showToast('챌린지 참여에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }

      castPolyVote(market.id, market.title, market.category, choice, odds, 0);
      void refreshMemberProfile();
    } catch (error) {
      console.error('[plm-memberpick] 요청 실패:', error);
      showToast('챌린지 참여에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
      setPendingJoin(null);
    }
  };

  return { pendingJoin, isSubmitting, requestJoin, cancelJoin, confirmJoin };
};
