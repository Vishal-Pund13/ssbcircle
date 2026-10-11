import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';

// How many days until the aspirant's SSB.
//
// ssb_date arrives as a plain YYYY-MM-DD string, because findById casts the
// DATE column to text. Do not pass it through new Date() without the Z — a bare
// date string is parsed as local time in some browsers and UTC in others, which
// is how a countdown ends up one day out.
//
// Both sides are anchored to UTC midnight so the subtraction is exact, and
// "today" is taken in IST rather than the browser's timezone, so an aspirant
// travelling abroad still sees the number their call-up letter implies.

const DAY_MS = 86400000;

export function istToday() {
  return new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
}

export function daysUntil(isoDate, from = istToday()) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const target = Date.parse(isoDate + 'T00:00:00Z');
  const start  = Date.parse(from    + 'T00:00:00Z');
  if (Number.isNaN(target) || Number.isNaN(start)) return null;
  return Math.round((target - start) / DAY_MS);
}

const prettyDate = iso =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  });

// One line of advice matched to how much time is left. A bare number is just
// pressure; what an aspirant actually needs is to know what today is for.
function focusFor(days) {
  if (days > 60) return 'Plenty of time. Build the habit now — read daily and get your fitness up.';
  if (days > 30) return 'Good window. Practise GD and lecturette every week, out loud, with others.';
  if (days > 7)  return 'Sharpen up. Do mock GDs, fix your PIQ answers, and keep running.';
  if (days > 1)  return 'Final week. Revise your PIQ, sleep properly, and go in rested.';
  if (days === 1) return 'Tomorrow. Pack your documents tonight and get an early night.';
  return 'Today is the day. Go in calm, be yourself, and tell the truth.';
}

export default function SsbCountdown({ user }) {
  const iso = user?.ssb_date;
  const days = daysUntil(iso);

  // Nothing set, or the date has passed — stay out of the way rather than
  // showing a stale or negative count. The profile page still holds the date
  // so it can be updated.
  if (days === null || days < 0) return null;

  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4 bg-brand-50 border border-brand-100 rounded-2xl px-5 py-5">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-white border border-brand-100 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-700 tabular-nums leading-none">
              {days === 0 ? 'Today' : days}
              {days > 0 && (
                <span className="text-sm font-semibold text-brand-600 ml-1.5">
                  {days === 1 ? 'day' : 'days'}
                </span>
              )}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-600/70 mt-1">
              {days === 0 ? 'Your SSB' : 'To your SSB'}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 sm:border-l sm:border-brand-100 sm:pl-5">
          <p className="text-sm text-gray-700 leading-relaxed">{focusFor(days)}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {prettyDate(iso)} ·{' '}
            <Link to="/profile" className="font-semibold text-brand-600 hover:underline">
              Change date
            </Link>
          </p>
        </div>

        <Link to="/create"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors">
          Practise now <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
