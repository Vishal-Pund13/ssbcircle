import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight, Check } from 'lucide-react';
import { updateSsbDate } from '../services/api';

// "How long until my SSB?" — a tool anyone can use, signed in or not.
//
// This is deliberately not gated behind an account. A first-time visitor should
// be able to type their date and get an answer immediately; saving it to an
// account is the reason to sign up, not the price of entry.
//
// Dates are plain YYYY-MM-DD strings. Never hand one to new Date() without an
// explicit offset — a bare date string is local time in some browsers and UTC
// in others, which is how a countdown ends up a day out.

const STORAGE_KEY = 'ssbcircle:ssb-date';
const DAY_MS  = 86400000;
const HOUR_MS = 3600000;

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

// The exact instant the SSB date begins in India. Used for the hours figure so
// it ticks down against real time rather than whole days.
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
  return 'Today is the day. Go in calm, be yourself, and tell the truth.';
}

const prettyDate = iso =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

function Stat({ value, label }) {
  return (
    <div className="flex-1 min-w-[72px] bg-white border border-brand-100 rounded-xl px-3 py-3 text-center">
      <p className="text-2xl sm:text-3xl font-bold text-brand-700 tabular-nums leading-none">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1.5">{label}</p>
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

  // Only tick while a date is set — no point re-rendering an empty prompt.
  useEffect(() => {
    if (!date) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [date]);

  function choose(value) {
    setDate(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* private mode */ }

    // Signed in? Keep it on the account too, so it follows them across devices.
    // Failures are deliberately silent: the countdown still works from
    // localStorage, and this is not a form the user submitted.
    if (user && value) {
      updateSsbDate(value)
        .then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => {});
    }
  }

  const days   = daysUntil(date);
  const valid  = days !== null;
  const past   = valid && days < 0;
  const hours  = valid ? Math.max(0, Math.floor((istMidnightMs(date) - now) / HOUR_MS)) : 0;
  const weeks  = valid ? Math.floor(Math.max(0, days) / 7) : 0;
  const months = valid ? monthsUntil(date) : 0;

  const today  = istToday();
  const maxDay = `${Number(today.slice(0, 4)) + 3}${today.slice(4)}`;

  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto bg-brand-50 border border-brand-100 rounded-2xl px-5 sm:px-7 py-6 sm:py-7">

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-brand-100 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-brand-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              How long until your SSB?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Put in the date from your call-up letter. No account needed.
            </p>
          </div>
        </div>

        {/* The date picker is always visible — it is the point of the tool */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="date"
            className="input-base text-sm w-full sm:w-auto"
            value={date}
            min={today}
            max={maxDay}
            onChange={e => choose(e.target.value)}
            aria-label="Your SSB interview date"
          />
          {date && (
            <button type="button" onClick={() => choose('')}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer self-start sm:self-auto">
              Clear
            </button>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="w-3.5 h-3.5" /> Saved to your profile
            </span>
          )}
        </div>

        {/* Nothing entered yet */}
        {!valid && (
          <p className="mt-5 text-sm text-gray-500">
            Pick your date above and we will show you exactly how long is left — in months,
            weeks, days and hours.
          </p>
        )}

        {/* The date has gone by */}
        {past && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-800">That date has passed.</p>
            <p className="text-xs text-gray-500 mt-1">
              Hope it went well. Pick your next date above, or{' '}
              <Link to="/create" className="font-semibold text-brand-600 hover:underline">
                keep practising
              </Link>{' '}
              while you wait for the result.
            </p>
          </div>
        )}

        {/* The countdown itself */}
        {valid && !past && (
          <>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Stat value={months} label={months === 1 ? 'Month' : 'Months'} />
              <Stat value={weeks}  label={weeks === 1 ? 'Week' : 'Weeks'} />
              <Stat value={days}   label={days === 1 ? 'Day' : 'Days'} />
              <Stat value={hours}  label={hours === 1 ? 'Hour' : 'Hours'} />
            </div>

            <p className="mt-4 text-sm text-gray-700 leading-relaxed">
              {days === 0 ? 'Your SSB is today. ' : ''}{focusFor(days)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1.5">{prettyDate(date)}</p>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <Link to={user ? '/create' : '/register'}
                className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors">
                {user ? 'Practise now' : 'Start practising free'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {!user && (
                <p className="text-[11px] text-gray-500 sm:self-center leading-relaxed">
                  Create a free account and we will keep this date on every device,
                  and put you with aspirants whose SSB is around the same time.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
