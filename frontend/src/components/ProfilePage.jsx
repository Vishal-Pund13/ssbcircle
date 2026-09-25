import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveOnboarding } from '../services/api';
import { EXAM_TYPES } from '../data/examTypes';

function Avatar({ name, size = 'lg' }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${dim} rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Safe to seed from user on first render: /profile sits behind ProtectedRoute,
  // which does not mount this component until the user has loaded.
  const [name,  setName]  = useState(user?.display_name || '');
  const [exam,  setExam]  = useState(user?.exam_type    || '');
  const [phone, setPhone] = useState(user?.phone        || '');
  const [dSaving, setDSaving] = useState(false);
  const [dSaved,  setDSaved]  = useState(false);
  const [dError,  setDError]  = useState('');

  // referral_source is deliberately not sent: it is a one-time answer and the
  // model COALESCEs anything omitted, so editing here cannot wipe it.
  // An empty phone clears the stored number — that is how someone removes it
  // without having to ask us.
  async function saveDetails(e) {
    e.preventDefault();
    if (!name.trim()) { setDError('Please enter your name.'); return; }
    if (!exam)        { setDError('Please choose which exam you are preparing for.'); return; }

    setDSaving(true); setDError(''); setDSaved(false);
    try {
      await saveOnboarding({ display_name: name.trim(), exam_type: exam, phone: phone.trim() });
      await refreshUser();
      setDSaved(true);
      setTimeout(() => setDSaved(false), 2500);
    } catch (err) {
      setDError(err.message);
    } finally {
      setDSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-primary-600 font-bold text-lg">SSBCircle</Link>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Profile card */}
        <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          <Avatar name={user.display_name} />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{user.display_name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">@{user.username}</p>
            <p className="text-slate-400 text-xs mt-2">Member since {memberSince}</p>
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-4 py-2 rounded-xl transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Your details — the answers given on the welcome screen, editable here.
            Uses explicit classes rather than the surrounding `card` helper, which
            is not defined in index.css on this branch. */}
        <form onSubmit={saveDetails} className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-900">Your details</h2>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
            We use this to connect you with aspirants preparing for the same exam.
            Change it whenever you like.
          </p>

          <label className="block text-xs font-bold text-slate-700 mb-1.5">Name</label>
          <input
            type="text"
            className="input-base text-sm w-full"
            value={name}
            onChange={e => { setName(e.target.value); setDError(''); }}
            placeholder="Your name"
          />

          <label className="block text-xs font-bold text-slate-700 mt-4 mb-2">Preparing for</label>
          <div className="flex flex-wrap gap-2">
            {EXAM_TYPES.map(t => (
              <button key={t} type="button"
                onClick={() => { setExam(t); setDError(''); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  exam === t
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                }`}>
                {t}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold text-slate-700 mt-4 mb-1.5">
            Phone number <span className="font-medium text-slate-400">(optional)</span>
          </label>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Used only so our team can reach you and introduce you to other aspirants. It is never
            shown on your profile or to other members. Clear the box and save to remove it.
          </p>
          <input
            type="tel"
            inputMode="numeric"
            className="input-base text-sm w-full"
            value={phone}
            onChange={e => { setPhone(e.target.value); setDError(''); }}
            placeholder="10-digit mobile number"
          />

          {dError && <p className="text-xs text-red-600 mt-3">{dError}</p>}

          <button type="submit" disabled={dSaving} className="btn-primary text-sm px-5 py-2.5 mt-4">
            {dSaved ? 'Saved' : dSaving ? 'Saving…' : 'Save details'}
          </button>
        </form>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card text-center py-5">
            <p className="text-3xl font-extrabold text-primary-600">{user.rooms_created ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Rooms Created</p>
          </div>
          <div className="card text-center py-5">
            <p className="text-3xl font-extrabold text-slate-400">—</p>
            <p className="text-sm text-slate-500 mt-1">Followers <span className="text-xs">(soon)</span></p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/create')}
            className="btn-primary flex-1"
          >
            Create a Room
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Browse Rooms
          </button>
        </div>
      </div>
    </div>
  );
}
