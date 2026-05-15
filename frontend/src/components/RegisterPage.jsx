import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await register(form.username.trim(), form.displayName.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
              <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
              <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
              <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
              <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
              <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
              <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
              <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="font-bold text-gray-900">SSBCircle</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Start practising GD today</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <GoogleSignInButton
            onSuccess={() => navigate('/', { replace: true })}
            onError={msg => setError(msg)}
          />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Name</label>
              <input className="input-base" type="text" placeholder="Vishal Pund"
                value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
              <input className="input-base" type="text" placeholder="vishalpund"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username" disabled={loading} />
              <p className="text-[11px] text-gray-400 mt-1">3–20 characters, letters/numbers/underscore</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input className="input-base" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password" disabled={loading} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
              <input className="input-base" type="password" placeholder="Re-enter password"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password" disabled={loading} />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 mt-1" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
