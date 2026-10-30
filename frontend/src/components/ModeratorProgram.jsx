import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, BadgeCheck, Users, Award, Check, ArrowRight, Eye, Clock, ChevronDown, AlertCircle, ShieldCheck } from 'lucide-react';
import SiteNav from './SiteNav';
import { useAuth } from '../context/AuthContext';
import { getModeratorStatus, applyModerator, withdrawModerator } from '../services/api';
import { PERKS, DUTIES, WHO_CAN_APPLY, STEPS, SCORE_ROWS, TARGET_ROWS, FAQ } from '../data/moderatorProgram';
import { trackEvent } from '../analytics';
import { PageHead, CoverBand } from './PageCover';

// The moderator programme, pitched as an opportunity: help run the platform,
// get recognised and paid for it. Opt in, two weeks of tracked activity,
// review by the founding officers. The scoring is shown in full so it is fair.

const ICONS = { IndianRupee, BadgeCheck, Users, Award };

function Progress({ label, value, target }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const met = value >= target;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 flex items-center gap-1.5">{met && <Check className="w-4 h-4 text-emerald-600" />}{label}</span>
        <span className="font-semibold tabular-nums text-gray-900">{value} <span className="font-normal text-gray-400">/ {target}</span></span>
      </div>
      <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-brand-600'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusCard({ user }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ motivation: '', availability: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getModeratorStatus().then(setData).catch(() => setError('Could not load your status.'));
  }, [user]);

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-lg font-bold text-gray-900">Sign in to opt in</p>
        <p className="text-sm text-gray-500 mt-1">An SSBCircle account is all you need.</p>
        <Link to="/login" state={{ from: { pathname: '/moderators' } }} className="btn-primary text-sm px-6 py-2.5 mt-4 inline-flex">Sign in</Link>
      </div>
    );
  }
  if (!data) return <div className="h-48 bg-white border border-gray-200 rounded-2xl animate-pulse" />;

  const app = data.application;
  const act = data.activity;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      setData(await applyModerator(form));
      trackEvent('moderator_opt_in');
    } catch (err) {
      setError(err.message || 'Could not save your application.');
    } finally { setBusy(false); }
  }

  if (data.is_moderator) {
    return (
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-2xl p-6">
        <p className="text-2xl font-bold flex items-center gap-2"><BadgeCheck className="w-6 h-6" /> You are a moderator</p>
        <p className="mt-2 text-white/90">Thank you for helping run SSBCircle. Keep hosting, helping and reporting — the community counts on you.</p>
      </div>
    );
  }

  if (app && ['trial', 'invited'].includes(app.status)) {
    const daysLeft = Math.max(0, Math.ceil((new Date(app.trial_ends_at) - Date.now()) / 86400000));
    return (
      <div className="bg-white border border-brand-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{app.status === 'invited' ? 'You were invited' : 'Your trial is on'}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Trial complete — under review'}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 tabular-nums">{act.score}</p>
            <p className="text-xs text-gray-500">activity score</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {TARGET_ROWS.map(t => <Progress key={t.key} label={t.label} value={act[t.key] ?? 0} target={data.targets[t.key]} />)}
        </div>
        <p className={`mt-5 text-sm rounded-xl px-4 py-3 ${act.on_track ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-700'}`}>
          {act.on_track ? 'You have met every target. Keep it up — the officers will review your trial.' : 'Host sessions, answer doubts and visit most days to hit the targets. Quality matters as much as numbers.'}
        </p>
        <button type="button" onClick={async () => { if (window.confirm('Leave the programme? You can opt in again later.')) setData(await withdrawModerator()); }}
          className="mt-3 text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">Withdraw</button>
      </div>
    );
  }

  if (app && app.status === 'review') {
    return <div className="bg-white border border-gray-200 rounded-2xl p-6"><p className="text-lg font-bold text-gray-900">Under review</p><p className="text-sm text-gray-600 mt-1">The founding officers are reviewing your trial. We will contact you soon.</p></div>;
  }

  const again = app && ['declined', 'withdrawn', 'removed'].includes(app.status);

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        {app?.status === 'interested' && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            We have your interest from when you joined, and the team will reach out. Want to start sooner? Opt in below to begin your two-week trial now.
          </p>
        )}
        <p className="text-lg font-bold text-gray-900">{again ? 'Opt in again' : 'Opt in to the programme'}</p>
        <p className="text-sm text-gray-500 mt-1">
          {again && app.status === 'declined' ? 'Not this time — but keep helping and try again. ' : ''}
          Your 14-day trial starts the moment you opt in.
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700">
        Your last 14 days: <span className="font-bold">{act.score}</span> points · {act.hosted} sessions hosted · {act.replies} replies · {act.active_days} active days
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-800 mb-1.5">Why do you want to be a moderator?</span>
        <textarea rows={4} maxLength={1500} value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
          placeholder="What you would like to do for the community, and any experience leading or helping others."
          className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-brand-400" />
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-gray-800 mb-1.5">When are you usually free?</span>
        <input maxLength={200} value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
          placeholder="e.g. Weekdays after 8 PM, Sunday mornings"
          className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-400" />
      </label>
      {error && <p className="text-sm text-red-600 flex items-start gap-1.5"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</p>}
      <button type="submit" disabled={busy} className="btn-primary text-sm px-6 py-2.5">{busy ? 'Saving…' : 'Start my 2-week trial'}</button>
    </form>
  );
}

export default function ModeratorProgram() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const jump = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />

      <CoverBand deco={[Users, BadgeCheck, Award]} />
      <header className="max-w-5xl mx-auto px-4 sm:px-6">
        <PageHead icon={ShieldCheck} eyebrow="Moderator Programme" title="Lead the community. Get recognised and paid for it."
          subtitle="Active members who host sessions, help others and keep SSBCircle safe can become moderators — with a monthly stipend, a MOD badge and direct access to the founding officers.">
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => { jump('opt-in'); trackEvent('moderator_cta'); }}
              className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2">
              Opt in now <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => jump('how')} className="btn-secondary text-sm px-6 py-3">
              How it works
            </button>
          </div>
        </PageHead>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Perks */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PERKS.map(p => {
            const Icon = ICONS[p.icon];
            return (
              <div key={p.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <p className="mt-3 text-base font-bold text-gray-900">{p.title}</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </section>

        {/* Duties + who */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
            <p className="text-lg font-bold text-gray-900">What moderators do</p>
            <ul className="mt-3 space-y-2.5">
              {DUTIES.map(d => <li key={d} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{d}</li>)}
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
            <p className="text-lg font-bold text-gray-900">Who can apply</p>
            <ul className="mt-3 space-y-2.5">
              {WHO_CAN_APPLY.map(d => <li key={d} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed"><Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />{d}</li>)}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20">
          <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative bg-white border border-gray-200 rounded-2xl p-5">
                <span className="w-9 h-9 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                <p className="mt-3 text-base font-bold text-gray-900">{s.title}</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{s.text}</p>
                {i < STEPS.length - 1 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 bg-gray-50 rounded-full" />}
              </div>
            ))}
          </div>
        </section>

        {/* Scoring */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
            <p className="text-lg font-bold text-gray-900">How activity is counted</p>
            <p className="text-sm text-gray-500 mt-1">The same rules for everyone. Fully automatic.</p>
            <div className="mt-4 divide-y divide-gray-100">
              {SCORE_ROWS.map(r => (
                <div key={r.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-gray-700">{r.label}</span>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">{r.points}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
            <p className="text-lg font-bold text-gray-900">Trial targets (14 days)</p>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex justify-between"><span>Sessions hosted</span><span className="font-bold">2 or more</span></li>
              <li className="flex justify-between"><span>Helpful replies</span><span className="font-bold">8 or more</span></li>
              <li className="flex justify-between"><span>Active days</span><span className="font-bold">7 or more</span></li>
              <li className="flex justify-between"><span>Activity score</span><span className="font-bold">60 or more</span></li>
            </ul>
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">Targets get you noticed. The officers also look at the quality of your help and how you treat people.</p>
          </div>
        </section>

        {/* Scouting */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 sm:p-8">
          <Eye className="absolute -right-6 -top-6 w-32 h-32 text-amber-200/70" strokeWidth={1} aria-hidden="true" />
          <p className="relative text-xl font-bold text-gray-900">Did not opt in? We still notice.</p>
          <p className="relative mt-2 text-base text-gray-700 leading-relaxed max-w-2xl">
            We look at activity across the whole platform, not only applicants. If you are already hosting sessions, helping others and
            looking after the community, the founding officers may call you directly to invite you in.
          </p>
        </section>

        {/* Opt in */}
        <section id="opt-in" className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900">Ready to lead?</h2>
            <p className="mt-2 text-base text-gray-600 leading-relaxed">Opt in, then spend the next two weeks doing what good moderators do. Your progress shows here, live.</p>
            <p className="mt-3 text-sm text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Takes two minutes</p>
          </div>
          <div className="lg:col-span-3"><StatusCard user={user} /></div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {FAQ.map((f, i) => (
              <div key={f.q}>
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer">
                  <span className="text-base font-semibold text-gray-900">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-4 -mt-1 text-sm text-gray-600 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
