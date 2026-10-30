import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { trackPageView } from './analytics';

function RouteTracker() {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname); }, [location]);
  return null;
}

// Send a signed-in user who has not answered the welcome questions — or who
// has no mobile number yet, now that one is required — to /welcome. While auth
// is still loading, user is null and nothing redirects. A live room and the
// admin area are never interrupted.
function OnboardingGate() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || (user.onboarded_at && user.phone)) return null;

  const { pathname } = location;
  if (pathname === '/welcome' || pathname.startsWith('/sa') || pathname.startsWith('/room/')) return null;

  return <Navigate to="/welcome" replace />;
}
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import MobileTabBar from './components/MobileTabBar';
import AnnouncementPoster from './components/AnnouncementPoster';

// Heavy routes loaded on demand — keeps initial bundle small
const LoginPage           = lazy(() => import('./components/LoginPage'));
const RegisterPage        = lazy(() => import('./components/RegisterPage'));
const ProfilePage         = lazy(() => import('./components/ProfilePage'));
const CreateRoom          = lazy(() => import('./components/CreateRoom'));
const JoinRoom            = lazy(() => import('./components/JoinRoom'));
const RoomView            = lazy(() => import('./components/RoomView'));
const SuperAdminLogin     = lazy(() => import('./components/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const ExportCards         = lazy(() => import('./components/ExportCards'));
const CurrentAffairs      = lazy(() => import('./components/CurrentAffairs'));
const ReadPage            = lazy(() => import('./components/SwipeReader/ReadPage'));
const WomenSeriesPage     = lazy(() => import('./components/WomenSeriesPage'));
const SessionPage         = lazy(() => import('./components/SessionPage'));
const MentorPage          = lazy(() => import('./components/MentorPage'));
const OnboardingPage      = lazy(() => import('./components/OnboardingPage'));
const PiqPage             = lazy(() => import('./components/PiqPage'));
const TatPage             = lazy(() => import('./components/TatPage'));
const ExamCalendarPage    = lazy(() => import('./components/ExamCalendar'));
const BeginnerGuide       = lazy(() => import('./components/BeginnerGuide'));
const ModeratorProgram    = lazy(() => import('./components/ModeratorProgram'));
const CommunityPage       = lazy(() => import('./components/CommunityPage'));
const PostPage            = lazy(() => import('./components/PostPage'));
const PrepPage            = lazy(() => import('./components/prep/PrepPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <RouteTracker />
          <OnboardingGate />
          <Routes>
            <Route path="/"        element={<LandingPage />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/create"  element={<CreateRoom />} />
            <Route path="/join"    element={<JoinRoom />} />
            <Route path="/join/:code" element={<JoinRoom />} />
            <Route path="/room/:code" element={<ProtectedRoute><RoomView /></ProtectedRoute>} />
            <Route path="/current-affairs"       element={<CurrentAffairs />} />
            <Route path="/article/:slug"          element={<CurrentAffairs />} />
            <Route path="/read/:articleId"        element={<ReadPage />} />
            <Route path="/series/women-india"     element={<WomenSeriesPage />} />
            <Route path="/session"               element={<SessionPage />} />
            <Route path="/mentor/:slug"          element={<MentorPage />} />
            <Route path="/welcome"               element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/piq"                   element={<ProtectedRoute><PiqPage /></ProtectedRoute>} />
            <Route path="/tat"                   element={<ProtectedRoute><TatPage /></ProtectedRoute>} />
            <Route path="/exams"                 element={<ExamCalendarPage />} />
            <Route path="/become-an-officer"     element={<BeginnerGuide />} />
            <Route path="/start"                 element={<Navigate to="/become-an-officer" replace />} />
            <Route path="/moderators"            element={<ModeratorProgram />} />
            <Route path="/prep"                  element={<PrepPage />} />
            <Route path="/community"             element={<CommunityPage />} />
            <Route path="/community/:id"         element={<PostPage />} />
            <Route path="/sa"           element={<SuperAdminLogin />} />
            <Route path="/sa/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/sa/export"    element={<ExportCards />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <MobileTabBar />
          <AnnouncementPoster />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
