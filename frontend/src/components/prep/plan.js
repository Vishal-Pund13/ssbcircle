import { TOPICS } from '../../data/prepSheet';

// Pure helpers behind the prep page: dates in IST, the daily plan, the streak.
// Dates are 'YYYY-MM-DD' strings throughout, matching what the backend sends.

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

const LEVEL_RANK = { must: 0, good: 1, deep: 2 };

// What to study today.
//
// The target is simple: finish every topic to "can speak" two days before the
// SSB, leaving the last days for revision only. Inside three weeks the plan
// goes into crunch mode — must-know topics first, go-deeper ones dropped —
// because a half-known deep topic is worth less than a solid core.
//
// Topics already moved forward today stay in the list, ticked, so the plan
// does not reshuffle under you as you work through it.
export function buildPlan(progress, ssbDate, today = todayIST()) {
  const daysLeft = ssbDate ? daysBetween(today, ssbDate) : null;
  const crunch = daysLeft != null && daysLeft <= 21;

  const doneToday = TOPICS.filter(t => {
    const p = progress[t.id];
    return p && (p.read_on === today || p.spoken_on === today);
  });

  let pool = TOPICS.filter(t => (progress[t.id]?.status || 0) < 2);
  if (crunch) {
    pool = pool
      .filter(t => t.level !== 'deep')
      .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
  }
  // Something read today still counts as remaining work, but is already on
  // today's list.
  const remaining = pool.length;

  let perDay = 3;
  if (daysLeft != null && daysLeft > 0) {
    const studyDays = Math.max(1, daysLeft - 2);
    perDay = Math.min(10, Math.max(1, Math.ceil(remaining / studyDays)));
  }

  const doneIds = new Set(doneToday.map(t => t.id));
  const next = pool.filter(t => !doneIds.has(t.id))
    .slice(0, Math.max(0, perDay - doneToday.length));

  return { daysLeft, crunch, perDay, remaining, doneToday, next };
}

export function dueReviews(progress, today = todayIST()) {
  return TOPICS.filter(t => {
    const p = progress[t.id];
    return p && p.status === 2 && p.review_due && p.review_due <= today;
  });
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

// Same topic for everyone on a given day. Personal "Know Yourself" topics and
// go-deeper ones are left out — this is meant to be a shared GD prompt.
export function topicOfTheDay(today = todayIST()) {
  const pool = TOPICS.filter(t => t.stepId !== 'self' && t.level !== 'deep');
  // FNV-1a, so neighbouring dates land far apart in the list rather than
  // walking through it in order.
  let h = 2166136261;
  for (const c of today) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return pool[h % pool.length];
}
