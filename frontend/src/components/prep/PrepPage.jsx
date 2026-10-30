import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star, Check, Mic, Flame, ShieldCheck, Calendar, ChevronDown, ChevronLeft, ChevronRight, Search, BookOpen,
  StickyNote, RotateCcw, Target, Radio, AlertCircle, X, Sparkles, ListChecks, Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPrepProgress, savePrepTopic, reviewPrepTopic, updateSsbDate } from '../../services/api';
import { STEPS, TOPICS, TOPIC_BY_ID, LEVELS, ANSWER, answerOf } from '../../data/prepSheet';
import { articleHref } from '../../data/swipeArticles';
import SpeakPanel, { Feedback } from './SpeakPanel';
import SiteNav from '../SiteNav';
import { themeFor } from './stepThemes';
import { todayIST, addDays, buildPlan, dueReviews, streak, topicOfTheDay } from './plan';

// The SSB Prep Sheet: every topic worth being able to talk about, in order,
// with a two-stage tick per topic — "Read" and "Can speak". Reading is the easy
// half. The board never asks what you read; it hears what you can say, so a
// topic is only done once you have answered its question out loud.
//
// Laid out like a notebook: a contents list of sections, one section open at
// a time with its own cover, and topics as checklist rows that open in place.
//
// The sheet is public. Progress, the plan, revision and the streak need an
// account, because they are saved server-side.

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'must',    label: 'Must know' },
  { id: 'todo',    label: 'Not started' },
  { id: 'starred', label: 'Starred' },
];

const STATUS_LABEL = ['Not started', 'Read', 'Can speak'];
const LEVEL_DOT = { must: 'bg-red-500', good: 'bg-amber-400', deep: 'bg-sky-400' };

function ProgressBar({ read, spoken, total, className = '' }) {
  const s = total ? (spoken / total) * 100 : 0;
  const r = total ? (read / total) * 100 : 0;
  return (
    <div className={`h-2 bg-gray-100 rounded-full overflow-hidden flex ${className}`}>
      <div className="h-full bg-emerald-500" style={{ width: `${s}%` }} />
      <div className="h-full bg-emerald-200" style={{ width: `${r}%` }} />
    </div>
  );
}

function LevelBadge({ level }) {
  const l = LEVELS[level];
  return (
    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${l.className}`}>{l.short}</span>
  );
}

function LevelDot({ level }) {
  return (
    <span title={LEVELS[level].label} className="inline-flex items-center gap-1.5 shrink-0">
      <span className={`w-2 h-2 rounded-full ${LEVEL_DOT[level]}`} />
      <span className="hidden md:inline text-[12px] text-gray-400">{LEVELS[level].short}</span>
    </span>
  );
}

// Progress ring: spoken in full colour, read in a lighter band behind it
function Ring({ spoken, read, total, size = 72 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r;
  const s = total ? spoken / total : 0, rd = total ? (spoken + read) / total : 0;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#a7f3d0" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${rd * c} ${c}`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${s * c} ${c}`} />
    </svg>
  );
}

// Last 18 weeks, one column per week, Monday at the top.
function Heatmap({ activity }) {
  const today = todayIST();
  const counts = Object.fromEntries(activity.map(a => [a.day, a.actions]));
  const dow = (new Date(today + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const start = addDays(today, -(17 * 7 + dow));
  const weeks = Array.from({ length: 18 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  const shade = n => !n ? 'bg-gray-100' : n < 3 ? 'bg-emerald-200' : n < 6 ? 'bg-emerald-400' : 'bg-emerald-600';
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] w-max">
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map(day => (
              <div key={day} title={day > today ? '' : `${day}: ${counts[day] || 0} updates`}
                className={`w-2.5 h-2.5 rounded-[2px] ${day > today ? 'bg-transparent' : shade(counts[day])}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LastAttempt({ attempt }) {
  const [show, setShow] = useState(false);
  const f = attempt.feedback || {};
  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-xl">
      <button type="button" onClick={() => setShow(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left cursor-pointer">
        <Sparkles className="w-3.5 h-3.5 text-brand-600" />
        <span className="text-xs font-bold text-gray-700">Your last attempt</span>
        <span className="text-xs text-gray-500 tabular-nums">· {f.score}/10</span>
        <span className="text-[12px] text-gray-400">· {new Date(attempt.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>
      {show && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <Feedback feedback={f} seconds={attempt.seconds} words={attempt.words} />
          <p className="mt-4 text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1">What you said</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{attempt.transcript}</p>
        </div>
      )}
    </div>
  );
}

// A section's cover: its colour, and its themed icons scattered as the picture
function StepCover({ step, index, count, read, spoken, total }) {
  const t = themeFor(step.id);
  const Icon = t.icon;
  const [A, B, C] = t.deco;
  const pct = total ? Math.round((spoken / total) * 100) : 0;
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 ${t.soft} px-5 sm:px-7 py-5 sm:py-6`}>
      <div className={`absolute inset-y-0 right-0 w-1/2 pointer-events-none hidden sm:block ${t.text}`} aria-hidden="true">
        <Icon className="absolute -right-6 -bottom-8 w-44 h-44 opacity-[0.08]" strokeWidth={1.25} />
        <A className="absolute right-40 top-5 w-12 h-12 opacity-[0.15] -rotate-12" strokeWidth={1.5} />
        <B className="absolute right-12 top-6 w-9 h-9 opacity-[0.15] rotate-12" strokeWidth={1.5} />
        <C className="absolute right-56 bottom-6 w-8 h-8 opacity-[0.12] rotate-6" strokeWidth={1.5} />
      </div>
      <div className="relative">
        <p className={`text-[11px] font-bold uppercase tracking-[0.25em] ${t.text}`}>Section {index + 1} of {count}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className={`w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 ${t.text}`}>
            <Icon className="w-5 h-5" />
          </span>
          <h2 className="text-xl sm:text-2xl font-bold leading-tight text-gray-900">{step.title}</h2>
        </div>
        <p className="mt-2 text-sm text-gray-600 max-w-md leading-relaxed">{step.blurb}</p>
        <div className="mt-4 max-w-xs">
          <div className="flex items-center justify-between text-[12px] text-gray-600">
            <span>{spoken} of {total} can speak{read ? ` · ${read} read` : ''}</span>
            <span className="font-bold text-gray-900">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-white rounded-full overflow-hidden border border-gray-200/70">
            <div className={`h-full ${t.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicRow({ topic, p, open, speaking, serverStt, theme, onToggle, onStatus, onStar, onNote, onSpeak, onSaved }) {
  const status = p?.status || 0;
  const [note, setNote] = useState(p?.note || '');
  useEffect(() => { setNote(p?.note || ''); }, [p?.note]);

  return (
    <li id={`topic-${topic.id}`} className="scroll-mt-20">
      <div className={`group flex items-start gap-2 sm:gap-3 px-1 sm:px-3 py-2 rounded-xl transition-colors ${open ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
        {/* Checkbox: ticks "Read". Filled green once you can speak on it. The
            padding gives a thumb-sized target around a small box. */}
        <button type="button" onClick={() => onStatus(status >= 1 ? 0 : 1)}
          title={status >= 1 ? 'Mark as not started' : 'Mark as read'} aria-label={STATUS_LABEL[status]}
          className="p-2 -m-0.5 shrink-0 cursor-pointer">
          <span className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-colors ${status === 2
            ? 'bg-emerald-500 border-emerald-500' : status === 1 ? 'bg-emerald-100 border-emerald-400' : 'border-gray-300 hover:border-gray-400 bg-white'}`}>
            {status >= 1 && <Check className={`w-3.5 h-3.5 ${status === 2 ? 'text-white' : 'text-emerald-600'}`} strokeWidth={3} />}
          </span>
        </button>

        <button type="button" onClick={onToggle} aria-expanded={open} className="flex-1 min-w-0 text-left cursor-pointer py-1.5">
          <span className={`block text-[15px] leading-snug ${status === 2 ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900 font-medium'}`}>
            {topic.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[topic.level]}`} />{LEVELS[topic.level].label}</span>
            <span className="text-gray-300">·</span>
            <span>{ANSWER[answerOf(topic)].label}</span>
            {p?.note && <StickyNote className="w-3.5 h-3.5 text-amber-400" aria-label="Has notes" />}
            {p?.starred && <Star className="sm:hidden w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-label="Starred" />}
          </span>
        </button>

        <span className="hidden lg:flex gap-1 shrink-0 mt-2">
          {topic.tests.map(t => (
            <span key={t} className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{t}</span>
          ))}
        </span>

        <button type="button" onClick={() => (status === 2 ? onStatus(1) : onSpeak(true))}
          title={status === 2 ? 'You can speak on this. Click to move back to read.' : `Answer out loud (${ANSWER[answerOf(topic)].label.toLowerCase()}) and get feedback`}
          aria-label={status === 2 ? 'Can speak' : 'Speak your answer'}
          className={`shrink-0 mt-1 inline-flex items-center justify-center gap-1 w-10 h-10 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1 text-[12px] font-semibold rounded-full border cursor-pointer transition-colors ${status === 2
            ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 bg-white'}`}>
          <Mic className="w-4 h-4 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">{status === 2 ? 'Can speak' : 'Speak'}</span>
        </button>

        <button type="button" onClick={onStar} title={p?.starred ? 'Unstar' : 'Star for revision'}
          className={`hidden sm:inline-flex shrink-0 mt-2 cursor-pointer ${p?.starred ? '' : 'sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'}`}>
          <Star className={`w-4 h-4 ${p?.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'}`} />
        </button>
        <button type="button" onClick={onToggle} className="hidden sm:inline-flex shrink-0 mt-2 cursor-pointer" aria-label="Open topic">
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="sm:ml-[21px] px-1 sm:pl-6 sm:border-l-2 border-gray-100 pb-5 pt-2 mb-2">
          <ul className="space-y-1.5">
            {topic.points.map((pt, i) => (
              <li key={i} className="text-base text-gray-700 leading-relaxed flex gap-2.5">
                <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          {speaking ? (
            <SpeakPanel topic={topic} status={status} serverStt={serverStt}
              onSaved={onSaved}
              onMarkAnyway={() => { onStatus(2); onSpeak(false); }}
              onClose={() => onSpeak(false)} />
          ) : (
            <div className={`mt-4 ${theme.soft} rounded-xl p-4 flex gap-3`}>
              <span className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 ${theme.text}`}>
                <Mic className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className={`text-[12px] font-bold uppercase tracking-wide ${theme.text}`}>Say it out loud</p>
                <p className="mt-1 text-[15px] font-semibold text-gray-900 leading-snug">"{topic.ask}"</p>
                <p className="mt-1.5 text-sm text-gray-600">{ANSWER[answerOf(topic)].hint} Our AI tells you if you are ready.</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button type="button" onClick={() => onSpeak(true)} className="btn-primary text-xs px-3 py-2">
                    <Mic className="w-3.5 h-3.5" /> {p?.attempt ? 'Speak again' : 'Speak your answer'}
                  </button>
                  {topic.article && (
                    <Link to={articleHref(topic.article)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      <BookOpen className="w-3.5 h-3.5" /> Read our article
                    </Link>
                  )}
                  {topic.stepId === 'self' && (
                    <Link to="/piq" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      <StickyNote className="w-3.5 h-3.5" /> Fill this in your PIQ
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {p?.attempt && !speaking && <LastAttempt attempt={p.attempt} />}

          <button type="button" onClick={onStar}
            className="sm:hidden mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-full px-4 min-h-[40px] cursor-pointer">
            <Star className={`w-4 h-4 ${p?.starred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
            {p?.starred ? 'Starred for revision' : 'Star for revision'}
          </button>

          <label className="block mt-4">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5 text-amber-400" /> Your notes</span>
            <textarea rows={3} maxLength={2000} value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => { if (note !== (p?.note || '')) onNote(note); }}
              placeholder="Your own points, a fact you want to remember, a line you liked…"
              className="mt-1.5 w-full text-sm bg-amber-50/40 border border-dashed border-amber-200 rounded-xl px-3 py-2.5 resize-y focus:outline-none focus:border-amber-400 focus:bg-white" />
          </label>
        </div>
      )}
    </li>
  );
}

export default function PrepPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [progress, setProgress] = useState({});   // topic_id -> row
  const [activity, setActivity] = useState([]);
  const [loaded,   setLoaded]   = useState(false);
  const [error,    setError]    = useState('');

  const [filter,   setFilter]   = useState('all');
  const [query,    setQuery]    = useState('');
  const [openStep, setOpenStep] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const [speakTopic, setSpeakTopic] = useState(null);   // topic whose mic panel is open
  const [serverStt, setServerStt] = useState(false);     // Sarvam speech-to-text available?
  const [dateDraft, setDateDraft] = useState('');
  const errTimer = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoaded(true); return; }
    let cancelled = false;
    getPrepProgress()
      .then(({ progress: rows, activity: act, stt }) => {
        if (cancelled) return;
        setProgress(Object.fromEntries(rows.map(r => [r.topic_id, r])));
        setActivity(act);
        setServerStt(Boolean(stt));
      })
      .catch(() => { if (!cancelled) setError('Could not load your progress.'); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Open the first step that still has work in it, once progress is known.
  useEffect(() => {
    if (!loaded || openStep !== null) return;
    const first = STEPS.find(s => s.groups.some(g => g.topics.some(t => (progress[t.id]?.status || 0) < 2)));
    setOpenStep((first || STEPS[0]).id);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  function flash(msg) {
    setError(msg);
    clearTimeout(errTimer.current);
    errTimer.current = setTimeout(() => setError(''), 4000);
  }

  function requireUser() {
    if (user) return true;
    navigate('/login', { state: { from: location } });
    return false;
  }

  function bumpActivity() {
    const today = todayIST();
    setActivity(a => a.some(x => x.day === today)
      ? a.map(x => x.day === today ? { ...x, actions: x.actions + 1 } : x)
      : [...a, { day: today, actions: 1 }]);
  }

  // Optimistic: show the change at once, take the server's row when it
  // arrives (it holds the dates), put the old row back if it fails.
  async function save(topicId, patch) {
    if (!requireUser()) return;
    const before = progress[topicId];
    setProgress(p => ({ ...p, [topicId]: { ...(before || { topic_id: topicId, status: 0, starred: false, note: '' }), ...patch } }));
    if (patch.status) bumpActivity();   // same rule as the server: only forward moves count
    try {
      const row = await savePrepTopic(topicId, patch);
      setProgress(p => ({ ...p, [topicId]: row }));
    } catch (err) {
      setProgress(p => ({ ...p, [topicId]: before }));
      flash(err.message || 'Could not save.');
    }
  }

  async function review(topicId, recalled) {
    try {
      const row = await reviewPrepTopic(topicId, recalled);
      setProgress(p => ({ ...p, [topicId]: row }));
      bumpActivity();
    } catch (err) {
      flash(err.message || 'Could not save.');
    }
  }

  function practise(topic) {
    const category = topic.stepId === 'self' ? 'IO Practice' : 'GD';
    navigate('/create', { state: { prefill: {
      title: topic.title.slice(0, 100),
      description: category === 'GD'
        ? `GD on "${topic.ask}" — each of us gives both sides, then a clear view.`
        : `Mock interview round on: ${topic.ask}`,
      category,
      subcategory: topic.room || '',
    } } });
  }

  function speak(topicId, on) {
    if (on && !requireUser()) return;
    setSpeakTopic(on ? topicId : null);
    if (on) setOpenTopic(topicId);
  }

  // The feedback route returns the updated row (possibly now "can speak").
  function onSpoken(topicId, row) {
    setProgress(p => ({ ...p, [topicId]: row }));
    bumpActivity();
  }

  function jumpTo(topic, { speakNow = false } = {}) {
    if (speakNow) speak(topic.id, true);
    setFilter('all'); setQuery('');
    setOpenStep(topic.stepId);
    setOpenTopic(topic.id);
    setTimeout(() => document.getElementById(`topic-${topic.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function saveDate() {
    if (!dateDraft) return;
    try {
      await updateSsbDate(dateDraft);
      await refreshUser();
    } catch (err) {
      flash(err.message || 'Could not save the date.');
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const today = todayIST();
  const totals = useMemo(() => {
    const by = lvl => {
      const ts = lvl ? TOPICS.filter(t => t.level === lvl) : TOPICS;
      return {
        total: ts.length,
        read: ts.filter(t => progress[t.id]?.status === 1).length,
        spoken: ts.filter(t => progress[t.id]?.status === 2).length,
      };
    };
    return { all: by(), must: by('must'), good: by('good'), deep: by('deep') };
  }, [progress]);

  const plan = useMemo(() => buildPlan(progress, user?.ssb_date || null, today), [progress, user?.ssb_date, today]);
  const due = useMemo(() => dueReviews(progress, today), [progress, today]);
  const streakDays = streak(activity, today);
  const totd = topicOfTheDay(today);

  const q = query.trim().toLowerCase();
  const matches = t => {
    const p = progress[t.id];
    if (filter === 'must' && t.level !== 'must') return false;
    if (filter === 'todo' && (p?.status || 0) !== 0) return false;
    if (filter === 'starred' && !p?.starred) return false;
    if (q && !(t.title.toLowerCase().includes(q) || t.points.some(pt => pt.toLowerCase().includes(q)))) return false;
    return true;
  };
  const narrowing = filter !== 'all' || q !== '';

  const planTopics = [...plan.doneToday, ...plan.next];

  const stepStats = step => {
    const all = step.groups.flatMap(g => g.topics);
    return {
      all,
      total: all.length,
      read: all.filter(t => progress[t.id]?.status === 1).length,
      spoken: all.filter(t => progress[t.id]?.status === 2).length,
    };
  };
  const stepIndex = Math.max(0, STEPS.findIndex(s => s.id === openStep));
  const currentStep = STEPS[stepIndex];

  function selectStep(id) {
    setOpenStep(id);
    setOpenTopic(null);
    // Desktop: top of the sheet. Phones: past the section picker, to the
    // section itself.
    const target = window.matchMedia('(min-width: 1024px)').matches ? 'sheet' : 'section-open';
    setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  }

  const renderTopics = (topics, theme) => (
    <ul className="divide-y divide-gray-50 sm:divide-y-0 sm:space-y-0.5">
      {topics.map(t => {
        const topic = TOPIC_BY_ID[t.id];
        return (
          <TopicRow key={t.id} topic={topic} p={progress[t.id]} theme={theme}
            open={openTopic === t.id}
            speaking={speakTopic === t.id && openTopic === t.id}
            serverStt={serverStt}
            onToggle={() => setOpenTopic(openTopic === t.id ? null : t.id)}
            onStatus={s => save(t.id, { status: s })}
            onStar={() => save(t.id, { starred: !progress[t.id]?.starred })}
            onNote={note => save(t.id, { note })}
            onSpeak={on => speak(t.id, on)}
            onSaved={row => onSpoken(t.id, row)} />
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* ── Page cover ── */}
      <div className="relative h-20 sm:h-36 bg-gradient-to-r from-brand-50 via-slate-50 to-indigo-50 border-b border-gray-100 overflow-hidden">
        <div className="absolute right-6 sm:right-24 top-4 flex gap-6 opacity-[0.12] text-brand-600" aria-hidden="true">
          <BookOpen className="w-14 h-14 -rotate-6" strokeWidth={1.25} />
          <Mic className="w-10 h-10 mt-8 rotate-12" strokeWidth={1.25} />
          <Target className="w-12 h-12 mt-2" strokeWidth={1.25} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="-mt-7 sm:-mt-10 relative">
          <span className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center">
            <ListChecks className="w-7 h-7 sm:w-10 sm:h-10 text-brand-600" />
          </span>
        </div>
        <h1 className="mt-3 sm:mt-4 text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">SSB Prep Sheet</h1>
        <p className="mt-1.5 text-sm sm:text-[15px] text-gray-500 max-w-2xl leading-relaxed">
          {TOPICS.length} topics in {STEPS.length} sections, in the order worth learning them.
        </p>
        <p className="mt-2 inline-flex items-start gap-1.5 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-px" />
          Made with SSB ex-assessors and recommended candidates, and kept up to date with current trends.
        </p>

        {/* Why the sheet exists — one line, the thing to take away before the list */}
        <p className="mt-3 max-w-3xl flex items-start gap-2 text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-snug">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span><span className="font-semibold text-gray-900">Know a little about everything.</span> Any topic here can come up at your SSB — learn the basics and have your own view.</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><span className="w-[14px] h-[14px] rounded-[4px] bg-emerald-100 border-2 border-emerald-400" /> Read</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-[14px] h-[14px] rounded-[4px] bg-emerald-500" /> Can speak — answered out loud, no notes</span>
          <span className="hidden sm:contents">
            {['must', 'good', 'deep'].map(l => (
              <span key={l} className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${LEVEL_DOT[l]}`} /> {LEVELS[l].label}</span>
            ))}
          </span>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── Signed-out prompt ── */}
        {!authLoading && !user && (
          <div className="mt-6 bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-gray-900">Track your progress, get a daily plan, and never forget what you learnt.</p>
              <p className="text-sm text-gray-600 mt-1">Free. Sign in and your ticks, notes and revision are saved.</p>
            </div>
            <Link to="/login" state={{ from: location }} className="btn-primary text-sm px-5 py-2.5 text-center">
              Sign in to track
            </Link>
          </div>
        )}

        {/* ── Dashboard ── */}
        <div className={`mt-5 sm:mt-6 ${user ? 'm-rail md:grid-cols-3' : 'grid grid-cols-1'} md:gap-4`}>
          {user && (
            <section className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="relative">
                <Ring {...totals.all} />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900 tabular-nums">
                  {totals.all.total ? Math.round((totals.all.spoken / totals.all.total) * 100) : 0}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">Your progress</p>
                <p className="text-xs text-gray-500 mt-0.5">{totals.all.spoken} can speak · {totals.all.read} read · {totals.all.total} topics</p>
                <div className="mt-2.5 space-y-1">
                  {['must', 'good', 'deep'].map(l => (
                    <div key={l} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[l]}`} />
                      <ProgressBar {...totals[l]} className="flex-1 h-1.5" />
                      <span className="text-[11px] text-gray-400 tabular-nums w-9 text-right">{totals[l].spoken}/{totals[l].total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {user && (
            <section className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${streakDays ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <Flame className={`w-5 h-5 ${streakDays ? 'text-orange-500' : 'text-gray-300'}`} />
                </span>
                <div>
                  <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">{streakDays} <span className="text-xs font-medium text-gray-500">day{streakDays === 1 ? '' : 's'} in a row</span></p>
                  <p className="text-[12px] text-gray-400 mt-1">Any tick or revision counts</p>
                </div>
              </div>
              <div className="mt-3"><Heatmap activity={activity} /></div>
            </section>
          )}

          <section className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 ${user ? '' : 'md:col-span-3'}`}>
            <Lightbulb className="absolute -right-3 -top-3 w-20 h-20 text-amber-200/70" strokeWidth={1.25} aria-hidden="true" />
            <p className="relative text-[12px] font-bold text-amber-700 uppercase tracking-wide">Topic of the day</p>
            <p className="relative mt-2 text-base font-bold text-gray-900">{totd.title}</p>
            <p className="relative mt-1 text-sm text-gray-700">"{totd.ask}"</p>
            <div className="relative mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => jumpTo(totd, { speakNow: true })} className="btn-primary text-xs px-3 py-2">
                <Mic className="w-3.5 h-3.5" /> Speak on it
              </button>
              <button type="button" onClick={() => practise(totd)} className="btn-secondary text-xs px-3 py-2">
                <Radio className="w-3.5 h-3.5" /> GD room
              </button>
            </div>
          </section>
        </div>

        {/* ── Today's plan + revision ── */}
        {user && (
          <div className={`mt-4 grid grid-cols-1 ${due.length ? 'md:grid-cols-2' : ''} gap-4`}>
            <section className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-brand-600" /> Today's plan
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.daysLeft == null && 'Three topics a day. Add your SSB date and the plan fits itself to it.'}
                    {plan.daysLeft != null && plan.daysLeft > 0 && (
                      <>{plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'} to your SSB · {plan.remaining} topic{plan.remaining === 1 ? '' : 's'} left · {plan.perDay} a day
                        {plan.crunch && <span className="text-red-600 font-semibold"> · Crunch mode: must-know first, deep topics skipped</span>}</>
                    )}
                    {plan.daysLeft === 0 && 'Your SSB is today. No new topics — trust your preparation. All the best!'}
                    {plan.daysLeft != null && plan.daysLeft < 0 && 'Your SSB date has passed. Set your next date to get a new plan.'}
                  </p>
                </div>
                {plan.daysLeft != null && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                    <Calendar className="w-3 h-3" /> {user.ssb_date}
                  </span>
                )}
              </div>

              {(plan.daysLeft == null || plan.daysLeft < 0) && (
                <div className="mt-3 flex items-center gap-2">
                  <input type="date" min={addDays(today, 1)} value={dateDraft} onChange={e => setDateDraft(e.target.value)}
                    className="input-base text-sm w-auto py-1.5" />
                  <button type="button" onClick={saveDate} disabled={!dateDraft} className="btn-secondary text-xs py-1.5 px-3">
                    Set SSB date
                  </button>
                </div>
              )}

              {plan.daysLeft !== 0 && (
                <ul className="mt-3 space-y-0.5">
                  {planTopics.map(t => {
                    const done = plan.doneToday.includes(t);
                    const s = progress[t.id]?.status || 0;
                    return (
                      <li key={t.id}>
                        <button type="button" onClick={() => jumpTo(t)}
                          className="w-full flex items-center gap-3 text-left px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <span className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                            {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </span>
                          <span className={`flex-1 text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</span>
                          <span className="text-[11px] text-gray-400 hidden sm:inline">{t.stepTitle}</span>
                          {done && <span className="text-[11px] font-semibold text-emerald-600">{STATUS_LABEL[s]}</span>}
                          <LevelDot level={t.level} />
                        </button>
                      </li>
                    );
                  })}
                  {planTopics.length === 0 && (
                    <li className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
                      Every topic is at "Can speak". Keep up your revisions.
                    </li>
                  )}
                </ul>
              )}
            </section>

            {due.length > 0 && (
              <section className="bg-white border border-amber-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-500" /> Revision due · {due.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Answer the question out loud again. If it still flows, it comes back later. If not, tomorrow.
                </p>
                <ul className="mt-3 divide-y divide-gray-100">
                  {due.map(t => (
                    <li key={t.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                      <button type="button" onClick={() => jumpTo(t)} className="flex-1 text-left cursor-pointer">
                        <span className="block text-sm text-gray-800 hover:text-brand-600">{t.title}</span>
                        <span className="block text-xs text-gray-500">"{t.ask}"</span>
                      </button>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => review(t.id, true)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 cursor-pointer">
                          Still can
                        </button>
                        <button type="button" onClick={() => review(t.id, false)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 cursor-pointer">
                          Forgot
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* ── The sheet: contents on the left, one section open on the right ── */}
        <div id="sheet" className="scroll-mt-16 mt-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <p className="px-3 mb-2 text-[12px] font-bold uppercase tracking-widest text-gray-400">Contents</p>
              <nav className="space-y-0.5">
                {STEPS.map((step, i) => {
                  const st = stepStats(step);
                  const t = themeFor(step.id);
                  const Icon = t.icon;
                  const active = !narrowing && step.id === currentStep.id;
                  const done = st.spoken === st.total;
                  return (
                    <button key={step.id} type="button" onClick={() => { setFilter('all'); setQuery(''); selectStep(step.id); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left cursor-pointer transition-colors ${active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : `${t.soft} ${t.text}`}`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm truncate ${active ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{step.title}</span>
                        <span className="mt-1 block h-1 bg-gray-100 rounded-full overflow-hidden">
                          <span className={`block h-full ${t.bar}`} style={{ width: `${st.total ? (st.spoken / st.total) * 100 : 0}%` }} />
                        </span>
                      </span>
                      <span className="text-[11px] text-gray-400 tabular-nums">{st.spoken}/{st.total}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            {/* Smaller screens: every section in view at once, each teasing a
                real question from inside it. A strip of chips scrolling sideways
                hid most of them, and few people found the rest. */}
            <div id="sections" className="lg:hidden scroll-mt-16 mb-5">
              <p className="text-sm font-bold text-gray-900">{STEPS.length} sections <span className="font-normal text-gray-500">· tap one to see its questions</span></p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {STEPS.map(step => {
                  const t = themeFor(step.id);
                  const Icon = t.icon;
                  const st = stepStats(step);
                  const active = !narrowing && step.id === currentStep.id;
                  const sample = (st.all.find(x => x.level === 'must') || st.all[0])?.ask;
                  return (
                    <button key={step.id} type="button" onClick={() => { setFilter('all'); setQuery(''); selectStep(step.id); }}
                      aria-current={active ? 'true' : undefined}
                      className={`text-left rounded-2xl border p-3 flex flex-col cursor-pointer transition ${active ? `border-transparent ring-2 ${t.ring} ${t.soft}` : 'border-gray-200 bg-white active:bg-gray-50'}`}>
                      <span className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${st.spoken === st.total ? 'bg-emerald-500 text-white' : `${t.soft} ${t.text}`}`}>
                          {st.spoken === st.total ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
                        </span>
                        <span className="text-[13px] font-bold text-gray-900 leading-tight">{step.title}</span>
                      </span>
                      <span className="mt-2 text-xs text-gray-600 leading-snug italic line-clamp-2">"{sample}"</span>
                      <span className="mt-auto pt-2 text-[11px] text-gray-400 tabular-nums">
                        {st.total} topics{user && st.spoken ? ` · ${st.spoken} done` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all topics — e.g. China, UPI, Agnipath"
                  className="w-full text-sm bg-gray-50 border border-transparent rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:bg-white focus:border-gray-200" />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" aria-label="Clear">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {FILTERS.map(f => (
                  <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                    className={`shrink-0 text-xs font-semibold px-3 min-h-[36px] rounded-lg cursor-pointer ${filter === f.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results across every section while searching or filtering */}
            {narrowing && (
              <div className="mt-5 space-y-6">
                {STEPS.map(step => {
                  const shown = stepStats(step).all.filter(matches);
                  if (!shown.length) return null;
                  const t = themeFor(step.id);
                  const Icon = t.icon;
                  return (
                    <div key={step.id}>
                      <p className={`px-2 mb-1.5 text-sm font-bold flex items-center gap-2 ${t.text}`}>
                        <Icon className="w-4 h-4" /> {step.title} <span className="text-xs font-normal text-gray-400">{shown.length}</span>
                      </p>
                      {renderTopics(shown, t)}
                    </div>
                  );
                })}
                {!TOPICS.some(matches) && (
                  <p className="text-sm text-gray-500 text-center py-10">No topics match. Try another word or filter.</p>
                )}
              </div>
            )}

            {/* One section, like an open page */}
            {!narrowing && currentStep && (() => {
              const st = stepStats(currentStep);
              const t = themeFor(currentStep.id);
              const CurIcon = t.icon;
              return (
                <div className="mt-5">
                  <div className="lg:hidden sticky top-14 z-20 -mx-4 px-4 py-2 mb-3 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.soft} ${t.text}`}><CurIcon className="w-3.5 h-3.5" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-900 truncate">{currentStep.title}</span>
                      <span className="block text-[11px] text-gray-500">Section {stepIndex + 1} of {STEPS.length}</span>
                    </span>
                    <button type="button" aria-label="Previous section" disabled={stepIndex === 0}
                      onClick={() => selectStep(STEPS[stepIndex - 1].id)}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 cursor-pointer">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label="Next section" disabled={stepIndex === STEPS.length - 1}
                      onClick={() => selectStep(STEPS[stepIndex + 1].id)}
                      className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 cursor-pointer">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => document.getElementById('sections')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="text-xs font-semibold text-brand-700 bg-brand-50 rounded-full px-3 min-h-[36px] cursor-pointer">
                      All sections
                    </button>
                  </div>
                  <div id="section-open" className="scroll-mt-28" />
                  <StepCover step={currentStep} index={stepIndex} count={STEPS.length} read={st.read} spoken={st.spoken} total={st.total} />
                  <div className="mt-6 space-y-7">
                    {currentStep.groups.map(group => {
                      const gs = group.topics.filter(x => progress[x.id]?.status === 2).length;
                      return (
                        <div key={group.title}>
                          <div className="flex items-baseline justify-between px-2 mb-1.5">
                            <h3 className="text-base font-bold text-gray-900">{group.title}</h3>
                            <span className="text-xs text-gray-400 tabular-nums">{gs}/{group.topics.length}</span>
                          </div>
                          {renderTopics(group.topics, t)}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-10 pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
                    {stepIndex > 0 ? (
                      <button type="button" onClick={() => selectStep(STEPS[stepIndex - 1].id)}
                        className="text-left cursor-pointer group">
                        <span className="text-[12px] text-gray-400 flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /> Previous</span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-600">{STEPS[stepIndex - 1].title}</span>
                      </button>
                    ) : <span />}
                    {stepIndex < STEPS.length - 1 && (
                      <button type="button" onClick={() => selectStep(STEPS[stepIndex + 1].id)}
                        className="text-right cursor-pointer group">
                        <span className="text-[12px] text-gray-400 flex items-center justify-end gap-1">Next <ChevronRight className="w-3.5 h-3.5" /></span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-600">{STEPS[stepIndex + 1].title}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <p className="mt-8 text-[12px] text-gray-400">
              Facts change. Check the latest news on a topic before your SSB — the views and the questions stay useful longer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
