import { todayIST, addDays } from './dates';

// The streak calendar: one column per week, Monday at the top, the latest week
// on the right. activity is [{ day: 'YYYY-MM-DD', actions }]. Used on the Prep
// Sheet and on the home page.
//
// Drawn as a grid that shrinks to fit its container, so the latest weeks are
// never pushed off the right edge on a narrow phone. maxCell caps how large a
// square grows on wide screens.

const SHADE = n => !n ? 'bg-gray-100' : n < 3 ? 'bg-emerald-200' : n < 6 ? 'bg-emerald-400' : 'bg-emerald-600';

export default function Heatmap({ activity, weeks = 18, today = todayIST(), maxCell = 11 }) {
  const counts = Object.fromEntries(activity.map(a => [a.day, a.actions]));
  const dow = (new Date(today + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const start = addDays(today, -((weeks - 1) * 7 + dow));
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid gap-[3px] w-full"
      style={{ gridTemplateRows: 'repeat(7, auto)', gridAutoFlow: 'column', gridAutoColumns: 'minmax(0, 1fr)', maxWidth: weeks * (maxCell + 3) }}>
      {days.map(day => (
        <div key={day} title={day > today ? '' : `${day}: ${counts[day] || 0} updates`}
          className={`aspect-square rounded-[2px] ${day > today ? 'bg-transparent' : SHADE(counts[day])}`} />
      ))}
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
      Less
      {['bg-gray-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600'].map(c => <span key={c} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />)}
      More
    </span>
  );
}
