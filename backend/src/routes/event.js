const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { sendEventConfirmation, sendEventReminder } = require('../email');

const MAX_SPOTS     = 30;
const SESSION_ISO   = '2026-05-23T16:30:00.000Z'; // 10:00 PM IST
const REMINDER_ISO  = '2026-05-23T16:00:00.000Z'; // 9:30 PM IST

// GET /api/event/spots
router.get('/spots', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM event_registrations');
    const registered = parseInt(rows[0].count);
    res.json({ registered, spotsLeft: Math.max(0, MAX_SPOTS - registered), total: MAX_SPOTS });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/event/register
router.post('/register', async (req, res) => {
  const { name, email, phone, entry_type, attempts, prev_recommendation } = req.body;

  if (!name || name.trim().length < 2)
    return res.status(400).json({ error: 'Please enter your full name.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!entry_type)
    return res.status(400).json({ error: 'Please select which entry you are applying for.' });
  if (!attempts || isNaN(parseInt(attempts)))
    return res.status(400).json({ error: 'Please enter your number of SSB attempts.' });

  try {
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM event_registrations');
    if (parseInt(countRows[0].count) >= MAX_SPOTS)
      return res.status(400).json({ error: 'All spots are filled. Session is full.' });

    await pool.query(
      `INSERT INTO event_registrations (name, email, phone, entry_type, attempts, prev_recommendation)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null,
       entry_type, parseInt(attempts), prev_recommendation || 'No']
    );

    // Confirmation email — sent immediately
    await sendEventConfirmation(email.trim().toLowerCase(), name.trim());

    // Reminder email — Resend schedules it for 9:30 PM IST
    await sendEventReminder(email.trim().toLowerCase(), name.trim(), REMINDER_ISO);

    const { rows: newCount } = await pool.query('SELECT COUNT(*) FROM event_registrations');
    res.json({ success: true, spotsLeft: Math.max(0, MAX_SPOTS - parseInt(newCount[0].count)) });
  } catch (e) {
    if (e.code === '23505')
      return res.status(400).json({ error: 'This email is already registered!' });
    console.error('[event/register]', e);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

module.exports = router;
