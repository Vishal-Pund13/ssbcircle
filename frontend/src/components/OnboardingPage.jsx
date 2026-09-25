import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveOnboarding } from '../services/api';
import { Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { EXAM_TYPES, SOURCES } from '../data/examTypes';

// Shown once, right after the first Google sign-in.
//
// Only the exam matters enough to insist on — it is what lets us pair two
// aspirants sensibly. The phone number is optional on purpose: it is the field
// most likely to make someone abandon the form, and the one that carries real
// obligations once we hold it.

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors cursor-pointer ${
        selected
          ? 'bg-brand-600 border-brand-600 text-white'
          : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name,   setName]   = useState(user?.display_name || '');
  const [exam,   setExam]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!name.trim())  { setError('Please tell us your name.'); return; }
    if (!exam)         { setError('Please choose which exam you are preparing for.'); return; }

    setSaving(true); setError('');
    try {
      await saveOnboarding({
        display_name:    name.trim(),
        exam_type:       exam,
        phone:           phone.trim(),
        referral_source: source,
      });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not save that. Please try again.');
      setSaving(false);
    }
  }

  // Skipping does not mark the user as onboarded, so the screen comes back on a
  // later visit. A session flag stops it reappearing on every page this visit.
  function skip() {
    try { sessionStorage.setItem('ssbcircle:onboarding-skipped', '1'); } catch { /* private mode */ }
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-lg mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-600">Welcome to SSBCircle</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          Two quick questions{user?.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          This helps us put you with aspirants preparing for the same exam, so you are not
          sitting in an empty room.
        </p>

        <form onSubmit={submit} className="mt-7 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Your name</label>
            <input
              type="text"
              className="input-base text-sm w-full"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="As you would like it shown"
            />
          </div>

          {/* Exam */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Which are you preparing for?
            </label>
            <p className="text-xs text-gray-400 mb-3">We use this to match you with the right people.</p>
            <div className="flex flex-wrap gap-2">
              {EXAM_TYPES.map(t => (
                <Chip key={t} label={t} selected={exam === t}
                  onClick={() => { setExam(t); setError(''); }} />
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Phone number <span className="font-medium text-gray-400">(optional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              SSBCircle is in beta, so not many aspirants are online at the same time.
              Share your number and someone from our team will personally connect you with
              others at your stage.
            </p>
            <input
              type="tel"
              inputMode="numeric"
              className="input-base text-sm w-full"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              placeholder="10-digit mobile number"
            />
          </div>

          {/* Referral */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Where did you hear about us? <span className="font-medium text-gray-400">(optional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">It tells us where to find more aspirants like you.</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(s => (
                <Chip key={s} label={s} selected={source === s}
                  onClick={() => setSource(source === s ? '' : s)} />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-gray-600 leading-relaxed space-y-1.5">
              <p>
                <span className="font-bold text-gray-800">How we use this.</span>{' '}
                Your number is used only so our team can contact you and introduce you to other
                aspirants. It is never shown on your profile, never visible to other members, and
                never sold or shared with anyone else.
              </p>
              <p>
                You can ask us to delete your number at any time and we will remove it.
              </p>
              <p>
                <span className="font-bold text-gray-800">If you are under 18</span>, please check
                with a parent or guardian before sharing a phone number.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-1.5">
              {saving ? 'Saving…' : <>Continue <Check className="w-4 h-4" /></>}
            </button>
            <button type="button" onClick={skip}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-3 py-3 cursor-pointer">
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
