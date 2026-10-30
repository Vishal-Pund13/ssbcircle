import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Flame, Mic, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPrepProgress } from '../services/api';
import { STEPS, TOPICS } from '../data/prepSheet';
import { themeFor } from './prep/stepThemes';
import { todayIST, addDays, streak, topicOfTheDay } from './prep/plan';
import Heatmap, { HeatmapLegend } from './prep/Heatmap';
import { trackEvent } from '../analytics';

// The Prep Sheet on the home page: a taste of its sections, today's topic,
// and the case for daily practice — a streak calendar, set against two
// illustrative ones.
//
// The two comparison calendars are drawn, not taken from real aspirants: we
// have no such data, and presenting made-up activity as someone's would be a
// false claim. They are labelled as an illustration on the page. If real
// calendars are ever shared with consent, they can replace these.

const WEEKS = 15;
const SHOWN_SECTIONS = 6;

// Deterministic per-day noise, so the illustration does not change on reload
function noise(day, salt) {
  let h = 2166136261 ^ salt;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return (h % 1000) / 1000;
}

function illustration(kind, today) {
  const days = WEEKS * 7;
  const out = [];
  for (let i = 0; i < days; i++) {
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

  const totd = topicOfTheDay(today);
  const myStreak = activity ? streak(activity, today) : 0;
  const steady = illustration('steady', today);
  const cramming = illustration('cramming', today);

  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">SSB Prep Sheet</p>
        <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900">Know a little about everything</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          {TOPICS.length} topics in {STEPS.length} sections for your GD, lecturette and interview. Learn the basics of each, form your own view, and say it out loud.
        </p>
        <p className="mt-3 inline-flex items-start gap-1.5 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-px" />
          Made with SSB ex-assessors and recommended candidates, and kept up to date with current trends.
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Sections and today's topic */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STEPS.slice(0, SHOWN_SECTIONS).map(step => {
                const t = themeFor(step.id);
                const Icon = t.icon;
                const all = step.groups.flatMap(g => g.topics);
                const sample = (all.find(x => x.level === 'must') || all[0])?.ask;
                return (
                  <Link key={step.id} to="/prep" state={{ step: step.id }}
                    onClick={() => trackEvent('home_prep_section', { step: step.id })}
                    className="text-left rounded-2xl border border-gray-200 bg-white p-3 flex flex-col hover:border-gray-300 hover:shadow-sm transition">
                    <span className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.soft} ${t.text}`}><Icon className="w-3.5 h-3.5" /></span>
                      <span className="text-[13px] font-bold text-gray-900 leading-tight">{step.title}</span>
                    </span>
                    <span className="mt-2 text-xs text-gray-600 leading-snug italic line-clamp-2">"{sample}"</span>
                    <span className="mt-auto pt-2 text-[11px] text-gray-400">{all.length} topics</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-3.5">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Topic of the day · {totd.title}</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">"{totd.ask}"</p>
              </div>
              <Link to="/prep" state={{ topic: totd.id }} onClick={() => trackEvent('home_prep_totd')}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-3 py-2">
                <Mic className="w-3.5 h-3.5" /> Speak
              </Link>
            </div>

            <Link to="/prep" onClick={() => trackEvent('home_prep_open')}
              className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-primary text-sm px-5 py-3">
              Open the Prep Sheet · all {STEPS.length} sections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Discipline */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
            <p className="text-base font-bold text-gray-900 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> The most disciplined make it</p>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              Personality development is not a one-day result. Officer-like qualities grow from a little practice every day — not a rush in the last two weeks.
            </p>

            {user && activity && (
              <div className="mt-4 rounded-xl bg-white border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-900">Your last {WEEKS} weeks</p>
                  <p className="text-xs font-semibold text-orange-600 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {myStreak} day{myStreak === 1 ? '' : 's'} in a row</p>
                </div>
                <Heatmap activity={activity} weeks={WEEKS} today={today} />
              </div>
            )}

            <div className="mt-4 space-y-3">
              {[['Steady daily practice', steady, 'text-emerald-700'], ['Cramming in the last two weeks', cramming, 'text-gray-500']].map(([label, data, ink]) => (
                <div key={label}>
                  <p className={`text-xs font-semibold mb-1.5 ${ink}`}>{label}</p>
                  <Heatmap activity={data} weeks={WEEKS} today={today} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[11px] text-gray-400">Illustration, not real aspirants' data.</p>
              <HeatmapLegend />
            </div>

            {!user && (
              <Link to="/register" onClick={() => trackEvent('home_prep_streak_signup')}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-700 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5">
                Start your own streak — free <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
