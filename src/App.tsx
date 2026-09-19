import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { App as CapacitorApp } from '@capacitor/app';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
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
    showToast
  } = useApp();

  const [fcmToken, setFcmToken] = useState<string>('');

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
        if (requiredVersion && requiredVersion !== currentVersion) {
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
        } catch (error) {
          console.error('푸시 알림 초기화 실패:', error);
        }
      };

      initPushNotifications();

      const registrationListener = PushNotifications.addListener(
        'registration',
        (token) => {
          console.log('발급된 FCM 토큰:', token.value);
          setFcmToken(token.value);
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
        (notification) => {
          console.log('앱 열린 상태에서 푸시 수신:', notification);
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

              {/* 로그인 화면 한정: 하단 네비가 있던 자리에 회사 정보 푸터 표시 */}
              {currentSubScreen === 'login' && (
                <footer className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-[#0D1B2A]/95 backdrop-blur-xl border-t border-[#1F334D] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] text-center">
                  <p className="text-[11px] text-slate-500">
                    &copy; 2026 WILDWYNN Corp. All rights reserved.
                  </p>
                </footer>
              )}
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
