import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, googleAuth, fetchMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetchMe()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const { token, user: u } = await loginUser(username, password);
    localStorage.setItem('token', token);
    setUser(u);
  }

  async function register(username, displayName, password) {
    const { token, user: u } = await registerUser(username, displayName, password);
    localStorage.setItem('token', token);
    setUser(u);
  }

  async function loginWithGoogle(credential) {
    const { token, user: u } = await googleAuth(credential);
    localStorage.setItem('token', token);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
