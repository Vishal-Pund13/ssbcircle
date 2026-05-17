const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');
const { createRoom } = require('../models/Room');
const { sendInterestConfirmation, sendRoomLive } = require('../email');

// List upcoming sessions (auth optional — needed for is_interested)
router.get('/', async (req, res) => {
  const token = req.headers.authorization?.slice(7);
  let userId = null;
  if (token) {
    try { userId = require('jsonwebtoken').verify(token, process.env.JWT_SECRET).userId; } catch {}
  }
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id, s.topic, s.description, s.category, s.subcategory,
        s.scheduled_at, s.admin_username, s.room_code, s.created_by, s.created_at,
        u.display_name AS host_display_name,
        COUNT(DISTINCT si.user_id)::int AS interest_count,
        COALESCE(BOOL_OR(si.user_id = $1), false) AS is_interested
      FROM scheduled_sessions s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN session_interests si ON s.id = si.session_id
      WHERE s.is_active = true
        AND s.scheduled_at > NOW() - INTERVAL '1 hour'
      GROUP BY s.id, u.display_name
      ORDER BY s.scheduled_at ASC
      LIMIT 20
    `, [userId]);
    res.json({ sessions: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create scheduled session
router.post('/', auth, async (req, res) => {
  try {
    const { topic, description, category, subcategory, scheduled_at } = req.body;
    if (!topic?.trim() || !scheduled_at)
      return res.status(400).json({ error: 'Topic and scheduled time are required' });
    if (topic.trim().length < 5)
      return res.status(400).json({ error: 'Topic must be at least 5 characters' });
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate) || scheduledDate <= new Date())
      return res.status(400).json({ error: 'Scheduled time must be in the future' });

    const { rows } = await pool.query(`
      INSERT INTO scheduled_sessions
        (topic, description, category, subcategory, scheduled_at, created_by, admin_username)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [topic.trim(), description?.trim() || null, category || 'GD', subcategory || null,
        scheduledDate, req.userId, req.displayName]);
    res.json({ session: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Toggle interest
router.post('/:id/interest', auth, async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM session_interests WHERE session_id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (existing.length) {
      await pool.query('DELETE FROM session_interests WHERE session_id=$1 AND user_id=$2',
        [req.params.id, req.userId]);
      res.json({ interested: false });
    } else {
      await pool.query('INSERT INTO session_interests (session_id, user_id) VALUES ($1,$2)',
        [req.params.id, req.userId]);
      res.json({ interested: true });
      // Send confirmation email (best-effort, non-blocking)
      pool.query(`
        SELECT s.topic, s.category, s.scheduled_at, u.email, u.display_name
        FROM scheduled_sessions s JOIN users u ON u.id=$1
        WHERE s.id=$2
      `, [req.userId, req.params.id]).then(({ rows }) => {
        if (rows[0]?.email) {
          sendInterestConfirmation({
            to: rows[0].email, name: rows[0].display_name,
            topic: rows[0].topic, category: rows[0].category,
            scheduled_at: rows[0].scheduled_at,
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update interest' });
  }
});

// Cancel session (host only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE scheduled_sessions SET is_active=false WHERE id=$1 AND created_by=$2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found or not yours' });
    res.json({ message: 'Session cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// Start session as live room (host only)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM scheduled_sessions WHERE id=$1 AND created_by=$2 AND is_active=true',
      [req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    const session = rows[0];
    const room = await createRoom(
      session.topic, session.description, session.category,
      session.subcategory, req.userId, req.displayName
    );
    await pool.query('UPDATE scheduled_sessions SET room_code=$1 WHERE id=$2',
      [room.room_code, session.id]);
    res.json({ room });
    // Notify all interested users (best-effort)
    pool.query(`
      SELECT u.email, u.display_name FROM session_interests si
      JOIN users u ON u.id = si.user_id WHERE si.session_id=$1
    `, [session.id]).then(({ rows }) => {
      rows.forEach(u => {
        if (u.email) sendRoomLive({
          to: u.email, name: u.display_name,
          topic: session.topic, category: session.category,
          room_code: room.room_code,
        }).catch(() => {});
      });
    }).catch(() => {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

module.exports = router;
