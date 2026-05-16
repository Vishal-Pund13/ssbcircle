import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      sessionStorage.setItem('sa_token', data.token);
      navigate('/sa/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6 shrink-0">
            <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3"/>
            <circle cx="14" cy="20" r="3.5" fill="#1e3a5f"/>
            <circle cx="24" cy="14" r="3.5" fill="#1e3a5f"/>
            <circle cx="34" cy="20" r="3.5" fill="#1e3a5f"/>
            <circle cx="30" cy="31" r="3.5" fill="#1e3a5f"/>
            <circle cx="18" cy="31" r="3.5" fill="#1e3a5f"/>
          </svg>
          <span className="font-bold text-gray-900 text-sm tracking-tight">SSBCircle</span>
          <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-widest border border-gray-200 px-2 py-0.5 rounded-full">Admin</span>
        </div>

        <h1 className="text-lg font-bold text-gray-900 mb-1">Admin Access</h1>
        <p className="text-xs text-gray-400 mb-6">Restricted area — authorised personnel only.</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0"/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="input-base" placeholder="Admin username"
              autoComplete="off" disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-base" placeholder="••••••••"
              autoComplete="off" disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading || !username || !password}
            className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
