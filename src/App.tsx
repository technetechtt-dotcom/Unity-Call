import React, { useEffect, useState } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { UserProvider, useUser } from './context/UserContext';
import { ToastProvider } from './components/Toast';
import { StatusBar } from './components/StatusBar';
import { OnboardingPage } from './pages/OnboardingPage';
import { ChatListPage } from './pages/ChatListPage';
import { ChatThreadPage } from './pages/ChatThreadPage';
import { IncomingCallPage } from './pages/IncomingCallPage';
import { ActiveCallPage } from './pages/ActiveCallPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaptionOverlayPage } from './pages/CaptionOverlayPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import './i18n/config'; // Initialize i18n
type Page =
'onboarding' |
'chatList' |
'chatThread' |
'incomingCall' |
'activeCall' |
'settings' |
'captionOverlay' |
'callHistory' |
'profile';
function AppContent() {
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState<Page>('onboarding');
  const [selectedChat, setSelectedChat] = useState<
    {
      id: string;
      name: string;
    } |
    undefined>(
    undefined);
  const [incomingCaller, setIncomingCaller] = useState<string>('Thandi Nkosi');
  // Redirect to chat list if already logged in
  useEffect(() => {
    if (user.isLoggedIn && currentPage === 'onboarding') {
      setCurrentPage('chatList');
    } else if (!user.isLoggedIn && currentPage !== 'onboarding') {
      setCurrentPage('onboarding');
    }
  }, [user.isLoggedIn]);
  const navigate = (page: Page, params?: any) => {
    if (params) {
      if (params.name)
      setSelectedChat({
        id: params.chatId,
        name: params.name
      });
    }
    setCurrentPage(page);
  };
  const renderPage = () => {
    switch (currentPage) {
      case 'onboarding':
        return <OnboardingPage onComplete={() => navigate('chatList')} />;
      case 'chatList':
        return <ChatListPage onNavigate={navigate} />;
      case 'chatThread':
        return (
          <ChatThreadPage
            onBack={() => navigate('chatList')}
            onCall={() =>
            navigate('incomingCall', {
              name: selectedChat?.name
            })
            }
            contactName={selectedChat?.name} />);


      case 'incomingCall':
        return (
          <IncomingCallPage
            onAccept={() => navigate('activeCall')}
            onReject={() => navigate('chatList')}
            callerName={selectedChat?.name || incomingCaller} />);


      case 'activeCall':
        return (
          <ActiveCallPage
            onEndCall={() => navigate('chatList')}
            callerName={selectedChat?.name || incomingCaller} />);


      case 'settings':
        return <SettingsPage onNavigate={navigate} />;
      case 'captionOverlay':
        return <CaptionOverlayPage onBack={() => navigate('settings')} />;
      case 'callHistory':
        return <CallHistoryPage onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage onBack={() => navigate('settings')} />;
      default:
        return <OnboardingPage onComplete={() => navigate('chatList')} />;
    }
  };
  return (
    <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4 font-sans">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[430px] h-[850px] bg-white rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-gray-900 relative flex flex-col">
        {/* Notch / Dynamic Island Mock */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50"></div>

        <StatusBar />

        <div className="flex-1 overflow-hidden relative bg-gray-50">
          {renderPage()}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-50 pointer-events-none"></div>
      </div>
    </div>);

}
export function App() {
  return (
    <AccessibilityProvider>
      <UserProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </UserProvider>
    </AccessibilityProvider>);

}