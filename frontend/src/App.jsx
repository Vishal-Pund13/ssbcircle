import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';

// Heavy routes loaded on demand — keeps initial bundle small
const LoginPage           = lazy(() => import('./components/LoginPage'));
const RegisterPage        = lazy(() => import('./components/RegisterPage'));
const ProfilePage         = lazy(() => import('./components/ProfilePage'));
const CreateRoom          = lazy(() => import('./components/CreateRoom'));
const JoinRoom            = lazy(() => import('./components/JoinRoom'));
const RoomView            = lazy(() => import('./components/RoomView'));
const SuperAdminLogin     = lazy(() => import('./components/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));

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
          <Routes>
            <Route path="/"        element={<LandingPage />} />
            <Route path="/login"   element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/create"  element={<CreateRoom />} />
            <Route path="/join"    element={<JoinRoom />} />
            <Route path="/join/:code" element={<JoinRoom />} />
            <Route path="/room/:code" element={<ProtectedRoute><RoomView /></ProtectedRoute>} />
            <Route path="/sa"           element={<SuperAdminLogin />} />
            <Route path="/sa/dashboard" element={<SuperAdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
