import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FreeRoomStickyBanner } from './components/FreeRoomStickyBanner';
import { HomeScreen } from './screens/HomeScreen';
import { JackpotMapScreen } from './screens/JackpotMapScreen';
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
import { HotelJackpotDetailScreen } from './screens/HotelJackpotDetailScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { EmailVerifyScreen } from './screens/EmailVerifyScreen';
import { CurrentTripSummaryScreen } from './screens/CurrentTripSummaryScreen';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { DailyLoginBonusModal } from './components/DailyLoginBonusModal';

const AppContent: React.FC = () => {
  const {
    isLoggedIn,
    currentTab,
    currentSubScreen,
    hasActiveTrip,
    showWriteModal,
    toastMessage
  } = useApp();

  // Render current tab main screen
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
        {/* PWA Install Banner */}
        <PwaInstallBanner />

        {/* App Header */}
        <Header />

        {/* Main Body Viewport */}
        <main className="flex-1 px-4 overflow-y-auto no-scrollbar relative">
          {currentSubScreen === 'signup' ? (
            <SignUpScreen />
          ) : currentSubScreen === 'email-verify-request' ||
            currentSubScreen === 'email-verify-receipt' ||
            currentSubScreen === 'email-verify-success' ||
            currentSubScreen === 'email-verify-fail' ? (
            <EmailVerifyScreen />
          ) : !isLoggedIn || currentSubScreen === 'login' ? (
            <LoginScreen />
          ) : currentSubScreen === 'post-detail' ? (
            <PostDetailScreen />
          ) : currentSubScreen === 'hotel-jackpot-detail' ? (
            <HotelJackpotDetailScreen />
          ) : currentSubScreen === 'poly-market-detail' ? (
            <PolyMarketDetailScreen />
          ) : currentSubScreen === 'poly-leaderboard' ? (
            <PolyLeaderboardScreen />
          ) : currentSubScreen === 'current-trip-summary' && hasActiveTrip ? (
            <CurrentTripSummaryScreen />
          ) : (
            renderTabContent()
          )}
        </main>

        {/* Subscreen Modals */}
        {currentSubScreen === 'freeroom-booking' && <FreeRoomBookingModal />}
        {currentSubScreen === 'gaming-room-booking' && <GamingRoomBookingModal />}
        {currentSubScreen === 'dining-booking' && <DiningBookingModal />}
        {showWriteModal && <WritePostModal />}
        <DailyLoginBonusModal />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#C5A059] text-[#0D1B2A] px-4 py-2 rounded-full font-bold text-xs shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4">
            {toastMessage}
          </div>
        )}

        {/* FreeRoom Sticky Voucher Banner & Bottom Navigation */}
        {isLoggedIn && (
          <>
            <FreeRoomStickyBanner />
            <BottomNav />
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
