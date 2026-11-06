const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');
const { notify, PUSH_READY } = require('../notify');

// The bell, phone-push subscriptions, and notification preferences.

const PREF_KEYS = ['replies_push', 'replies_email', 'rooms_push', 'rooms_email'];

// Public: the key a browser needs to subscribe to push. Empty when push is off.
router.get('/vapid-public-key', (_req, res) => res.json({ key: process.env.VAPID_PUBLIC_KEY || '' }));

// One-click email unsubscribe from the link in every notification email
router.get('/unsubscribe', async (req, res) => {
  try {
    const { uid, purpose } = jwt.verify(String(req.query.t || ''), process.env.JWT_SECRET);
    if (purpose !== 'email-unsub') throw new Error('bad token');
    await pool.query(`UPDATE users SET notify_prefs = notify_prefs || '{"replies_email": false, "rooms_email": false}'::jsonb WHERE id = $1`, [uid]);
    res.redirect('https://www.ssbcircle.com/profile?notifications=email-off#notifications');
  } catch {
    res.status(400).send('This link has expired. You can turn off emails from your profile on SSBCircle.');
  }
});

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT n.id, n.kind, n.title, n.body, n.link, n.count, n.read_at, n.updated_at, u.avatar_url AS actor_avatar
      FROM notifications n LEFT JOIN users u ON u.id = n.actor_id
      WHERE n.user_id = $1 ORDER BY n.updated_at DESC LIMIT 30`, [req.userId]);
    res.json({ notifications: rows, unread: rows.filter(r => !r.read_at).length });
  } catch (err) {
    console.error('Notifications list error:', err);
    res.status(500).json({ error: 'Could not load notifications' });
  }
});

// Cheap, polled by the bell
router.get('/unread-count', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [req.userId]);
    res.json({ unread: rows[0].n });
  } catch {
    res.json({ unread: 0 });
  }
});

// Mark read: { ids: [..] }, or all when ids is missing
router.post('/read', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isFinite).slice(0, 100) : null;
    if (ids?.length) {
      await pool.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND id = ANY($2) AND read_at IS NULL', [req.userId, ids]);
    } else {
      await pool.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [req.userId]);
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not update notifications' });
  }
});

router.post('/push/subscribe', async (req, res) => {
  try {
    const s = req.body?.subscription;
    const endpoint = String(s?.endpoint || '');
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !s?.keys?.p256dh || !s?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    await pool.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [req.userId, endpoint, String(s.keys.p256dh).slice(0, 200), String(s.keys.auth).slice(0, 100),
       String(req.headers['user-agent'] || '').slice(0, 200)]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Could not turn on notifications' });
  }
});

router.post('/push/unsubscribe', async (req, res) => {
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [req.userId, String(req.body?.endpoint || '')]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not turn off notifications' });
  }
});

// "Send me a test notification" from Profile, to check a phone end to end.
// Clicks within the same minute bundle into one bell row; generalLimiter caps the rest.
router.post('/test', async (req, res) => {
  notify({
    userIds: [req.userId], kind: 'test', type: 'reply', groupKey: `test:${Math.floor(Date.now() / 60000)}`,
    title: 'Notifications are working', body: 'This is how replies and room alerts will reach you.',
    link: '/community', email: false, force: true,
  });
  res.json({ ok: true, push: PUSH_READY });
});

router.get('/prefs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT notify_prefs FROM users WHERE id = $1', [req.userId]);
    const p = rows[0]?.notify_prefs || {};
    res.json({ prefs: Object.fromEntries(PREF_KEYS.map(k => [k, p[k] !== false])) });
  } catch {
    res.status(500).json({ error: 'Could not load preferences' });
  }
});

router.put('/prefs', async (req, res) => {
  try {
    const patch = Object.fromEntries(PREF_KEYS.filter(k => typeof req.body?.[k] === 'boolean').map(k => [k, req.body[k]]));
    await pool.query('UPDATE users SET notify_prefs = notify_prefs || $2::jsonb WHERE id = $1', [req.userId, JSON.stringify(patch)]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Could not save preferences' });
  }
});

module.exports = router;
