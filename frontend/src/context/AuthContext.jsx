import { createContext, useContext, useState, useEffect } from 'react';
import { googleAuth, fetchMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetchMe()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function loginWithGoogle(credential) {
    const { token, user: u } = await googleAuth(credential);
    localStorage.setItem('token', token);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  // Re-read the user after something changes server-side. The welcome screen
  // and the profile editor both need this: without it onboarded_at stays stale
  // in context and OnboardingGate would send the user straight back to
  // /welcome after they had just filled it in.
  async function refreshUser() {
    const u = await fetchMe();
    setUser(u);
    return u;
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
