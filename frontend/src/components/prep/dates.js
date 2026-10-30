// Dates in IST and the practice streak — kept apart from plan.js, which pulls
// in the whole Prep Sheet, so the home page's first screen can show a streak
// without loading every topic. Dates are 'YYYY-MM-DD' strings throughout,
// matching what the backend sends.

export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function toUTC(day) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from, to) {
  return Math.round((toUTC(to) - toUTC(from)) / 86400000);
}

export function addDays(day, n) {
  return new Date(toUTC(day) + n * 86400000).toISOString().slice(0, 10);
}

// Consecutive days with activity, ending today — or yesterday, so the streak
// does not read zero all morning before you have studied.
export function streak(activity, today = todayIST()) {
  const days = new Set(activity.map(a => a.day));
  let day = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(day)) { n++; day = addDays(day, -1); }
  return n;
}
