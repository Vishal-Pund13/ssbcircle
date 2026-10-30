import { todayIST, addDays } from './plan';

// The streak calendar: one column per week, Monday at the top, the latest week
// on the right. activity is [{ day: 'YYYY-MM-DD', actions }]. Used on the Prep
// Sheet and on the home page.

const SHADE = n => !n ? 'bg-gray-100' : n < 3 ? 'bg-emerald-200' : n < 6 ? 'bg-emerald-400' : 'bg-emerald-600';

export default function Heatmap({ activity, weeks = 18, today = todayIST(), cell = 'w-2.5 h-2.5' }) {
  const counts = Object.fromEntries(activity.map(a => [a.day, a.actions]));
  const dow = (new Date(today + 'T00:00:00Z').getUTCDay() + 6) % 7;
  const start = addDays(today, -((weeks - 1) * 7 + dow));
  const cols = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-[3px] w-max">
        {cols.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map(day => (
              <div key={day} title={day > today ? '' : `${day}: ${counts[day] || 0} updates`}
                className={`${cell} rounded-[2px] ${day > today ? 'bg-transparent' : SHADE(counts[day])}`} />
            ))}
          </div>
        ))}
      </div>
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
