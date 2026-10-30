import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPrepProgress } from '../services/api';
import { STEPS, TOPICS } from '../data/prepSheet';
import { themeFor } from './prep/stepThemes';
import { todayIST, addDays, streak } from './prep/dates';
import Heatmap from './prep/Heatmap';
import { trackEvent } from '../analytics';

// The Prep Sheet on the home page, kept to one compact card: what it is, its
// nine sections as a row of icons, and the case for daily practice — two small
// streak calendars, steady against cramming.
//
// Those two calendars are drawn, not taken from real aspirants, so they are
// labelled as approaches ("the recommended way", "last-minute cramming"), never
// as a particular candidate's record. Do not caption them as real recommended
// or not-recommended candidates — we have no such data. If real calendars are
// ever shared with consent, they can replace these under the person's name.

const WEEKS = 12;

// Deterministic per-day noise, so the illustration does not change on reload
function noise(day, salt) {
  let h = 2166136261 ^ salt;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return (h % 1000) / 1000;
}

function illustration(kind, today) {
  const out = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const day = addDays(today, -i);
    const r = noise(day, kind === 'steady' ? 7 : 13);
    let actions = 0;
    if (kind === 'steady') actions = r < 0.12 ? 0 : 1 + Math.floor(r * 6);   // most days, a little
    else if (i < 14) actions = r < 0.1 ? 0 : 5 + Math.floor(r * 4);         // the last two weeks, a lot
    else actions = r < 0.07 ? 1 : 0;                                        // before that, almost nothing
    if (actions) out.push({ day, actions });
  }
  return out;
}

export default function HomePrepSheet() {
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const today = todayIST();

  useEffect(() => {
    if (!user) { setActivity(null); return; }
    let cancelled = false;
    getPrepProgress().then(d => { if (!cancelled) setActivity(d.activity || []); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const myStreak = activity ? streak(activity, today) : null;

  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-5 sm:p-7 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* What it is */}
        <div className="md:col-span-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">SSB Prep Sheet</p>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900">Know a little about everything</h2>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
            {TOPICS.length} topics for your GD, lecturette and interview. Learn the basics, form your own view, say it out loud.
          </p>

          {/* The nine sections, as a row of their icons */}
          <div className="mt-4 flex flex-wrap gap-1 sm:gap-1.5" aria-label={`${STEPS.length} sections`}>
            {STEPS.map(step => {
              const t = themeFor(step.id);
              const Icon = t.icon;
              return (
                <span key={step.id} title={step.title}
                  className={`w-[30px] h-[30px] sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border border-white shadow-sm ${t.soft} ${t.text}`}>
                  <Icon className="w-4 h-4" />
                </span>
              );
            })}
          </div>

          <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Made with SSB ex-assessors and recommended candidates.
          </p>

          <div className="mt-4">
            <Link to="/prep" onClick={() => trackEvent('home_prep_open')}
              className="inline-flex items-center gap-2 btn-primary text-sm px-5 py-2.5">
              Open the Prep Sheet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Why daily practice */}
        <div className="md:col-span-2 rounded-2xl bg-white border border-gray-200 p-4">
          <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> The most disciplined make it</p>
          <p className="mt-0.5 text-xs text-gray-500">Personality is not built in a day.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[['✓ The recommended way', illustration('steady', today), 'text-emerald-700'], ['✗ Last-minute cramming', illustration('cramming', today), 'text-gray-500']].map(([label, data, ink]) => (
              <div key={label} className="min-w-0">
                <p className={`text-[11px] font-semibold mb-1 ${ink}`}>{label}</p>
                <Heatmap activity={data} weeks={WEEKS} today={today} maxCell={7} />
              </div>
            ))}
          </div>
          {myStreak !== null && (
            <p className="mt-3 pt-3 border-t border-gray-100 text-xs font-semibold text-orange-600 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Your streak: {myStreak} day{myStreak === 1 ? '' : 's'} in a row
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
