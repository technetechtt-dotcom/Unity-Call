import { BrowserRouter, Navigate, Route, Routes } from './lib/router';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './layout/AppShell';
import { OnboardingPage } from './pages/OnboardingPage';
import { ChatListPage } from './pages/ChatListPage';
import { ChatThreadPage } from './pages/ChatThreadPage';
import { NewChatPage } from './pages/NewChatPage';
import { ContactsPage } from './pages/ContactsPage';
import { IncomingCallPage } from './pages/IncomingCallPage';
import { ActiveCallPage } from './pages/ActiveCallPage';
import { SettingsPage } from './pages/SettingsPage';
import { SessionsPage } from './pages/SessionsPage';
import { CaptionOverlayPage } from './pages/CaptionOverlayPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { InterpretersPage } from './pages/InterpretersPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganisationAdminPage } from './pages/OrganisationAdminPage';
import { GuestJoinPage } from './pages/GuestJoinPage';
import { LegalPage } from './pages/LegalPage';
import './i18n/config';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" role="status">
        Loading Unity Call
      </div>
    );
  }
  return <Navigate to={user ? '/chats' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<OnboardingPage mode="login" />} />
      <Route path="/register" element={<OnboardingPage mode="register" />} />
      <Route path="/recover" element={<OnboardingPage mode="recovery" />} />
      <Route path="/join/:token" element={<GuestJoinPage />} />
      <Route path="/legal/privacy" element={<LegalPage kind="privacy" />} />
      <Route path="/legal/terms" element={<LegalPage kind="terms" />} />
      <Route path="/legal/help" element={<LegalPage kind="help" />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <RealtimeProvider>
              <AppShell />
            </RealtimeProvider>
          }
        >
          <Route path="/chats" element={<ChatListPage />} />
          <Route path="/chats/new" element={<NewChatPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/chats/:id" element={<ChatThreadPage />} />
          <Route path="/calls" element={<CallHistoryPage />} />
          <Route path="/calls/incoming/:id" element={<IncomingCallPage />} />
          <Route path="/calls/active/:id" element={<ActiveCallPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/sessions" element={<SessionsPage />} />
          <Route path="/settings/privacy" element={<PrivacyPage />} />
          <Route path="/settings/captions" element={<CaptionOverlayPage />} />
          <Route path="/interpreters" element={<InterpretersPage />} />
          <Route path="/orgs" element={<OrganizationsPage />} />
          <Route path="/orgs/manage" element={<OrganisationAdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}
