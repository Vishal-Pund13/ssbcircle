import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveOnboarding } from '../services/api';
import { Check, AlertCircle, ShieldCheck, Users, ChevronDown } from 'lucide-react';
import { STEPS as MOD_STEPS, DUTIES as MOD_DUTIES } from '../data/moderatorProgram';
import { EXAM_TYPES, SOURCES, otherChoice, otherText } from '../data/examTypes';

// Shown once, right after the first Google sign-in.
//
// Name, exam and mobile number are required. The exam lets us pair aspirants
// sensibly; the number keeps out throwaway accounts, spam and noise. Members
// who joined before the number was required land here once to add it, with
// their other answers filled in.
//
// A tick-box records interest in the moderator programme; the team sees it in
// the admin panel and can invite them to a trial.

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

  const returning = !!user?.onboarded_at;   // here only to add a mobile number
  const [name,   setName]   = useState(user?.display_name || '');
  const [exam,   setExam]   = useState(otherChoice(user?.exam_type));
  const [examOther, setExamOther] = useState(otherText(user?.exam_type));
  const [phone,  setPhone]  = useState(user?.phone || '');
  // A saved "Other: <words>" comes back split into the chip and the box
  const [source, setSource] = useState(otherChoice(user?.referral_source));
  const [sourceOther, setSourceOther] = useState(otherText(user?.referral_source));
  const [ssbDate, setSsbDate] = useState(user?.ssb_date || '');
  const [modInterest, setModInterest] = useState(false);
  // "How it works" opens here, not on /moderators: until this form is done,
  // every other page sends the member straight back to /welcome.
  const [showHow, setShowHow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!name.trim())  { setError('Please tell us your name.'); return; }
    if (!exam)         { setError('Please choose which exam you are preparing for.'); return; }
    if (exam === 'Other' && examOther.trim().length < 2) {
      setError('Please tell us which exam you are preparing for.'); return;
    }
    if (!/^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/[\s()-]/g, ''))) {
      setError('Please enter your 10-digit mobile number.'); return;
    }
    if (!source) { setError('Please tell us where you heard about us.'); return; }
    if (source === 'Other' && sourceOther.trim().length < 2) {
      setError('Please tell us where you heard about us.'); return;
    }

    setSaving(true); setError('');
    try {
      await saveOnboarding({
        display_name:    name.trim(),
        exam_type:       exam,
        exam_other:      exam === 'Other' ? examOther.trim() : '',
        phone:           phone.trim(),
        referral_source: source,
        referral_other:  source === 'Other' ? sourceOther.trim() : '',
        ssb_date:        ssbDate,
        moderator_interest: modInterest,
      });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not save that. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-lg mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-600">Welcome to SSBCircle</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          {returning ? 'One more thing' : 'A few quick questions'}{user?.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          {returning
            ? 'Every member now adds a mobile number. It keeps SSBCircle free of spam and noise — please add yours below.'
            : 'This helps us put you with aspirants preparing for the same exam, and keeps SSBCircle a serious place to prepare.'}
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
            {exam === 'Other' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Which exam? <span className="text-red-500">*</span>
                </label>
                <input type="text" maxLength={32} autoFocus
                  className="input-base text-sm w-full"
                  value={examOther}
                  onChange={e => { setExamOther(e.target.value); setError(''); }}
                  placeholder="e.g. Territorial Army, JAG, NCC Special Entry" />
              </div>
            )}
          </div>

          {/* SSB date */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Your SSB date <span className="font-medium text-gray-400">(optional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              If you already have a call-up letter, add the date and we will show you
              a countdown on the home page. Leave it blank if you do not have one yet.
            </p>
            <input
              type="date"
              className="input-base text-sm w-full"
              value={ssbDate}
              onChange={e => { setSsbDate(e.target.value); setError(''); }}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Mobile number <span className="font-medium text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Required for every member. It keeps SSBCircle free of fake accounts, spam and noise,
              so the rooms and community stay useful for serious aspirants. Our team may also use it
              to connect you with others at your stage.
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
              Where did you hear about us? <span className="font-medium text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">It tells us where to find more aspirants like you.</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map(s => (
                <Chip key={s} label={s} selected={source === s}
                  onClick={() => { setSource(source === s ? '' : s); setError(''); }} />
              ))}
            </div>
            {source === 'Other' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tell us where <span className="text-red-500">*</span>
                </label>
                <input type="text" maxLength={50} autoFocus
                  className="input-base text-sm w-full"
                  value={sourceOther}
                  onChange={e => { setSourceOther(e.target.value); setError(''); }}
                  placeholder="e.g. a Facebook group, my school, a poster" />
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-[12px] text-gray-600 leading-relaxed space-y-1.5">
              <p>
                <span className="font-bold text-gray-800">How we use this.</span>{' '}
                Your number is used only so our team can contact you and introduce you to other
                aspirants. It is never shown on your profile, never visible to other members, and
                never sold or shared with anyone else.
              </p>
              <p>
                You can ask us to delete your account and number at any time and we will remove them.
              </p>
              <p>
                <span className="font-bold text-gray-800">If you are under 18</span>, please check
                with a parent or guardian before sharing a phone number.
              </p>
            </div>
          </div>

          {/* Moderator programme */}
          <div className={`rounded-xl border transition-colors ${modInterest ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
            <label className="flex items-start gap-3 px-4 pt-3.5 pb-2 cursor-pointer">
              <input type="checkbox" checked={modInterest} onChange={e => setModInterest(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">
                <span className="flex items-center gap-1.5 font-bold text-gray-900"><Users className="w-4 h-4 text-emerald-600" /> I'd like to help run SSBCircle as a moderator</span>
                Moderators host sessions, help new aspirants and keep the community clean. After a two-week trial,
                the officers who built SSBCircle choose moderators, who earn a stipend and a MOD badge. Tick this and
                we will reach out.
              </span>
            </label>
            <button type="button" onClick={() => setShowHow(v => !v)} aria-expanded={showHow}
              className="ml-11 mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700 cursor-pointer">
              How it works <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHow ? 'rotate-180' : ''}`} />
            </button>
            {showHow && (
              <div className="mx-4 mb-4 rounded-lg bg-white border border-gray-200 p-3.5 text-[13px] text-gray-700">
                <ol className="space-y-2">
                  {MOD_STEPS.map((st, i) => (
                    <li key={st.title} className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span><span className="font-semibold text-gray-900">{st.title}.</span> {st.text}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 font-semibold text-gray-900">What moderators do</p>
                <ul className="mt-1 space-y-1 list-disc pl-5 text-gray-600">
                  {MOD_DUTIES.slice(0, 4).map(d => <li key={d}>{d}</li>)}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <button type="submit" disabled={saving}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-1.5">
            {saving ? 'Saving…' : <>Continue <Check className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
