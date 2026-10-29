import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, PenLine, CheckSquare, CalendarDays, Plus, LogIn, ShieldCheck, MessageSquareWarning,
  LogOut, ChevronRight, ChevronDown, Pencil, Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveOnboarding } from '../services/api';
import { EXAM_TYPES } from '../data/examTypes';
import SiteNav from './SiteNav';
import PlatformFeedbackDialog from './PlatformFeedbackDialog';

// The "Me" tab on phones: who you are, your prep tools, rooms, and account
// actions in one place. The details form is the one from the welcome screen,
// folded away because it is changed rarely.

const MY_PREP = [
  { to: '/piq',               icon: FileText,     title: 'My PIQ',         desc: 'Your form and its analysis' },
  { to: '/tat',               icon: PenLine,      title: 'TAT practice',   desc: 'Write a story, get feedback' },
  { to: '/prep',              icon: CheckSquare,  title: 'Prep Sheet',     desc: 'Topics and your daily plan' },
  { to: '/exams?tab=eligible', icon: CalendarDays, title: 'My entries',    desc: 'What you can apply for' },
];

function Avatar({ name, url }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  if (url) return <img src={url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-16 h-16 text-xl rounded-full bg-brand-600 flex items-center justify-center font-bold text-white shrink-0">
      {initials}
    </div>
  );
}

function Row({ icon: Icon, title, desc, to, onClick, tone = 'brand' }) {
  const inner = (
    <>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : tone === 'gray' ? 'bg-gray-100 text-gray-500' : 'bg-brand-50 text-brand-600'}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-base font-semibold text-gray-900">{title}</span>
        {desc && <span className="block text-sm text-gray-500">{desc}</span>}
      </span>
      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
    </>
  );
  const cls = 'w-full flex items-center gap-3 px-4 py-3 min-h-[64px] hover:bg-gray-50 active:bg-gray-50 cursor-pointer';
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Safe to seed from user on first render: /profile sits behind ProtectedRoute,
  // which does not mount this component until the user has loaded.
  const [name,  setName]  = useState(user?.display_name || '');
  const [exam,  setExam]  = useState(user?.exam_type    || '');
  const [phone, setPhone] = useState(user?.phone        || '');
  const [ssbDate, setSsbDate] = useState(user?.ssb_date || '');
  const [dSaving, setDSaving] = useState(false);
  const [dSaved,  setDSaved]  = useState(false);
  const [dError,  setDError]  = useState('');
  const [editing, setEditing] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
      await saveOnboarding({
        display_name: name.trim(),
        exam_type:    exam,
        phone:        phone.trim(),
        ssb_date:     ssbDate,
      });
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
    year: 'numeric', month: 'long',
  });
  const labelCls = 'block text-sm font-bold text-gray-800 mt-5 mb-1.5';
  const hintCls = 'text-sm text-gray-500 mb-2 leading-relaxed';

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
        {/* Who you are */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <Avatar name={user.display_name} url={user.avatar_url} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{user.display_name}</h1>
            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            <p className="text-sm text-gray-500 mt-1">
              {user.exam_type && <span className="font-semibold text-brand-700">{user.exam_type}</span>}
              {user.exam_type && ' · '}Member since {memberSince}
            </p>
          </div>
        </section>

        {/* Prep */}
        <section>
          <h2 className="px-1 mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">My prep</h2>
          <div className="grid grid-cols-2 gap-3">
            {MY_PREP.map(({ to, icon: Icon, title, desc }) => (
              <Link key={to} to={to}
                className="bg-white border border-gray-200 rounded-2xl p-4 min-h-[112px] flex flex-col gap-2 hover:border-gray-300 active:bg-gray-50">
                <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <span>
                  <span className="block text-base font-bold text-gray-900 leading-tight">{title}</span>
                  <span className="block text-sm text-gray-500 leading-snug mt-0.5">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Rooms */}
        <section>
          <h2 className="px-1 mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">Practise live</h2>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            <Row icon={Plus} title="Create a room" desc={`You have hosted ${user.rooms_created ?? 0} so far`} to="/create" />
            <Row icon={LogIn} title="Join with a code" desc="A friend sent you a room code" to="/join" />
          </div>
        </section>

        {/* Details — folded, changed rarely */}
        <section className="bg-white border border-gray-200 rounded-2xl">
          <button type="button" onClick={() => setEditing(v => !v)} aria-expanded={editing}
            className="w-full flex items-center gap-3 px-4 min-h-[64px] cursor-pointer">
            <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0"><Pencil className="w-5 h-5" /></span>
            <span className="flex-1 text-left">
              <span className="block text-base font-semibold text-gray-900">Your details</span>
              <span className="block text-sm text-gray-500">Name, exam, SSB date, phone</span>
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${editing ? 'rotate-180' : ''}`} />
          </button>

          {editing && (
            <form onSubmit={saveDetails} className="px-4 pb-5 border-t border-gray-100">
              <label className={labelCls}>Name</label>
              <input type="text" className="input-base" value={name}
                onChange={e => { setName(e.target.value); setDError(''); }} placeholder="Your name" />

              <label className={labelCls}>Preparing for</label>
              <div className="flex flex-wrap gap-2">
                {EXAM_TYPES.map(t => (
                  <button key={t} type="button"
                    onClick={() => { setExam(t); setDError(''); }}
                    className={`text-sm font-semibold px-3.5 min-h-[40px] rounded-full border transition-colors cursor-pointer ${
                      exam === t ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              <label className={labelCls}>SSB date <span className="font-medium text-gray-400">(optional)</span></label>
              <p className={hintCls}>From your call-up letter. The home page counts down the days. Clear it and save to remove.</p>
              <input type="date" className="input-base" value={ssbDate}
                onChange={e => { setSsbDate(e.target.value); setDError(''); }} />

              <label className={labelCls}>Phone number <span className="font-medium text-gray-400">(optional)</span></label>
              <p className={hintCls}>Only our team sees it, to reach you and introduce you to other aspirants. Clear it and save to remove.</p>
              <input type="tel" inputMode="numeric" className="input-base" value={phone}
                onChange={e => { setPhone(e.target.value); setDError(''); }} placeholder="10-digit mobile number" />

              {dError && <p className="text-sm text-red-600 mt-3">{dError}</p>}

              <button type="submit" disabled={dSaving} className="btn-primary text-base w-full sm:w-auto px-6 py-3 mt-5">
                {dSaved ? <><Check className="w-4 h-4" /> Saved</> : dSaving ? 'Saving…' : 'Save details'}
              </button>
            </form>
          )}
        </section>

        {/* Community and account */}
        <section className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          <Row icon={ShieldCheck} tone="emerald" title="Become a moderator" desc="Lead the community, earn a stipend" to="/moderators" />
          <Row icon={MessageSquareWarning} tone="gray" title="Report a problem or idea" onClick={() => setFeedbackOpen(true)} />
          <Row icon={LogOut} tone="gray" title="Sign out" onClick={handleLogout} />
        </section>
      </div>

      {feedbackOpen && <PlatformFeedbackDialog onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
