import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { updateSsbDate } from '../services/api';

// "How long until my SSB?" — a tool anyone can use, signed in or not.
//
// Deliberately not gated behind an account. A first-time visitor should get an
// answer immediately; saving it to an account is the reason to sign up, not the
// price of entry.
//
// Dates are plain YYYY-MM-DD strings. Never hand one to new Date() without an
// explicit offset — a bare date string is local time in some browsers and UTC
// in others, which is how a countdown ends up a day out.

const STORAGE_KEY = 'ssbcircle:ssb-date';
const DAY_MS  = 86400000;
const HOUR_MS = 3600000;
const MIN_MS  = 60000;

// Today's date in India, regardless of where the browser is.
export function istToday() {
  return new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
}

// Whole calendar days between two IST dates.
export function daysUntil(isoDate, from = istToday()) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const target = Date.parse(isoDate + 'T00:00:00Z');
  const start  = Date.parse(from    + 'T00:00:00Z');
  if (Number.isNaN(target) || Number.isNaN(start)) return null;
  return Math.round((target - start) / DAY_MS);
}

// The exact instant the SSB date begins in India, so the clock ticks against
// real time rather than whole days.
function istMidnightMs(isoDate) {
  return Date.parse(isoDate + 'T00:00:00+05:30');
}

// Whole calendar months, counting a month only once the day-of-month is reached.
export function monthsUntil(isoDate, from = istToday()) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = isoDate.split('-').map(Number);
  let months = (ty - fy) * 12 + (tm - fm);
  if (td < fd) months -= 1;
  return Math.max(0, months);
}

// A bare number is pressure. What an aspirant needs is to know what today is for.
function focusFor(days) {
  if (days > 60)  return 'Plenty of time. Build the habit now — read daily and get your fitness up.';
  if (days > 30)  return 'Good window. Practise GD and lecturette every week, out loud, with others.';
  if (days > 7)   return 'Sharpen up. Do mock GDs, fix your PIQ answers, and keep running.';
  if (days > 1)   return 'Final week. Revise your PIQ, sleep properly, and go in rested.';
  if (days === 1) return 'Tomorrow. Pack your documents tonight and get an early night.';
  return 'Go in calm, be yourself, and tell the truth.';
}

const prettyDate = iso =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const pad = n => String(n).padStart(2, '0');

// One unit of the live clock. Deliberately quieter than the day count — the
// day number is what an aspirant actually plans around.
function ClockUnit({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1.5">{label}</p>
    </div>
  );
}

export default function SsbCountdown({ user }) {
  const [date,  setDate]  = useState('');
  const [now,   setNow]   = useState(() => Date.now());
  const [saved, setSaved] = useState(false);

  // Prefer the date on the account; fall back to whatever this browser
  // remembers, so a signed-out visitor still sees their countdown on return.
  useEffect(() => {
    if (user?.ssb_date) { setDate(user.ssb_date); return; }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDate(stored);
    } catch { /* private mode */ }
  }, [user?.ssb_date]);

  const days  = daysUntil(date);
  const valid = days !== null;
  const past  = valid && days < 0;
  const live  = valid && days > 0;

  // Only run the timer when there is a clock on screen to move.
  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

  function choose(value) {
    setDate(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* private mode */ }

    // Signed in? Keep it on the account too, so it follows them across devices.
    // Failures are silent on purpose: the countdown still works from
    // localStorage, and this is not a form the user submitted.
    if (user && value) {
      updateSsbDate(value)
        .then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => {});
    }
  }

  const msLeft     = valid ? Math.max(0, istMidnightMs(date) - now) : 0;
  const clockHours = Math.floor((msLeft % DAY_MS) / HOUR_MS);
  const clockMins  = Math.floor((msLeft % HOUR_MS) / MIN_MS);
  const clockSecs  = Math.floor((msLeft % MIN_MS) / 1000);
  const totalHours = Math.floor(msLeft / HOUR_MS);
  const weeks      = live ? Math.floor(days / 7) : 0;
  const months     = live ? monthsUntil(date) : 0;

  const today  = istToday();
  const maxDay = String(Number(today.slice(0, 4)) + 3) + today.slice(4);

  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto relative overflow-hidden rounded-2xl bg-brand-800 text-white">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

        <div className="relative px-5 sm:px-8 py-7 sm:py-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">
            {live ? 'Countdown to your SSB' : 'SSB countdown'}
          </p>

          {/* Nothing entered yet — this is the hook, so it leads */}
          {!valid && (
            <>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold uppercase leading-[0.95] tracking-tighter">
                How long until<br />your SSB?
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/70 leading-relaxed">
                Put in the date from your call-up letter and see exactly how long is left,
                down to the second. No account needed.
              </p>
            </>
          )}

          {/* The live countdown */}
          {live && (
            <div className="mt-4 flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
              <div className="shrink-0">
                <p className="text-6xl sm:text-8xl font-bold tabular-nums leading-[0.85] tracking-tighter">
                  {days}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                  {days === 1 ? 'Day to go' : 'Days to go'}
                </p>
              </div>

              <div className="flex items-start gap-4 sm:gap-6 lg:border-l lg:border-white/15 lg:pl-10 lg:pb-1">
                <ClockUnit value={pad(clockHours)} label="Hours" />
                <span className="text-2xl sm:text-3xl font-bold text-white/25 leading-none">:</span>
                <ClockUnit value={pad(clockMins)} label="Mins" />
                <span className="text-2xl sm:text-3xl font-bold text-white/25 leading-none">:</span>
                <ClockUnit value={pad(clockSecs)} label="Secs" />
              </div>
            </div>
          )}

          {/* The day itself */}
          {valid && !past && !live && (
            <h2 className="mt-3 text-5xl sm:text-7xl font-bold uppercase leading-[0.9] tracking-tighter">
              Today
            </h2>
          )}

          {/* The date has gone by */}
          {past && (
            <>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight">That date has passed</h2>
              <p className="mt-2 text-sm text-white/70">
                Hope it went well. Set your next date below, or keep practising while you wait.
              </p>
            </>
          )}

          {/* Supporting figures — same information, smaller voice */}
          {live && (
            <p className="mt-5 text-xs text-white/50">
              That is roughly <span className="font-semibold text-white/80">{months} {months === 1 ? 'month' : 'months'}</span>
              {' · '}<span className="font-semibold text-white/80">{weeks} {weeks === 1 ? 'week' : 'weeks'}</span>
              {' · '}<span className="font-semibold text-white/80">{totalHours.toLocaleString('en-IN')} hours</span>
            </p>
          )}

          {valid && !past && (
            <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-xl">{focusFor(days)}</p>
          )}
          {valid && !past && (
            <p className="mt-1.5 text-[11px] text-white/40">{prettyDate(date)}</p>
          )}

          {/* Date picker and actions */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="date"
              className="bg-white/10 border border-white/20 text-white text-sm rounded-xl px-4 py-2.5 w-full sm:w-auto focus:outline-none focus:border-amber-300 [color-scheme:dark]"
              value={date}
              min={today}
              max={maxDay}
              onChange={e => choose(e.target.value)}
              aria-label="Your SSB interview date"
            />

            <Link to={user ? '/create' : '/register'}
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-800 text-xs font-bold uppercase tracking-[0.15em] px-6 py-3 rounded-xl hover:bg-amber-300 transition-colors">
              {user ? 'Practise now' : 'Start practising free'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {date && (
              <button type="button" onClick={() => choose('')}
                className="text-xs font-semibold text-white/40 hover:text-white/70 cursor-pointer self-start sm:self-auto">
                Clear
              </button>
            )}
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          {!user && valid && !past && (
            <p className="mt-3 text-[11px] text-white/40 max-w-md leading-relaxed">
              Create a free account and we will keep this date on every device, and put you
              with aspirants whose SSB is around the same time.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
