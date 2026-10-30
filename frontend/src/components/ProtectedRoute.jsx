import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SoldierLoader } from './SoldierRunner';

// fallback: what a signed-out visitor sees instead of being sent to sign in
export default function ProtectedRoute({ children, fallback }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SoldierLoader />;

  if (!user) {
    if (fallback) return fallback;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
