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
    const [users, activeRooms, totalRooms, todayRooms] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM rooms WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM rooms'),
      pool.query("SELECT COUNT(*) FROM rooms WHERE created_at >= NOW() - INTERVAL '24 hours'"),
    ]);
    res.json({
      totalUsers:  parseInt(users.rows[0].count),
      activeRooms: parseInt(activeRooms.rows[0].count),
      totalRooms:  parseInt(totalRooms.rows[0].count),
      todayRooms:  parseInt(todayRooms.rows[0].count),
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
      SELECT id, username, display_name, email, created_at,
             google_id IS NOT NULL AS is_google
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
