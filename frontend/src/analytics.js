import ReactGA from 'react-ga4';

export const initGA = () => {
  if (import.meta.env.VITE_GA_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_ID);
  }
};

// ── Our own usage events, for the admin dashboard ───────────────────────────
// Page views and a handful of key actions go to /api/track in small batches.
// Only the event name, the path and a tiny meta object are sent, never form
// answers or page content. Failures are ignored: tracking must never get in
// the way of the page.

const API = import.meta.env.VITE_API_URL || '';
const FLUSH_MS = 4000;
let queue = [];
let timer = null;

// Same id the article view counter uses, so one browser is one visitor
export function visitorId() {
  try {
    let id = localStorage.getItem('ssbc_visitor');
    if (!id) {
      id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('ssbc_visitor', id);
    }
    return id;
  } catch {
    return null;
  }
}

function flush() {
  clearTimeout(timer); timer = null;
  if (!queue.length) return;
  const id = visitorId();
  const events = queue.splice(0, 20);
  if (!id) return;
  let token = null;
  try { token = localStorage.getItem('token'); } catch {}
  fetch(`${API}/api/track`, {
    method: 'POST',
    keepalive: true,      // survives the tab closing
    headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ visitor_id: id, events }),
  }).catch(() => {});
  if (queue.length) timer = setTimeout(flush, FLUSH_MS);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}

export function trackEvent(event, meta) {
  if (import.meta.env.DEV && import.meta.env.VITE_TRACK_DEV !== '1') return;   // keep dev clicks out of the numbers
  queue.push({ event, path: window.location.pathname, ...(meta && { meta }) });
  if (!timer) timer = setTimeout(flush, FLUSH_MS);
}

export const trackPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
  trackEvent('page_view');
  ping();
};

// ── Presence: who is on the site right now ──────────────────────────────────
// A visible tab tells the server it is here once a minute (and straight away
// on each page change), so the admin dashboard can show who is online. A tab
// in the background sends nothing and drops off after two minutes.

const PING_MS = 60_000;
let lastPing = 0;

function ping() {
  if (import.meta.env.DEV && import.meta.env.VITE_TRACK_DEV !== '1') return;
  if (document.visibilityState !== 'visible') return;
  if (Date.now() - lastPing < 10_000) return;   // page changes in quick succession
  const id = visitorId();
  if (!id) return;
  lastPing = Date.now();
  let token = null;
  try { token = localStorage.getItem('token'); } catch {}
  fetch(`${API}/api/track/ping`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ visitor_id: id, path: window.location.pathname }),
  }).catch(() => {});
}

if (typeof document !== 'undefined') {
  setInterval(ping, PING_MS);
  document.addEventListener('visibilitychange', ping);
}
