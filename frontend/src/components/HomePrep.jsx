import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPiq, getTat, getPrepProgress } from '../services/api';
import { todayIST, addDays, streak } from './prep/dates';
import { trackEvent } from '../analytics';
import { firstName } from './Hello';
import {
  FileText, PenLine, BookOpen, Radio, ArrowRight, Check, Eye, Users, Mic, Brain,
  Image as ImageIcon, ListChecks, Lightbulb, Flag, Mountain, MessageCircle, Trophy, Flame,
} from 'lucide-react';

// Two home-page blocks that answer "where do I start?".
//
// PrepPath is a short, ordered path through the tools. For a signed-in
// aspirant it also shows where they are on it — what they have done and the
// one thing to do next — so a returning visitor picks up where they left off
// instead of facing the whole site again. The Prep Sheet step is daily: it
// shows the streak and this week's days, and becomes "next" again each day
// until that day's practice is done, so the card keeps a reason to come back.
//
// SsbStages maps the real SSB (screening, psychology, GTO, interview) to what
// the site offers for each, so it reads as prep for the whole board, not GD.

export function PrepPath({ user, liveCount = 0 }) {
  const [status, setStatus] = useState({});

  useEffect(() => {
    if (!user) { setStatus({}); return; }
    let cancelled = false;
    Promise.allSettled([getPiq(), getTat(), getPrepProgress()]).then(([piq, tat, prep]) => {
      if (cancelled) return;
      const p = piq.value || {};
      const filled = p.piq && Object.keys(p.piq).length > 3;
      const today = todayIST();
      const activity = prep.value?.activity || [];
      const active = new Set(activity.map(a => a.day));
      setStatus({
        prepStreak: streak(activity, today),
        prepToday: active.has(today),
        // Monday-to-today of this week, for the little row of squares
        week: Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map(d => active.has(d)),
        piq: p.analysis ? 'Report ready' : filled ? 'Filled — get your report' : null,
        piqDone: !!p.analysis,
        tat: tat.value?.attempts?.length ? `${tat.value.attempts.length} ${tat.value.attempts.length === 1 ? 'story' : 'stories'} written` : null,
        tatDone: (tat.value?.attempts?.length || 0) > 0,
      });
    });
    return () => { cancelled = true; };
  }, [user]);

  const streakText = status.prepToday
    ? `Done today · ${status.prepStreak}-day streak`
    : status.prepStreak ? `${status.prepStreak}-day streak — keep it alive today` : status.week ? 'Start your streak today' : null;
  const steps = [
    { to: '/piq',             icon: FileText, title: 'Know yourself',     desc: 'Fill your PIQ and see what your IO will ask', status: status.piq, done: status.piqDone },
    { to: '/tat',             icon: PenLine,  title: 'Write a TAT story', desc: 'See a picture, write in 4 minutes, get feedback', status: status.tat, done: status.tatDone },
    { to: '/prep',            icon: ListChecks, title: 'Daily Prep Sheet', desc: 'A topic or two a day — build your streak', status: streakText, done: status.prepToday, daily: true },
    { to: '/current-affairs', icon: BookOpen, title: 'Read a news card',  desc: 'Current affairs made simple for GD and PI' },
    { to: '/?tab=live',       icon: Radio,    title: 'Practise live',     desc: 'GD, PPDT and Lecturette with other aspirants', status: liveCount > 0 ? `${liveCount} live now` : null, rooms: true },
  ];
  const next = user ? steps.findIndex(s => !s.done) : 0;
  const doneCount = steps.filter(s => s.done).length;   // PIQ, TAT and today's practice
  const KEY_STEPS = 3;

  function scrollRooms(e) {
    e.preventDefault();
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{user ? `${firstName(user)}'s SSB prep` : 'Your SSB prep path'}</p>
          <p className="text-xs text-gray-500">{user ? `${doneCount} of ${KEY_STEPS} done today` : 'Five steps. Start with the first.'}</p>
        </div>
        {user && (
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(doneCount / KEY_STEPS) * 100}%` }} />
          </div>
        )}
      </div>

      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isNext = i === next;
          return (
            <li key={s.title}>
              <Link to={s.to} onClick={e => { trackEvent('home_path_click', { step: s.title, signed_in: !!user }); if (s.rooms) scrollRooms(e); }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isNext
                  ? 'border-brand-200 bg-brand-50 hover:bg-brand-100/60'
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.done ? 'bg-emerald-500' : isNext ? 'bg-brand-600' : 'bg-gray-100'}`}>
                  {s.done ? <Check className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${isNext ? 'text-white' : 'text-gray-500'}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {s.title}
                    {isNext && <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand-700 bg-white border border-brand-200 px-1.5 py-0.5 rounded-full">{user ? 'Next' : 'Start here'}</span>}
                  </p>
                  <p className={`text-xs truncate flex items-center gap-1 ${s.daily && status.prepStreak ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                    {s.daily && status.prepStreak > 0 && <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{s.status || s.desc}</span>
                  </p>
                </div>
                {s.daily && status.week && (
                  <span className="hidden xs:flex gap-[3px] shrink-0" title="Practice this week" aria-hidden="true">
                    {status.week.map((on, k) => (
                      <span key={k} className={`w-2 h-2 rounded-[2px] ${on ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    ))}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 shrink-0 transition-colors" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Each stage says when it happens, what it is in one sentence, and one clear
// way to practise it here. Link labels say exactly where they go — an earlier
// version labelled TAT practice "picture story practice" under Screening, and
// readers took it for PPDT.
//
// Drawn as a journey: each stage has its own colour and an illustrated band
// (its icon, with smaller themed icons around it), arrows join the stages on
// wide screens, and the conference on Day 5 is the finish line. Colours stay
// soft — light tints with a coloured accent — so the section reads calm and
// professional rather than loud. Class strings are written out in full so
// Tailwind keeps them.
const STAGES = [
  {
    day: 'Day 1', icon: Eye, deco: [ImageIcon, ListChecks], title: 'Screening',
    band: 'bg-sky-50 border-sky-100', ink: 'text-sky-600', faint: 'text-sky-200', soft: 'bg-sky-50 hover:bg-sky-100 text-sky-800',
    what: 'A short reasoning test (OIR), then a picture story you write and discuss with your group (PPDT). Most candidates are sent home here.',
    main: { to: '/?tab=live', label: 'Practise PPDT with others', rooms: true },
    more: { to: '/tat', label: 'Write picture stories' },
  },
  {
    day: 'Day 2', icon: Brain, deco: [PenLine, Lightbulb], title: 'Psychology tests',
    band: 'bg-violet-50 border-violet-100', ink: 'text-violet-600', faint: 'text-violet-200', soft: 'bg-violet-50 hover:bg-violet-100 text-violet-800',
    what: 'Quick-fire writing: TAT stories, word and situation tests, and a self-description. It shows how you really think.',
    main: { to: '/tat', label: 'Write a TAT story, get feedback' },
    soon: 'Word and situation tests coming soon',
  },
  {
    day: 'Days 3–4', icon: Users, deco: [Flag, Mountain], title: 'Group tasks (GTO)',
    band: 'bg-emerald-50 border-emerald-100', ink: 'text-emerald-600', faint: 'text-emerald-200', soft: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800',
    what: 'Group discussions, a lecturette, planning and outdoor tasks. It tests how you work with a group and lead it.',
    main: { to: '/?tab=live', label: 'Join a live GD or lecturette', rooms: true },
    more: { to: '/current-affairs', label: 'GD topics in News Cards' },
  },
  {
    day: 'Days 2–4', icon: Mic, deco: [MessageCircle, FileText], title: 'Interview',
    band: 'bg-amber-50 border-amber-100', ink: 'text-amber-600', faint: 'text-amber-200', soft: 'bg-amber-50 hover:bg-amber-100 text-amber-900',
    what: 'One evening, a one-to-one talk with an officer, built on your own PIQ form. Know your life story and answer honestly.',
    main: { to: '/piq', label: 'Get your PIQ analysed' },
    more: { to: '/prep', label: 'Practise answers in the Prep Sheet' },
  },
];

export function SsbStages() {
  function onLink(e, l) {
    trackEvent('home_stage_click', { to: l.to, label: l.label });
    if (!l.rooms) return;
    e.preventDefault();
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="border-t border-gray-100 bg-slate-50 px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">The whole board, not just GD</p>
        <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900">Prepare for every stage of the SSB</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6 max-w-2xl">
          Five days at the Selection Board. Here is what each stage tests, and how to practise it on SSBCircle.
        </p>

        {/* Day strip: the five days at a glance, coloured by stage */}
        <div className="hidden sm:flex items-center gap-1.5 mb-4" aria-hidden="true">
          {[['Day 1', 'bg-sky-300'], ['Day 2', 'bg-violet-300'], ['Day 3', 'bg-emerald-300'], ['Day 4', 'bg-emerald-300'], ['Day 5', 'bg-slate-400']].map(([d, c]) => (
            <div key={d} className="flex-1">
              <div className={`h-1.5 rounded-full ${c}`} />
              <p className="mt-1 text-[11px] font-semibold text-gray-400">{d}</p>
            </div>
          ))}
        </div>

        <ol className="m-rail sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map(({ day, icon: Icon, deco: [A, B], title, band, ink, faint, soft, what, main, more, soon }, i) => (
            <li key={title} className="relative flex">
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                {/* Illustrated band */}
                <div className={`relative h-24 border-b ${band} overflow-hidden`}>
                  <A className={`absolute right-12 top-3 w-8 h-8 -rotate-12 ${faint}`} strokeWidth={1.5} aria-hidden="true" />
                  <B className={`absolute right-3 bottom-2 w-10 h-10 rotate-6 ${faint}`} strokeWidth={1.5} aria-hidden="true" />
                  <span className={`absolute left-4 top-3 text-[11px] font-bold uppercase tracking-wide bg-white border border-gray-200 px-2 py-0.5 rounded-full ${ink}`}>{day}</span>
                  <span className={`absolute left-4 bottom-3 w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center ${ink}`}>
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className={`absolute left-[4.25rem] bottom-3 text-3xl font-black leading-none ${faint}`}>0{i + 1}</span>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 leading-tight">{title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed flex-1">{what}</p>
                  <Link to={main.to} onClick={e => onLink(e, main)}
                    className={`mt-4 inline-flex items-center justify-between gap-2 text-sm font-semibold rounded-xl px-3.5 py-2.5 transition-colors ${soft}`}>
                    {main.label} <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                  <div className="mt-2 min-h-[2.25rem] px-1">
                    {more && (
                      <Link to={more.to} onClick={e => onLink(e, more)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800">
                        {more.label} <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {soon && <p className="text-xs text-gray-400">{soon}</p>}
                  </div>
                </div>
              </div>

              {/* Arrow to the next stage, wide screens */}
              {i < STAGES.length - 1 && (
                <span className="hidden lg:flex absolute -right-[13px] top-10 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center" aria-hidden="true">
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </span>
              )}
            </li>
          ))}
        </ol>

        {/* Day 5: the finish line */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3.5">
          <span className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0"><Trophy className="w-5 h-5 text-amber-500" /></span>
          <p className="text-sm leading-snug">
            <span className="font-bold text-gray-900">Day 5 · Conference.</span>{' '}
            <span className="text-gray-600">All the assessors meet you once more, and results come the same day. Nothing extra to prepare — be yourself.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
