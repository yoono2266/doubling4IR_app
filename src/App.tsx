import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapacitorApp } from '@capacitor/app';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { ForceUpdateModal } from './components/ForceUpdateModal';
import { FreeRoomStickyBanner } from './components/FreeRoomStickyBanner';
import { HomeScreen } from './screens/HomeScreen';
import { JackpotMapScreen } from './screens/JackpotMapScreen';
import { HotelJackpotDetailScreen } from './screens/HotelJackpotDetailScreen';
import { JackpotHistoryScreen } from './screens/JackpotHistoryScreen';
import { PolyMarketScreen } from './screens/PolyMarketScreen';
import { PolyMarketDetailScreen } from './screens/PolyMarketDetailScreen';
import { PolyLeaderboardScreen } from './screens/PolyLeaderboardScreen';
import { FreeRoomScreen } from './screens/FreeRoomScreen';
import { MyPageScreen } from './screens/MyPageScreen';
import { FreeRoomBookingModal } from './screens/FreeRoomBookingModal';
import { GamingRoomBookingModal } from './screens/GamingRoomBookingModal';
import { DiningBookingModal } from './screens/DiningBookingModal';
import { WritePostModal } from './screens/WritePostModal';
import { PostDetailScreen } from './screens/PostDetailScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { EmailVerifyScreen } from './screens/EmailVerifyScreen';
import { LandingScreen } from './screens/LandingScreen';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { hasStoredSession } from './utils/auth';
import { apiCommonClient, CommonResponse, getOrCreateGuestId } from './utils/apiClient';
import { useAppHistory } from './hooks/useAppHistory';

// /support/cVersion 응답 데이터 타입. 앱에서는 up_version만 비교에 사용하고
// 나머지 필드(up_index/up_status/reg_timestamp)는 서버 전용 필드라 사용하지 않는다.
interface ClientVersionResponse {
  up_index: number;
  up_version: string;
  up_status: number;
  reg_timestamp: number;
}

// 앱 최초 로드 시 게스트 식별자(guest_id)가 없으면 생성해 localStorage에 저장한다.
getOrCreateGuestId();

// "1.1.21" 형태의 버전 문자열을 구간별 숫자로 비교한다 (문자열 비교 시 "1.9" > "1.10"으로 잘못
// 판정되는 것을 방지). currentVersion이 requiredVersion보다 낮을 때만 true — 로컬이 서버보다
// 높은 경우(예: 아직 배포 전인 테스트 빌드)는 강제 업데이트 대상이 아니다.
const isVersionOlder = (currentVersion: string, requiredVersion: string): boolean => {
  const current = currentVersion.split('.').map((n) => parseInt(n, 10) || 0);
  const required = requiredVersion.split('.').map((n) => parseInt(n, 10) || 0);
  const length = Math.max(current.length, required.length);

  for (let i = 0; i < length; i++) {
    const c = current[i] ?? 0;
    const r = required[i] ?? 0;
    if (c !== r) return c < r;
  }
  return false;
};

const AppContent: React.FC = () => {
  const {
    isLoggedIn,
    setIsLoggedIn,
    currentTab,
    currentSubScreen,
    showWriteModal,
    toastMessage,
    setCurrentTab,
    setCurrentSubScreen,
    setShowWriteModal,
    showToast,
    updatePushToken
  } = useApp();

  // 강제 업데이트: 안드로이드 앱에서만, 로그인 여부와 무관하게 최초 마운트 시 1회 확인한다.
  const [forceUpdateInfo, setForceUpdateInfo] = useState<{ current: string; required: string } | null>(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const checkForceUpdate = async () => {
      try {
        const [{ version: currentVersion }, response] = await Promise.all([
          CapacitorApp.getInfo(),
          apiCommonClient.post<CommonResponse<ClientVersionResponse>, {}>(
            '/support/cVersion',
            {},
            { suppressErrorToast: true }
          ),
        ]);

        const rawData = response?.data as any;
        const versionData: ClientVersionResponse | undefined = Array.isArray(rawData)
          ? rawData[0]
          : Array.isArray(rawData?.data)
          ? rawData.data[0]
          : rawData;

        const requiredVersion = versionData?.up_version;
        if (requiredVersion && isVersionOlder(currentVersion, requiredVersion)) {
          setForceUpdateInfo({ current: currentVersion, required: requiredVersion });
        }
      } catch (error) {
        console.error('앱 버전 확인(cVersion) 실패:', error);
      }
    };

    checkForceUpdate();
  }, []);
  // 페이지 새로고침(웹) / 앱 재실행(Capacitor)마다 다시 초기화되는 화면 상태이므로
  // 별도 영속 저장 없이 매 마운트 시 랜딩 화면부터 보여준다.
  // 단, 로그인 세션(sessionid)이 이미 남아있는 사용자는 랜딩 화면을 건너뛴다.
  const [showLanding, setShowLanding] = useState<boolean>(() => !hasStoredSession());

  const handleLandingStart = () => {
    setShowLanding(false);
    setCurrentSubScreen('login');
  };

  // 브라우저/기기 뒤로가기를 앱 내부 이동으로 처리 (라우터가 없어 직접 관리)
  useAppHistory({
    location: { showLanding, currentTab, currentSubScreen, showWriteModal },
    restore: (loc) => {
      setShowLanding(loc.showLanding);
      setCurrentTab(loc.currentTab as typeof currentTab);
      setCurrentSubScreen(loc.currentSubScreen);
      setShowWriteModal(loc.showWriteModal);
    },
    onExitHint: () => showToast('뒤로가기를 한 번 더 누르면 종료됩니다.'),
  });

  useEffect(() => {
    // 모바일 네이티브 푸시 알림 설정
    if (Capacitor.isNativePlatform()) {
      const initPushNotifications = async () => {
        try {
          let permStatus = await PushNotifications.checkPermissions();

          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }

          // 포그라운드 수신 시 로컬 알림(시스템 알림 센터)으로도 띄우기 위한 권한.
          // 안드로이드는 위 POST_NOTIFICATIONS 권한과 사실상 동일하지만, 플러그인 별도 체크가 필요하다.
          let localPermStatus = await LocalNotifications.checkPermissions();
          if (localPermStatus.display === 'prompt') {
            localPermStatus = await LocalNotifications.requestPermissions();
          }
        } catch (error) {
          console.error('푸시 알림 초기화 실패:', error);
        }
      };

      initPushNotifications();

      const registrationListener = PushNotifications.addListener(
        'registration',
        (token) => {
          console.log('발급된 FCM 토큰:', token.value);
          updatePushToken(token.value);
        }
      );

      const registrationErrorListener = PushNotifications.addListener(
        'registrationError',
        (error) => {
          console.error('FCM 등록 에러:', error);
        }
      );

      const notificationReceivedListener = PushNotifications.addListener(
        'pushNotificationReceived',
        async (notification) => {
          console.log('앱 열린 상태에서 푸시 수신:', notification);

          // pushNotificationReceived는 앱이 포그라운드일 때만 발생하며, 이 경우 시스템이 알림을
          // 자동으로 띄워주지 않는다(백그라운드/종료 상태와 다름) — 인앱 배너 + 로컬 알림으로 직접 노출한다.
          const title = notification.title || (notification.data as any)?.title || 'DOUBLE RING';
          const body = notification.body || (notification.data as any)?.body || '';

          showToast(body ? `${title}: ${body}` : title);

          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: Date.now() % 2147483647,
                  title,
                  body,
                },
              ],
            });
          } catch (error) {
            console.error('로컬 알림 표시 실패:', error);
          }
        }
      );

      const notificationActionListener = PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notificationAction) => {
          console.log('알림 클릭하여 앱 오픈:', notificationAction);
        }
      );

      return () => {
        registrationListener.then((l) => l.remove());
        registrationErrorListener.then((l) => l.remove());
        notificationReceivedListener.then((l) => l.remove());
        notificationActionListener.then((l) => l.remove());
      };
    }
  }, []);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'jackpot':
        return <JackpotMapScreen />;
      case 'poly':
        return <PolyMarketScreen />;
      case 'home':
        return <HomeScreen />;
      case 'freeroom':
        return <FreeRoomScreen />;
      case 'my':
        return <MyPageScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="h-screen h-dvh bg-[#070e17] text-white flex flex-col items-center justify-start font-sans select-none overflow-hidden">
      {/* Center Display Mobile Container */}
      <div className="w-full max-w-[430px] h-screen h-dvh bg-[#0D1B2A] flex flex-col relative overflow-hidden shadow-2xl">
        {/* 강제 업데이트: 로그인 여부/현재 화면과 무관하게 최상위에서 전체 화면을 덮는다. */}
        {forceUpdateInfo && (
          <ForceUpdateModal currentVersion={forceUpdateInfo.current} requiredVersion={forceUpdateInfo.required} />
        )}

        {/* PWA Install Banner */}
        <PwaInstallBanner />

        {showLanding ? (
          <LandingScreen onStart={handleLandingStart} />
        ) : (
          <>
            <Header />

            <main className="flex-1 px-4 overflow-y-auto no-scrollbar relative">
              {currentSubScreen === 'signup' ? (
                <SignUpScreen />
              ) : currentSubScreen === 'email-verify-request' ||
                currentSubScreen === 'email-verify-receipt' ||
                currentSubScreen === 'email-verify-success' ||
                currentSubScreen === 'email-verify-fail' ? (
                <EmailVerifyScreen />
              ) : currentSubScreen === 'login' ? (
                <LoginScreen />
              ) : currentSubScreen === 'post-detail' ? (
                <PostDetailScreen />
              ) : currentSubScreen === 'hotel-jackpot-detail' ? (
                <HotelJackpotDetailScreen />
              ) : currentSubScreen === 'jackpot-history' ? (
                <JackpotHistoryScreen />
              ) : currentSubScreen === 'poly-market-detail' ? (
                <PolyMarketDetailScreen />
              ) : currentSubScreen === 'poly-leaderboard' ? (
                <PolyLeaderboardScreen />
              ) : (
                renderTabContent()
              )}
            </main>

            {currentSubScreen === 'freeroom-booking' && <FreeRoomBookingModal />}
            {currentSubScreen === 'gaming-room-booking' && <GamingRoomBookingModal />}
            {currentSubScreen === 'dining-booking' && <DiningBookingModal />}
            {showWriteModal && <WritePostModal />}

            {toastMessage && (
              <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#C5A059] text-[#0D1B2A] px-4 py-2 rounded-full font-bold text-xs shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4">
                {toastMessage}
              </div>
            )}

            <>
              {/* <FreeRoomStickyBanner /> */}
              {/* 2026-09-08: 인증 화면(로그인 'login' / 회원가입 'signup')에서는 하단 네비를 숨긴다.
                  (이전 git restore로 이 분기가 사라졌던 것을 다시 추가)
                  2026-09-17: 이메일 인증 화면(email-verify-*)도 동일하게 하단 네비를 숨기기로 함. */}
              {currentSubScreen !== 'login' &&
                currentSubScreen !== 'signup' &&
                currentSubScreen !== 'email-verify-request' &&
                currentSubScreen !== 'email-verify-receipt' &&
                currentSubScreen !== 'email-verify-success' &&
                currentSubScreen !== 'email-verify-fail' && <BottomNav />}

              {/* 로그인·회원가입 화면: 하단 네비가 있던 자리에 회사 정보 푸터 표시 (공용 Footer 컴포넌트) */}
              {(currentSubScreen === 'login' || currentSubScreen === 'signup') && <Footer />}
            </>
          </>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;