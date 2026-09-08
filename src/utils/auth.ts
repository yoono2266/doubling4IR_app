import { apiCommonClient, ResultCode } from './apiClient';

export interface UcheckResponse {
  result: ResultCode | number;
  message?: string;
  data?: {
    memberInfo?: any;
    memberShip?: any;
    memPickList?: any;
    memberReward?: any;
  };
  memberInfo?: any;
  memberShip?: any;
  memPickList?: any;
  memberReward?: any;
}

export interface LoginCheckResult {
  memberInfo: any;
  memberShip: any;
  memPickList: any;
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

const readLocalUserInfo = (): Record<string, any> => {
  try {
    const raw = localStorage.getItem('user_info');
    return raw && raw.trim() !== '' ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('user_info 파싱 오류:', e);
    return {};
  }
};

/**
 * source='local'(기본): localStorage에 저장된 user_info를 그대로 반환한다 (동기).
 * source='server': 앱 전역에서 상시 사용하는 로그인 체크(checkLogin, /members/uchk)로 서버에서
 *                   최신 회원 정보를 받아 localStorage(user_info)를 갱신한 뒤 반환한다 (비동기).
 */
export function getStoredUserInfo(source?: 'local'): Record<string, any>;
export function getStoredUserInfo(source: 'server'): Promise<Record<string, any>>;
export function getStoredUserInfo(source: 'local' | 'server' = 'local'): Record<string, any> | Promise<Record<string, any>> {
  if (source === 'server') {
    return (async () => {
      const result = await checkLogin({ force: true });
      if (!result) return readLocalUserInfo();

      const merged = { ...readLocalUserInfo(), ...result.memberInfo };
      try {
        localStorage.setItem('user_info', JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    })();
  }

  return readLocalUserInfo();
}

export const clearSession = () => {
  try {
    localStorage.removeItem('sessionid');
    localStorage.removeItem('user_info');
    // 로그인 시 syncUserInfoFromResponse가 채워 넣은 로그인 사용자 식별자도 함께 초기화한다.
    localStorage.removeItem('_platform_uid');
    localStorage.removeItem('_memid');
  } catch {
    // ignore
  }
};

/**
 * 서버에 로그인 세션 유효성을 확인하고 DP 등 최신 회원 정보를 함께 받아온다.
 * 세션이 없거나 서버에서 만료로 판정하면 로컬 세션 정보를 정리하고 null을 반환한다.
 * @param options.force true면 localStorage에 sessionid가 없어도(예: 로그인 안 된 것으로 보이는
 *   Landing 화면 진입 시) 서버에 실제로 로그인 여부를 물어본다.
 */
export const checkLogin = async (options?: { force?: boolean }): Promise<LoginCheckResult | null> => {
  if (!options?.force && !hasStoredSession()) return null;

  try {
    const response = await apiCommonClient.post<UcheckResponse, {}>('/members/uchk', {}, { suppressErrorToast: true });

    if (response.result === ResultCode.SUCCESS || response.result === 0) {
      // 서버 응답이 data로 감싸져 오는 경우와 최상위로 오는 경우를 모두 지원
      const resData = response.data || response;
      return {
        memberInfo: resData.memberInfo || {},
        memberShip: resData.memberShip || {},
        memPickList: resData.memPickList || {},
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
