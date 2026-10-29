const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const Moderation = require('../models/Moderation');

// The aspirant side of the moderator programme, plus "report a problem or
// idea" — platform feedback counts towards the programme's activity score.

router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json(await Moderation.mine(req.userId));
  } catch (err) {
    console.error('Moderator status error:', err);
    res.status(500).json({ error: 'Could not load your status' });
  }
});

router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const motivation = String(req.body?.motivation || '').trim().slice(0, 1500);
    const availability = String(req.body?.availability || '').trim().slice(0, 200);
    if (motivation.length < 30) return res.status(400).json({ error: 'Tell us a little more about why you want to help (at least a couple of lines).' });
    if (!availability) return res.status(400).json({ error: 'Tell us when you are usually free.' });

    const current = await Moderation.mine(req.userId);
    if (current.is_moderator) return res.status(400).json({ error: 'You are already a moderator.' });

    await Moderation.apply(req.userId, { motivation, availability });
    res.json(await Moderation.mine(req.userId));
  } catch (err) {
    console.error('Moderator apply error:', err);
    res.status(500).json({ error: 'Could not save your application' });
  }
});

router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    await Moderation.withdraw(req.userId);
    res.json(await Moderation.mine(req.userId));
  } catch (err) {
    res.status(500).json({ error: 'Could not withdraw' });
  }
});

// Report a problem or idea about the platform
const KINDS = new Set(['bug', 'idea', 'content', 'other']);

router.post('/platform-feedback', authMiddleware, async (req, res) => {
  try {
    const kind = KINDS.has(req.body?.kind) ? req.body.kind : 'other';
    const message = String(req.body?.message || '').trim().slice(0, 2000);
    const page = String(req.body?.page || '').slice(0, 200) || null;
    if (message.length < 10) return res.status(400).json({ error: 'Please describe it in a sentence or two.' });

    // A small daily cap keeps this useful and stops score farming
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM platform_feedback WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day'`, [req.userId]);
    if (rows[0].n >= 10) return res.status(429).json({ error: 'Thanks! You have sent a lot today — please try again tomorrow.' });

    await pool.query(`INSERT INTO platform_feedback (user_id, kind, message, page) VALUES ($1, $2, $3, $4)`,
      [req.userId, kind, message, page]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Platform feedback error:', err);
    res.status(500).json({ error: 'Could not send your feedback' });
  }
});

module.exports = router;
