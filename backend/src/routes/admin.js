const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { closeRoom } = require('../models/Room');

function adminGuard(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  if (
    username !== process.env.SUPER_ADMIN_USERNAME ||
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Stats
router.get('/stats', adminGuard, async (_req, res) => {
  try {
    const [users, activeRooms, totalRooms, todayRooms, upcomingSessions, totalSessions] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM rooms WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM rooms'),
      pool.query("SELECT COUNT(*) FROM rooms WHERE created_at >= NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(*) FROM scheduled_sessions WHERE is_active = true AND scheduled_at > NOW()"),
      pool.query('SELECT COUNT(*) FROM scheduled_sessions'),
    ]);
    res.json({
      totalUsers:        parseInt(users.rows[0].count),
      activeRooms:       parseInt(activeRooms.rows[0].count),
      totalRooms:        parseInt(totalRooms.rows[0].count),
      todayRooms:        parseInt(todayRooms.rows[0].count),
      upcomingSessions:  parseInt(upcomingSessions.rows[0].count),
      totalSessions:     parseInt(totalSessions.rows[0].count),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Recent rooms
router.get('/rooms', adminGuard, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.topic, r.room_code, r.category, r.subcategory,
             r.description, r.is_active, r.created_at,
             u.display_name AS host, u.username AS host_username
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    res.json({ rooms: rows });
  } catch (err) {
    console.error('Admin rooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// All users
router.get('/users', adminGuard, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, display_name, email, avatar_url, is_banned, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 200
    `);
    res.json({ users: rows });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Ban user
router.post('/users/:id/ban', adminGuard, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_banned=true WHERE id=$1', [req.params.id]);
    // Close all their active rooms immediately
    const { rows } = await pool.query(
      'UPDATE rooms SET is_active=false WHERE created_by=$1 AND is_active=true RETURNING room_code',
      [req.params.id]
    );
    if (rows.length) {
      const codes = rows.map(r => r.room_code);
      await pool.query(
        `UPDATE scheduled_sessions SET room_code=NULL, is_active=false WHERE room_code = ANY($1)`,
        [codes]
      );
    }
    res.json({ message: 'User banned and rooms closed' });
  } catch (err) {
    console.error('Admin ban error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user
router.post('/users/:id/unban', adminGuard, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_banned=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'User unbanned' });
  } catch (err) {
    console.error('Admin unban error:', err);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// All scheduled sessions
router.get('/sessions', adminGuard, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.topic, s.category, s.subcategory, s.scheduled_at,
             s.is_active, s.room_code, s.reminder_sent, s.created_at,
             u.display_name AS host_display_name, u.email AS host_email,
             COUNT(DISTINCT si.user_id)::int AS interest_count
      FROM scheduled_sessions s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN session_interests si ON s.id = si.session_id
      GROUP BY s.id, u.display_name, u.email
      ORDER BY s.scheduled_at DESC
      LIMIT 100
    `);
    res.json({ sessions: rows });
  } catch (err) {
    console.error('Admin sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Cancel any session
router.delete('/sessions/:id', adminGuard, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE scheduled_sessions SET is_active=false WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session cancelled' });
  } catch (err) {
    console.error('Admin cancel session error:', err);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// Close any room
router.delete('/rooms/:code', adminGuard, async (req, res) => {
  try {
    const room = await closeRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room closed' });
  } catch (err) {
    console.error('Admin close room error:', err);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

module.exports = router;
