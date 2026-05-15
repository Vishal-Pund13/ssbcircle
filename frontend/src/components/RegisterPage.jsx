import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

function CircleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
      <circle cx="24" cy="24" r="22" stroke="#facc15" strokeWidth="3" />
      <circle cx="14" cy="20" r="4" fill="#facc15" />
      <circle cx="24" cy="14" r="4" fill="#facc15" />
      <circle cx="34" cy="20" r="4" fill="#facc15" />
      <circle cx="30" cy="32" r="4" fill="#facc15" />
      <circle cx="18" cy="32" r="4" fill="#facc15" />
      <path d="M14 20 L24 14 L34 20 L30 32 L18 32 Z" stroke="#facc15" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', displayName: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f0f0f]">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <CircleIcon />
          <span className="text-xl font-extrabold text-white">SSBCircle</span>
        </Link>

        <div className="card">
          <h1 className="text-xl font-bold text-white mb-1">Create account</h1>
          <p className="text-white/40 text-sm mb-6">Join SSBCircle and start practising</p>

          <GoogleSignInButton
            onSuccess={() => navigate('/', { replace: true })}
            onError={(msg) => setError(msg)}
          />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or register with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Display Name</label>
              <input
                name="displayName"
                type="text"
                className="input-field"
                placeholder="Vishal Pund"
                value={form.displayName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">@</span>
                <input
                  name="username"
                  type="text"
                  className="input-field pl-7"
                  placeholder="vishalpund"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-white/20 mt-1">3–20 chars, letters/numbers/underscore</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Confirm Password</label>
              <input
                name="confirm"
                type="password"
                className="input-field"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/30 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
