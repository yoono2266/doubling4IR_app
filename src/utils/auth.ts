import { apiCommonClient, ResultCode } from './apiClient';

export interface UcheckResponse {
  result: ResultCode | number;
  message?: string;
  data?: {
    memberInfo?: any;
    memberShip?: any;
    memberPoly?: any;
    memberReward?: any;
  };
  memberInfo?: any;
  memberShip?: any;
  memberPoly?: any;
  memberReward?: any;
}

export interface LoginCheckResult {
  memberInfo: any;
  memberShip: any;
  memberPoly: any;
  memberReward: any;
}

// 세션 존재 여부만 동기적으로 판단 (서버 호출 없이 즉시 확인, 최초 렌더링 분기용)
export const hasStoredSession = (): boolean => {
  try {
    return !!localStorage.getItem('sessionid');
  } catch {
    return false;
  }
};

export const getStoredUserInfo = (): Record<string, any> => {
  try {
    const raw = localStorage.getItem('user_info');
    return raw && raw.trim() !== '' ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('user_info 파싱 오류:', e);
    return {};
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem('sessionid');
    localStorage.removeItem('user_info');
  } catch {
    // ignore
  }
};

/**
 * 서버에 로그인 세션 유효성을 확인하고 DP 등 최신 회원 정보를 함께 받아온다.
 * 세션이 없거나 서버에서 만료로 판정하면 로컬 세션 정보를 정리하고 null을 반환한다.
 */
export const checkLogin = async (): Promise<LoginCheckResult | null> => {
  if (!hasStoredSession()) return null;

  try {
    const response = await apiCommonClient.post<UcheckResponse, {}>('/members/uchk', {});

    if (response.result === ResultCode.SUCCESS || response.result === 0) {
      // 서버 응답이 data로 감싸져 오는 경우와 최상위로 오는 경우를 모두 지원
      const resData = response.data || response;
      return {
        memberInfo: resData.memberInfo || {},
        memberShip: resData.memberShip || {},
        memberPoly: resData.memberPoly || {},
        memberReward: resData.memberReward || {},
      };
    }

    if (response.result === ResultCode.SESSION_NOT_EXISTS || response.result === ResultCode.SESSION_FAILURE) {
      clearSession();
    }
    return null;
  } catch (error) {
    console.error('로그인 상태 확인(uchk) 실패:', error);
    return null;
  }
};
