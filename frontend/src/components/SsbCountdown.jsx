import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check } from 'lucide-react';
import { updateSsbDate } from '../services/api';

// "How long until my SSB?" — a small tool on the home page, usable signed in
// or not. Deliberately compact: it sits inside the page rather than competing
// with the hero, and a first-time visitor gets an answer without an account.
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
  if (days > 60)  return 'Plenty of time — read daily and build your fitness.';
  if (days > 30)  return 'Practise GD and lecturette every week, out loud.';
  if (days > 7)   return 'Mock GDs, fix your PIQ answers, keep running.';
  if (days > 1)   return 'Final week. Revise your PIQ and sleep properly.';
  if (days === 1) return 'Tomorrow. Pack your documents tonight.';
  return 'Go in calm, be yourself, and tell the truth.';
}

const prettyDate = iso =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
  });

const pad = n => String(n).padStart(2, '0');

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
  const weeks      = live ? Math.floor(days / 7) : 0;
  const months     = live ? monthsUntil(date) : 0;

  const today  = istToday();
  const maxDay = String(Number(today.slice(0, 4)) + 3) + today.slice(4);

  const dateInput = (
    <input
      type="date"
      className="input-base text-xs py-1.5 px-2.5 w-[9.5rem]"
      value={date}
      min={today}
      max={maxDay}
      onChange={e => choose(e.target.value)}
      aria-label="Your SSB interview date"
    />
  );

  return (
    <section className="bg-white px-4 sm:px-6 py-5">
      <div className="max-w-5xl mx-auto border border-gray-200 rounded-xl px-4 sm:px-5 py-3.5">

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              SSB countdown
            </span>
          </div>

          {/* No date yet — the prompt is the whole widget */}
          {!valid && (
            <>
              <p className="text-sm text-gray-600 flex-1 min-w-[12rem]">
                Add your SSB date to see exactly how long is left.
              </p>
              {dateInput}
            </>
          )}

          {/* Counting down */}
          {live && (
            <>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className="text-3xl sm:text-4xl font-bold text-brand-600 tabular-nums leading-none">
                  {days}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {days === 1 ? 'day left' : 'days left'}
                </span>
              </div>

              <div className="flex items-baseline gap-1 shrink-0 text-gray-700">
                <span className="text-base sm:text-lg font-semibold tabular-nums">{pad(clockHours)}</span>
                <span className="text-gray-300">:</span>
                <span className="text-base sm:text-lg font-semibold tabular-nums">{pad(clockMins)}</span>
                <span className="text-gray-300">:</span>
                <span className="text-base sm:text-lg font-semibold tabular-nums">{pad(clockSecs)}</span>
              </div>

              <div className="flex-1" />
              {dateInput}
            </>
          )}

          {/* The day itself */}
          {valid && !past && !live && (
            <>
              <p className="text-base font-bold text-brand-600 shrink-0">Your SSB is today.</p>
              <div className="flex-1" />
              {dateInput}
            </>
          )}

          {/* Gone by */}
          {past && (
            <>
              <p className="text-sm text-gray-600 flex-1 min-w-[12rem]">
                That date has passed. Set your next one.
              </p>
              {dateInput}
            </>
          )}

          {saved && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 shrink-0">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        {/* Second line: the same information, quietly */}
        {live && (
          <p className="mt-2 text-[12px] text-gray-400">
            {months} {months === 1 ? 'month' : 'months'} · {weeks} {weeks === 1 ? 'week' : 'weeks'} · {prettyDate(date)}
            <span className="text-gray-300"> — </span>
            <span className="text-gray-500">{focusFor(days)}</span>
            {!user && (
              <>
                <span className="text-gray-300"> · </span>
                <Link to="/register" className="font-semibold text-brand-600 hover:underline">
                  Save it to your profile
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
