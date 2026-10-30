import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, ArrowRight, ExternalLink, CheckCircle2, Clock, Megaphone, FileCheck, UserCheck, Hourglass, XCircle, ChevronDown, Info, GraduationCap, Bell } from 'lucide-react';
import SiteNav from './SiteNav';
import { useAuth } from '../context/AuthContext';
import { getPiq } from '../services/api';
import { trackEvent } from '../analytics';
import { EXAMS, RESULTS, CALENDAR_CHECKED } from '../data/examCalendar';
import { ENTRIES, EDU_LEVELS, DEGREES } from '../data/eligibility';
import { firstName } from './Hello';
import { CoverBand, PageHead } from './PageCover';

// Upcoming defence entry exams, recent results, and an "Am I eligible?"
// checker. Exact dates come from the UPSC calendar or a released
// notification; the rest show as an expected month. The data lives in
// data/examCalendar.js and data/eligibility.js and is updated by hand.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY = 24 * 60 * 60 * 1000;

const isExact = d => d.length === 10;
function parse(d) {
  const [y, m, day] = d.split('-').map(Number);
  // An expected month counts as passed only once the month is over
  return isExact(d) ? new Date(y, m - 1, day) : new Date(y, m, 0, 23, 59);
}
const fmt = d => {
  const [y, m, day] = d.split('-').map(Number);
  return isExact(d) ? `${day} ${MONTHS[m - 1]} ${y}` : `${MONTHS[m - 1]} ${y}`;
};
const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const daysLeft = d => Math.round((parse(d) - today0()) / DAY);
const isPast = d => parse(d) < today0();

function When({ date, confirmed }) {
  const left = daysLeft(date);
  if (isPast(date)) return <span className="text-[11px] font-semibold text-gray-400">Done</span>;
  if (!isExact(date) || !confirmed) {
    return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">Expected</span>;
  }
  return (
    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${left <= 30
      ? 'text-red-700 bg-red-50 border-red-200' : 'text-brand-700 bg-brand-50 border-brand-100'}`}>
      {left === 0 ? 'Today' : `in ${left} days`}
    </span>
  );
}

const KIND_ICON = { notification: Megaphone, apply: Clock, exam: CalendarDays, result: FileCheck, ssb: CheckCircle2 };

function upcomingEvents() {
  return EXAMS
    .flatMap(e => e.events.map(ev => ({ ...ev, exam: e })))
    .filter(ev => !isPast(ev.date))
    .sort((a, b) => parse(a.date) - parse(b.date));
}

function DateTile({ date }) {
  return (
    <div className="w-12 text-center shrink-0">
      <p className="text-[11px] font-bold uppercase text-gray-400">{MONTHS[Number(date.slice(5, 7)) - 1]}</p>
      <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">{isExact(date) ? Number(date.slice(8, 10)) : '—'}</p>
    </div>
  );
}

// ── Home page ticker ────────────────────────────────────────────────────────
// A slim scrolling strip under the navbar: the next dates and recent results.
// The track holds the items twice and slides by half its width, so the loop
// is seamless. It pauses on hover and stands still for reduced motion.

export function ExamTicker() {
  const items = [
    ...upcomingEvents().slice(0, 6).map(ev => {
      const exact = isExact(ev.date) && ev.confirmed;
      return {
        icon: CalendarDays,
        text: `${ev.exam.name}: ${ev.label.toLowerCase()} ${exact ? `on ${fmt(ev.date)}` : `expected ${fmt(ev.date)}`}`,
        badge: exact ? `in ${daysLeft(ev.date)} days` : null,
      };
    }),
    ...RESULTS.slice(0, 2).map(r => ({ icon: CheckCircle2, text: `${r.name} out — ${r.note}`, badge: null })),
  ];
  const track = [...items, ...items];

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-stretch">
        <Link to="/exams?tab=upcoming"
          className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 text-[11px] font-bold uppercase tracking-wider text-brand-700 border-r border-gray-200 z-10">
          <CalendarDays className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Exam alerts</span>
        </Link>
        <div className="relative flex-1 overflow-hidden group">
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ animationDuration: '90s' }}>
            {track.map((it, i) => (
              <Link key={i} to="/exams?tab=upcoming" aria-hidden={i >= items.length ? 'true' : undefined} tabIndex={i >= items.length ? -1 : undefined}
                className="flex items-center gap-2 px-5 py-1.5 text-[13px] text-gray-600 hover:text-brand-700 whitespace-nowrap">
                <it.icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{it.text}</span>
                {it.badge && <span className="text-[11px] font-semibold text-brand-700">· {it.badge}</span>}
                <span className="text-gray-300 pl-3" aria-hidden="true">•</span>
              </Link>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-gray-50 to-transparent" />
        </div>
        <Link to="/exams?tab=eligible"
          className="hidden md:flex shrink-0 items-center gap-1 px-4 text-xs font-semibold text-brand-700 hover:text-brand-900 border-l border-gray-200">
          Am I eligible? <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Eligibility ─────────────────────────────────────────────────────────────

const addYears = (iso, years) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() - Math.round(years * 12));
  return d;
};

// Birth window [earliest, latest] allowed for an entry
function window_(entry) {
  if (entry.born) return [new Date(entry.born[0]), new Date(entry.born[1])];
  const earliest = addYears(entry.ref, entry.age[1]);
  earliest.setDate(earliest.getDate() + 1);
  return [earliest, addYears(entry.ref, entry.age[0])];
}

const yearsOld = (dob, on) => (on - dob) / (365.25 * DAY);

// eligible: everything fits · later: only too young or not studied far enough
// yet · no: something that time will not fix (or has already passed)
function assess(entry, f) {
  const dob = new Date(f.dob);
  const [earliest, latest] = window_(entry);
  const hard = [], soft = [];

  if (entry.gender === 'male' && f.gender === 'female') hard.push('Open to men only');

  if (dob < earliest) hard.push('Over the age limit for this entry');
  else if (dob > latest) soft.push('Too young for this cycle');

  if (f.edu < entry.minEdu) {
    const need = entry.minEdu <= 1 ? 'Class 12' : entry.minEdu === 2 ? 'Class 12 passed' : entry.minEdu === 3 ? 'a degree (final year can apply)' : 'a completed degree';
    soft.push(`Needs ${need}`);
  }
  if (entry.degrees && f.edu >= 3 && !entry.degrees.includes(f.degree)) {
    hard.push(`Needs ${entry.degrees.map(d => DEGREES.find(x => x.value === d).label).join(' or ')}`);
  }
  if (entry.pcm && !f.pcm) {
    (f.edu >= 2 ? hard : soft).push('Needs Physics, Chemistry and Maths in Class 12');
  }
  if (entry.ncc && !f.ncc) soft.push("Needs NCC 'C' certificate");

  const status = hard.length ? 'no' : soft.length ? 'later' : 'eligible';
  return { status, reasons: [...hard, ...soft], ageAtRef: entry.ref ? yearsOld(dob, new Date(entry.ref)) : null };
}

const nextEventFor = calendarId => {
  const exam = EXAMS.find(e => e.id === calendarId);
  return exam?.events.find(ev => !isPast(ev.date)) || null;
};

const STORE_KEY = 'ssbc:eligibility';
const EMPTY = { dob: '', gender: 'male', edu: 2, pcm: true, degree: 'engg', ncc: false };

function EntryCard({ entry, result, tone }) {
  const next = entry.calendarId ? nextEventFor(entry.calendarId) : null;
  const tones = {
    eligible: 'border-emerald-200',
    later:    'border-amber-200',
    no:       'border-gray-200',
  };
  return (
    <div className={`bg-white border rounded-xl p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{entry.name}</p>
          <p className="text-xs text-gray-500">{entry.service}</p>
        </div>
        {next && (
          <div className="text-right shrink-0">
            <p className="text-[11px] text-gray-400">{next.label}</p>
            <p className="text-xs font-semibold text-gray-800">{fmt(next.date)}</p>
          </div>
        )}
      </div>
      {tone === 'eligible' && entry.needsPcmFor && result.pcmNote && (
        <p className="mt-2 text-xs text-amber-700">Army wing only — {entry.needsPcmFor} need Physics, Chemistry and Maths in 12th.</p>
      )}
      {tone !== 'eligible' && result.reasons.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {result.reasons.map(r => <li key={r} className={`text-xs ${tone === 'later' ? 'text-amber-700' : 'text-gray-500'}`}>• {r}</li>)}
        </ul>
      )}
      {tone !== 'no' && <p className="mt-2 text-xs text-gray-600 leading-relaxed">{entry.notes}</p>}
    </div>
  );
}

function EligibilityChecker() {
  const { user } = useAuth();
  const [f, setF] = useState(() => {
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }; } catch { return EMPTY; }
  });
  const [showNo, setShowNo] = useState(false);
  const [showAllLater, setShowAllLater] = useState(false);
  const [fromPiq, setFromPiq] = useState(false);

  // A saved PIQ already has the date of birth; use it if the field is empty
  useEffect(() => {
    if (!user || f.dob) return;
    getPiq().then(({ piq }) => {
      if (piq?.dob) { setF(v => ({ ...v, dob: piq.dob })); setFromPiq(true); }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(f)); } catch {}
  }, [f]);

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const validDob = f.dob && !Number.isNaN(new Date(f.dob).getTime()) && new Date(f.dob) < today0();
  const age = validDob ? Math.floor(yearsOld(new Date(f.dob), today0())) : null;

  const results = useMemo(() => {
    if (!validDob) return null;
    const out = { eligible: [], later: [], no: [] };
    for (const entry of ENTRIES) {
      const r = assess(entry, f);
      if (entry.needsPcmFor && !f.pcm) r.pcmNote = true;
      out[r.status].push({ entry, r });
    }
    return out;
  }, [f, validDob]);

  // One event per settled set of answers, not one per keystroke
  useEffect(() => {
    if (!results) return;
    const t = setTimeout(() => trackEvent('eligibility_check', {
      eligible: results.eligible.length, later: results.later.length, edu: f.edu, gender: f.gender,
    }), 2500);
    return () => clearTimeout(t);
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  const field = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100';
  const label = 'block text-xs font-semibold text-gray-700 mb-1.5';
  const pill = active => `flex-1 text-sm font-semibold py-2 rounded-lg border cursor-pointer transition-colors ${active
    ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
        <p className="text-base font-bold text-gray-900">{user ? `${firstName(user)}, tell us about yourself` : 'Tell us about yourself'}</p>
        <p className="text-xs text-gray-500 mt-1 mb-4">Saved only on this device. Nothing is sent to us.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="elig-dob">Date of birth</label>
            <input id="elig-dob" type="date" className={field} value={f.dob} max={new Date().toISOString().slice(0, 10)}
              onChange={e => { set('dob', e.target.value); setFromPiq(false); }} />
            {fromPiq && <p className="text-[12px] text-emerald-700 mt-1">Taken from your PIQ</p>}
            {age !== null && <p className="text-[12px] text-gray-400 mt-1">You are {age} years old today</p>}
          </div>
          <div>
            <span className={label}>Gender</span>
            <div className="flex gap-2">
              <button type="button" className={pill(f.gender === 'male')} onClick={() => set('gender', 'male')}>Male</button>
              <button type="button" className={pill(f.gender === 'female')} onClick={() => set('gender', 'female')}>Female</button>
            </div>
          </div>
          <div>
            <label className={label} htmlFor="elig-edu">Education so far</label>
            <select id="elig-edu" className={field} value={f.edu} onChange={e => set('edu', Number(e.target.value))}>
              {EDU_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          {f.edu >= 1 && (
            <div>
              <span className={label}>Physics, Chemistry and Maths in Class 12?</span>
              <div className="flex gap-2">
                <button type="button" className={pill(f.pcm)} onClick={() => set('pcm', true)}>Yes</button>
                <button type="button" className={pill(!f.pcm)} onClick={() => set('pcm', false)}>No</button>
              </div>
            </div>
          )}
          {f.edu >= 3 && (
            <div>
              <label className={label} htmlFor="elig-degree">Your degree</label>
              <select id="elig-degree" className={field} value={f.degree} onChange={e => set('degree', e.target.value)}>
                {DEGREES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          )}
          {f.edu >= 3 && (
            <div>
              <span className={label}>NCC 'C' certificate?</span>
              <div className="flex gap-2">
                <button type="button" className={pill(f.ncc)} onClick={() => set('ncc', true)}>Yes</button>
                <button type="button" className={pill(!f.ncc)} onClick={() => set('ncc', false)}>No</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!results && (
        <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center">
          <UserCheck className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Enter your date of birth to see the entries open to you.</p>
        </div>
      )}

      {results && (
        <>
          <div className={`rounded-2xl p-5 ${results.eligible.length ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white'}`}>
            <p className="text-2xl font-bold">{results.eligible.length} {results.eligible.length === 1 ? 'entry' : 'entries'} open to you</p>
            <p className="text-sm opacity-90 mt-1">
              {results.eligible.length
                ? 'Based on age and education for the next cycle. Check marks, medical and marital rules in each notification.'
                : results.later.length ? 'None right now, but some open up as you study further or turn older. See below.' : 'None of the listed entries fit right now. Check the reasons below.'}
              {results.later.length > 0 && results.eligible.length > 0 && ` ${results.later.length} more later.`}
            </p>
          </div>

          {results.eligible.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> You can apply</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.eligible.map(({ entry, r }) => <EntryCard key={entry.id} entry={entry} result={r} tone="eligible" />)}
              </div>
            </div>
          )}

          {results.later.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2"><Hourglass className="w-4 h-4 text-amber-500" /> Open to you later</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(showAllLater ? results.later : results.later.slice(0, 4)).map(({ entry, r }) => <EntryCard key={entry.id} entry={entry} result={r} tone="later" />)}
              </div>
              {results.later.length > 4 && (
                <button type="button" onClick={() => setShowAllLater(v => !v)}
                  className="mt-2.5 text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer">
                  {showAllLater ? 'Show fewer' : `Show ${results.later.length - 4} more`}
                </button>
              )}
            </div>
          )}

          {results.no.length > 0 && (
            <div>
              <button type="button" onClick={() => setShowNo(v => !v)}
                className="text-sm font-bold text-gray-500 flex items-center gap-2 cursor-pointer hover:text-gray-700">
                <XCircle className="w-4 h-4" /> Not open to you ({results.no.length})
                <ChevronDown className={`w-4 h-4 transition-transform ${showNo ? 'rotate-180' : ''}`} />
              </button>
              {showNo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
                  {results.no.map(({ entry, r }) => <EntryCard key={entry.id} entry={entry} result={r} tone="no" />)}
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 text-[12px] text-gray-500 leading-relaxed bg-white border border-gray-200 rounded-xl px-4 py-3">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
            <p>
              A guide, not a guarantee. Age limits are for the next cycle of each entry and are based on recent notifications.
              Most entries also need you to be unmarried and to meet marks and medical standards. The official notification is final.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── /exams page ─────────────────────────────────────────────────────────────

const FILTERS = ['All', 'UPSC', 'Indian Air Force', 'Indian Army', 'Indian Navy'];
const FILTER_LABEL = { 'Indian Air Force': 'Air Force', 'Indian Army': 'Army', 'Indian Navy': 'Navy' };
const TABS = [
  { id: 'eligible', label: 'Am I eligible?', icon: UserCheck },
  { id: 'upcoming', label: 'Upcoming',       icon: CalendarDays },
  { id: 'entries',  label: 'All entries',    icon: FileCheck },
];

function UpcomingAgenda() {
  // Group by month so the page reads like a planner
  const groups = [];
  for (const ev of upcomingEvents()) {
    const key = ev.date.slice(0, 7);
    let g = groups.find(x => x.key === key);
    if (!g) groups.push(g = { key, items: [] });
    g.items.push(ev);
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-600" /> Recent results</p>
        <div className="space-y-2.5">
          {RESULTS.map(r => (
            <div key={r.name} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                <p className="text-xs text-gray-500">{fmt(r.date)} · {r.note}</p>
              </div>
              <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-brand-600 shrink-0 mt-0.5" aria-label="Official site">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {groups.map(g => {
        const [y, m] = g.key.split('-').map(Number);
        return (
          <div key={g.key}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{MONTHS_LONG[m - 1]} {y}</p>
            <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
              {g.items.map((ev, i) => {
                const Icon = KIND_ICON[ev.kind] || CalendarDays;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <DateTile date={ev.date} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{ev.exam.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 shrink-0" /> {ev.label}</p>
                    </div>
                    <When date={ev.date} confirmed={ev.confirmed} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AllEntries() {
  const [filter, setFilter] = useState('All');
  const exams = EXAMS
    .filter(e => filter === 'All' || e.body === filter)
    // Soonest upcoming event first; fully finished entries sink
    .map(e => ({ e, next: e.events.find(ev => !isPast(ev.date)) }))
    .sort((a, b) => (a.next ? parse(a.next.date) : Infinity) - (b.next ? parse(b.next.date) : Infinity));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filter === f
              ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}>
            {FILTER_LABEL[f] || f}
          </button>
        ))}
      </div>
      {exams.map(({ e }) => (
        <div key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-gray-900">{e.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{e.body} · {e.service}</p>
              <p className="text-xs text-gray-400 mt-0.5">Who can apply: {e.who}</p>
            </div>
            <a href={e.link} target="_blank" rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-800">
              Official site <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="mt-3 border-l-2 border-gray-100 ml-1.5 space-y-2.5">
            {e.events.map((ev, i) => {
              const past = isPast(ev.date);
              return (
                <li key={i} className="relative pl-4">
                  <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${past ? 'bg-gray-300' : ev.confirmed ? 'bg-brand-600' : 'bg-amber-400'}`} />
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm ${past ? 'text-gray-400' : 'text-gray-800'}`}>
                      <span className="font-semibold">{ev.label}</span> · {fmt(ev.date)}
                    </p>
                    <When date={ev.date} confirmed={ev.confirmed} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default function ExamCalendarPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'eligible';
  const headline = upcomingEvents().find(ev => ev.confirmed && isExact(ev.date));

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />

      <CoverBand deco={[GraduationCap, Bell, Clock]} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 space-y-5">
        <PageHead icon={CalendarDays} eyebrow="Exams & eligibility" title="Your way into the armed forces"
          subtitle="Find the officer entries you can apply for, and never miss a notification, exam or result.">
          {headline && (
            <p className="mt-3 inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-full px-3 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span><span className="font-semibold text-gray-900">{headline.exam.name}</span> {headline.label.toLowerCase()} in {daysLeft(headline.date)} days</span>
            </p>
          )}
        </PageHead>

        <div className="bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm grid grid-cols-3 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setParams({ tab: id }, { replace: true }); trackEvent('exams_tab', { tab: id }); }}
              className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold py-2.5 rounded-xl cursor-pointer transition-colors ${tab === id
                ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4 hidden sm:block" /> {label}
            </button>
          ))}
        </div>

        {tab === 'eligible' && <EligibilityChecker />}
        {tab === 'upcoming' && <UpcomingAgenda />}
        {tab === 'entries'  && <AllEntries />}

        <p className="text-[12px] text-gray-400 leading-relaxed">
          Last checked {fmt(CALENDAR_CHECKED)}. Dates can change. Always confirm on the official site
          (upsc.gov.in, afcat.cdac.in, joinindianarmy.nic.in, joinindiannavy.gov.in) before you apply.
        </p>
      </main>
    </div>
  );
}
