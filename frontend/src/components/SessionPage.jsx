import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Shield, ArrowRight, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

const API        = import.meta.env.VITE_API_URL || 'https://talk4ssb-backend.onrender.com';
const MAX_SPOTS  = 30;
const ENTRY_OPTS = ['NDA', 'CDS', 'AFCAT', 'SSC GD', 'TES', 'UES', 'NCC Special Entry', 'Other'];
const REC_OPTS   = ['No', 'Yes — Army', 'Yes — Air Force', 'Yes — Navy', 'Yes — Other'];

export default function SessionPage() {
  const { user } = useAuth();
  const [form,   setForm]   = useState({ entry_type: '', attempts: '', prev_recommendation: 'No' });
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const [spots,  setSpots]  = useState(MAX_SPOTS);

  useEffect(() => {
    fetch(`${API}/api/event/spots`)
      .then(r => r.json()).then(d => setSpots(d.spotsLeft)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.entry_type) { setErrMsg('Select which entry you are appearing for.'); return; }
    if (!form.attempts)   { setErrMsg('Enter your number of SSB attempts.'); return; }
    setStatus('loading'); setErrMsg('');
    try {
      const res  = await fetch(`${API}/api/event/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:                user.display_name,
          email:               user.email,
          entry_type:          form.entry_type,
          attempts:            parseInt(form.attempts),
          prev_recommendation: form.prev_recommendation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setSpots(data.spotsLeft);
    } catch (err) {
      setStatus('error'); setErrMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Top bar */}
      <div className="border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6">
              <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3"/>
              <circle cx="14" cy="20" r="3.5" fill="#1e3a5f"/>
              <circle cx="24" cy="14" r="3.5" fill="#1e3a5f"/>
              <circle cx="34" cy="20" r="3.5" fill="#1e3a5f"/>
              <circle cx="30" cy="31" r="3.5" fill="#1e3a5f"/>
              <circle cx="18" cy="31" r="3.5" fill="#1e3a5f"/>
              <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none"/>
            </svg>
            <span className="font-bold text-gray-900 text-sm">SSBCircle</span>
          </Link>
          <span className="text-xs text-gray-400 font-medium">{spots} spot{spots !== 1 ? 's' : ''} remaining</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Session</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
            Session by a Recommended Candidate
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" /> 23 May 2026
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" /> 10:00 PM IST
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" /> Limited to {MAX_SPOTS}
            </span>
          </div>

          <div className="flex gap-2 mt-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-1 rounded-full uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Indian Army
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-1 rounded-full uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Indian Air Force
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-8" />

        {/* Content */}
        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">You're registered</p>
            <p className="text-sm text-gray-500 mb-1">
              Confirmation sent to <span className="font-medium text-gray-700">{user?.email}</span>
            </p>
            <p className="text-sm text-gray-500">You'll receive a reminder 30 minutes before the session.</p>
            <Link to="/" className="inline-block mt-6 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              ← Back to SSBCircle
            </Link>
          </div>

        ) : !user ? (
          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Step 1 of 2</p>
            <p className="text-base font-semibold text-gray-900 mb-1">Sign in to register</p>
            <p className="text-sm text-gray-500 mb-6">
              Your name and email will be carried over automatically. You'll only need to fill in your SSB details.
            </p>
            <GoogleSignInButton />
          </div>

        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-500 mb-1 font-medium">Step 2 of 2</p>
            <p className="text-base font-semibold text-gray-900 mb-6">Your SSB details</p>

            {/* Signed-in user row */}
            <div className="flex items-center gap-3 border border-gray-100 rounded-xl p-3.5 mb-6 bg-gray-50">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.display_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="space-y-5">

              {/* Entry type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Which entry are you appearing for?
                </label>
                <select
                  required
                  value={form.entry_type}
                  onChange={e => setForm(p => ({ ...p, entry_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-all"
                >
                  <option value="">Select entry type</option>
                  {ENTRY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Attempts */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Number of SSB attempts so far
                </label>
                <input
                  type="number" min="0" max="20" required
                  placeholder="0 if this is your first attempt"
                  value={form.attempts}
                  onChange={e => setForm(p => ({ ...p, attempts: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-all"
                />
              </div>

              {/* Previous recommendation */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Any previous recommendation?
                </label>
                <select
                  value={form.prev_recommendation}
                  onChange={e => setForm(p => ({ ...p, prev_recommendation: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-all"
                >
                  {REC_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {errMsg && (
                <p className="text-xs font-medium text-red-600">{errMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Registering…' : <>Confirm Registration <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-xs text-gray-400 text-center">
                You'll receive a confirmation email and a reminder 30 minutes before the session.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
