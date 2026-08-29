// ==========================================
// 1. 서버 Result Code 열거형 (Enum)
// ==========================================
export enum ResultCode {
  SUCCESS = 0,               // 요청 성공
  FAILURE = 1,               // 일반적인 실패
  SESSION_NOT_EXISTS = 2,    // 세션 만료 / 누락
  SESSION_FAILURE = 3,       // Hash 불일치
  PARAM_NOT_FOUND = 4,       // 파라미터 누락

  USER_NOT_FOUND = 10,       // 유저 미존재
  INVALID_ID = 11,           // 유효하지 않은 아이디
  INVALID_PASSWORD = 12,     // 유효하지 않은 패스워드
  DUPLICATED_ID = 13,        // 중복된 아이디
  ALREADY_LOGIN = 14,        // 이미 로그인 중
  ALREADY_USER = 15,         // 이미 회원가입 완료
  AVAILABLE_AFTER_LOGIN = 16,// 로그인 후 이용 가능

  DUPLICATED_NICKNAME = 17,  // 중복된 닉네임
  INVALID_NAME = 18,         // 유효하지 않은 이름
  INVALID_STRING = 19,       // 유효하지 않은 문자
  INVALID_TEXT = 20,         // 유효하지 않은 텍스트
  ALREADY_LIKED = 21,        // 이미 좋아요 처리됨
  ALREADY_FOLLOWED = 22,     // 이미 팔로우 처리됨

  SUPPORT_PENDING = 901,     // 고객지원 처리중

  INTERNAL_SERVER_ERROR = 20200103, // 시스템 에러
}

// ==========================================
// 2. 서버 공통 응답 타입 규격 (result 속성 반영)
// ==========================================
export interface CommonResponse<T = any> {
  result: ResultCode | number; // 서버가 리턴하는 result 숫자값
  message?: string;
  sessionid?: string;
  data?: T;
}

// ==========================================
// 1. 에러 클래스 및 기본 인터페이스
// ==========================================
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// src/utils/apiClient.ts 상단

// 1. 현재 실행 환경이 브라우저 로컬 개발 환경(localhost:3000)인지 확인
const isLocalWeb = 
  typeof window !== 'undefined' && 
  window.location.hostname === 'localhost' && 
  window.location.port === '3000';

// 2. BASE_URL 자동 분기:
// - 웹 로컬 개발일 때: Vite Proxy를 타도록 '/api/v1' 사용 (CORS 우회)
// - 안드로이드/iOS 앱 및 프로덕션일 때: 실제 전체 도메인 'https://dou-api.wildwynn.com/api/v1' 사용
const BASE_URL = isLocalWeb 
  ? '/api/v1' 
  : 'https://dou-api.wildwynn.com/api/v1';

console.log('현재 적용된 API BASE_URL:', BASE_URL);

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  token?: string;
  platform?: Partial<PlatformUserObj>;
  body?: any;
}


// ==========================================
// 2. 서버 Pydantic Schema 대응 TypeScript 타입
// ==========================================
export interface SessionObj {
  sessionid?: string;
}

export interface PlatformUserObj {
  _platform?: any;
  _platform_uid?: string;
  _platform_gid?: any;
  _platform_bid?: string;
  _platform_ver?: string;
  _connect_time?: number;
  _memid?: number;
}

export interface InnerParam<T> {
  param: T;
}

export interface CommonClientRequest<T> {
  a?: SessionObj;
  b?: PlatformUserObj;
  c: InnerParam<T>;
}


// ==========================================
// 3. 헬퍼 함수 (쿼리 파라미터 & 공통 a, b 페이로드 생성)
// ==========================================
const buildQueryString = (params?: RequestOptions['params']): string => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// 공통 세션(a) 및 플랫폼(b) 객체 생성
export const createCommonPayload = <T>(paramPayload: T, platformOverrides: Partial<PlatformUserObj> = {}): CommonClientRequest<T> => {
  //console.log('createCommonPayload sessionid', localStorage.getItem('sessionid'))
  return {
    a: {
      sessionid: localStorage.getItem('sessionid') || '',
    },
    b: {
      _platform: 1, // 1: Android, 2: iOS 등
      _platform_uid: localStorage.getItem('_platform_uid') || '',
      _platform_gid: 0,
      _platform_bid: 'A001KR',
      _platform_ver: '0.1',
      _connect_time: Math.floor(Date.now() / 1000), // 현재 Unix Timestamp(초)
      _memid: Number(localStorage.getItem('_memid') || 1),
      ...platformOverrides,
    },
    c: {
      param: paramPayload,
    },
  };
};


// ==========================================
// 4. Core Request 통신 함수
// ==========================================
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, token, headers, body, platform: _platform, ...customConfig } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(headers as Record<string, string>),
  };

  const authToken = token || localStorage.getItem('authToken');
  if (authToken) {
    reqHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${BASE_URL}${endpoint}${buildQueryString(params)}`;

  const config: RequestInit = {
    method: 'GET',
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.message || `요청 처리 실패 (상태 코드: ${response.status})`;
      throw new ApiError(response.status, errorMessage, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : '네트워크 통신 오류가 발생했습니다.', error);
  }
}
// ==========================================
// 5. 내보낼 HTTP 모듈 (apiClient & apiCommonClient)
// ==========================================

// 일반 Rest API용 클라이언트
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T, D = any>(endpoint: string, data?: D, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: data }),

  put: <T, D = any>(endpoint: string, data?: D, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: data }),

  patch: <T, D = any>(endpoint: string, data?: D, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: data }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// 서버 공용 템플릿(a, b, c 규격) 전용 클라이언트
export const apiCommonClient = {
  /**
   * 공용 규격(a, b, c) 포맷으로 전송하는 POST 요청
   * @template Res 응답 데이터 타입
   * @template Req c.param에 들어갈 요청 파라미터 타입
   */
  post: <Res, Req = any>(endpoint: string, paramPayload: Req, options?: RequestOptions) => {
    const wrappedBody = createCommonPayload<Req>(paramPayload, options?.platform);
    return apiClient.post<Res>(endpoint, wrappedBody, options);
  },

  /**
   * 공용 규격(a, b, c) 메타 정보와 파라미터를 URL 쿼리 스트링으로 변환하여 전송하는 GET 요청
   * @template Res 응답 데이터 타입
   * @template Req c.param에 들어갈 요청 파라미터 타입
   */
  get: <Res, Req = any>(endpoint: string, paramPayload?: Req, options?: RequestOptions) => {
    const commonPayload = createCommonPayload<Req | undefined>(paramPayload, options?.platform);

    // 공통 세션(a) 및 플랫폼 정보(b)를 쿼리 파라미터에 자동 병합
    const queryParams: Record<string, string | number | boolean | undefined | null> = {
      sessionid: commonPayload.a?.sessionid,
      _platform: commonPayload.b?._platform,
      _platform_uid: commonPayload.b?._platform_uid,
      _platform_bid: commonPayload.b?._platform_bid,
      _platform_ver: commonPayload.b?._platform_ver,
      _connect_time: commonPayload.b?._connect_time,
      _memid: commonPayload.b?._memid,
      ...options?.params,
    };

    // c.param(paramPayload) 데이터를 URL 쿼리 스트링 키-값으로 변환
    if (paramPayload && typeof paramPayload === 'object') {
      Object.entries(paramPayload as Record<string, any>).forEach(([key, value]) => {
        queryParams[key] = typeof value === 'object' ? JSON.stringify(value) : value;
      });
    }

    return apiClient.get<Res>(endpoint, {
      ...options,
      params: queryParams,
    });
  },
};