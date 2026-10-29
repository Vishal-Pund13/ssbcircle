const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Usage tracking for the admin dashboard: page views per section and a few key
// actions (TAT started, PIQ analysed, eligibility checked…). Anonymous visitors
// count by a random id the browser keeps; signed-in ones also by user id.
// No page content, form answers or personal details are recorded.

const EVENT_RE = /^[a-z][a-z0-9_]{1,39}$/;
const MAX_EVENTS = 20;

// Section names the dashboard groups by. Order matters: first match wins.
const SECTIONS = [
  [/^\/$/, 'home'],
  [/^\/piq/, 'piq'],
  [/^\/tat/, 'tat'],
  [/^\/prep/, 'prep'],
  [/^\/exams/, 'exams'],
  [/^\/(start|become-an-officer)/, 'start'],
  [/^\/(current-affairs|article|read|series)/, 'news'],
  [/^\/community/, 'community'],
  [/^\/(room|create|join|session)/, 'rooms'],
  [/^\/mentor/, 'mentors'],
  [/^\/profile/, 'profile'],
  [/^\/(login|register|welcome)/, 'signup'],
];
const sectionOf = path => (SECTIONS.find(([re]) => re.test(path)) || [null, 'other'])[1];

function readUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET).userId || null; } catch { return null; }
}

router.post('/', async (req, res) => {
  // Always answer quickly; tracking must never hold up the page
  res.status(204).end();
  try {
    const visitorId = String(req.body?.visitor_id || '').slice(0, 64);
    if (!/^[\w-]{8,64}$/.test(visitorId)) return;
    const userId = readUser(req);
    const events = (Array.isArray(req.body?.events) ? req.body.events : []).slice(0, MAX_EVENTS)
      .filter(e => e && EVENT_RE.test(e.event))
      .map(e => {
        const path = String(e.path || '/').split('?')[0].slice(0, 200);
        const meta = e.meta && typeof e.meta === 'object' ? JSON.stringify(e.meta).slice(0, 500) : null;
        return [e.event, sectionOf(path), path, userId, visitorId, meta];
      });
    if (!events.length) return;

    const values = events.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6}::jsonb)`).join(', ');
    await pool.query(
      `INSERT INTO app_events (event, section, path, user_id, visitor_id, meta) VALUES ${values}`,
      events.flat()
    );
  } catch (err) {
    console.error('[track] could not record events:', err.message);
  }
});

// "Was this useful?" on AI reports. One answer per person per report; a
// second answer replaces the first.
const FEATURES = new Set(['piq', 'tat', 'prep_speak']);

router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const feature = String(req.body?.feature || '');
    const refId = String(req.body?.ref_id || '').slice(0, 80);
    if (!FEATURES.has(feature) || !refId) return res.status(400).json({ error: 'Unknown report.' });
    if (typeof req.body?.helpful !== 'boolean') return res.status(400).json({ error: 'Say whether it helped.' });
    const comment = String(req.body?.comment || '').trim().slice(0, 1000) || null;

    await pool.query(
      `INSERT INTO ai_feedback (feature, ref_id, user_id, helpful, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (feature, ref_id, user_id)
       DO UPDATE SET helpful = EXCLUDED.helpful, comment = COALESCE(EXCLUDED.comment, ai_feedback.comment), created_at = NOW()`,
      [feature, refId, req.userId, req.body.helpful, comment]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('AI feedback error:', err);
    res.status(500).json({ error: 'Could not save your feedback' });
  }
});

module.exports = router;
