/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // 추가로 사용할 환경변수가 있다면 아래에 선언합니다.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
  }) => GoogleTokenClient;
}

interface GoogleAccounts {
  oauth2?: GoogleAccountsOAuth2;
}

interface GoogleIdentity {
  accounts?: GoogleAccounts;
}

interface Window {
  google?: GoogleIdentity;
}