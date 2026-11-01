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

// Presence ping, sent once a minute while a tab is visible. Upserts one row
// per browser, so the admin dashboard can show who is on the site right now.
router.post('/ping', async (req, res) => {
  res.status(204).end();
  try {
    const visitorId = String(req.body?.visitor_id || '').slice(0, 64);
    if (!/^[\w-]{8,64}$/.test(visitorId)) return;
    const path = String(req.body?.path || '/').split('?')[0].slice(0, 200);
    if (path.startsWith('/sa')) return;   // the admin watching the dashboard is not a visitor
    await pool.query(
      `INSERT INTO presence (visitor_id, user_id, path, section, last_seen)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (visitor_id) DO UPDATE
         SET user_id = EXCLUDED.user_id, path = EXCLUDED.path, section = EXCLUDED.section, last_seen = NOW()`,
      [visitorId, readUser(req), path, sectionOf(path)]
    );
    if (Math.random() < 0.01) await pool.query(`DELETE FROM presence WHERE last_seen < NOW() - INTERVAL '30 days'`);
  } catch (err) {
    console.error('[track] ping failed:', err.message);
  }
});

// A tap on "Continue to WhatsApp" with a mentor. Logged with the reference
// code that goes into the WhatsApp message, for matching referrals later.
router.post('/mentor-referral', async (req, res) => {
  res.status(204).end();
  try {
    const code = String(req.body?.code || '');
    const mentor = String(req.body?.mentor || '');
    if (!/^SSBC-[A-Z0-9]{4,8}$/.test(code) || !/^[a-z0-9-]{2,80}$/.test(mentor)) return;
    const source = String(req.body?.source || '').replace(/[^a-z0-9_]/g, '').slice(0, 40) || null;
    const entry = String(req.body?.entry || '').slice(0, 30) || null;
    const visitorId = /^[\w-]{8,64}$/.test(String(req.body?.visitor_id || '')) ? req.body.visitor_id : null;
    await pool.query(
      `INSERT INTO mentor_referrals (code, mentor_slug, source, entry, user_id, visitor_id)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING`,
      [code, mentor, source, entry, readUser(req), visitorId]
    );
  } catch (err) {
    console.error('[track] mentor referral failed:', err.message);
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
