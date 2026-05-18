require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const pool        = require('./db');
const { authLimiter, createRoomLimiter, generalLimiter } = require('./middleware/rateLimit');
const roomsRouter    = require('./routes/rooms');
const authRouter     = require('./routes/auth');
const adminRouter    = require('./routes/admin');
const sessionsRouter = require('./routes/sessions');
const { startCleanup, runCleanup } = require('./cleanup');
const { sendReminder, sendHostStartReminder } = require('./email');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Trust proxy (Render / Railway / Heroku sit behind one) ───────────────────
// Needed so rate-limiter reads the real client IP, not the proxy IP
app.set('trust proxy', 1);

// ── Compression (gzip) ───────────────────────────────────────────────────────
app.use(compression());

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '16kb' })); // Reject suspiciously large bodies

// ── Routes with targeted rate limits ─────────────────────────────────────────
// Auth: strict — protects against brute force & account spam
app.use('/api/auth', authLimiter, authRouter);

// Rooms: general guard on all room endpoints
// createRoomLimiter is applied inside rooms.js on POST / only
app.use('/api/rooms', generalLimiter, roomsRouter);

// Admin: strict limit on login endpoint, general on everything else
app.use('/api/admin/login', authLimiter);
app.use('/api/admin', generalLimiter, adminRouter);

// Sessions
app.use('/api/sessions', generalLimiter, sessionsRouter);

// Report a user (any signed-in user)
const authMw = require('./middleware/auth');
app.post('/api/reports', generalLimiter, authMw, async (req, res) => {
  try {
    const { reported_user_id, room_code, reason, description } = req.body;
    if (!reported_user_id || !reason)
      return res.status(400).json({ error: 'reported_user_id and reason are required' });
    if (reported_user_id === req.userId)
      return res.status(400).json({ error: 'You cannot report yourself' });
    await pool.query(
      `INSERT INTO user_reports (reporter_id, reported_user_id, room_code, reason, description)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.userId, reported_user_id, room_code || null, reason.slice(0, 100), (description || '').slice(0, 500)]
    );
    res.json({ message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Featured aspirants — public, lightweight
app.get('/api/featured', generalLimiter, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.display_name, u.avatar_url,
             COUNT(r.id)::int AS rooms_hosted
      FROM users u
      JOIN rooms r ON r.created_by = u.id
      WHERE u.is_banned = false
      GROUP BY u.id
      HAVING COUNT(r.id) > 0
      ORDER BY COUNT(r.id) DESC, u.created_at DESC
      LIMIT 8
    `);
    res.json({ aspirants: rows });
  } catch {
    res.json({ aspirants: [] });
  }
});

// ── External cron trigger — call this every 2 min from cron-job.org / UptimeRobot
app.get('/api/cron', async (_req, res) => {
  try {
    await Promise.all([runCleanup(), sendSessionReminders()]);
    res.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[cron] Error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS db_time');
    // Run cleanup on every health ping — keeps it working even if server was sleeping
    runCleanup().catch(() => {});
    // Send 30-min reminders for upcoming sessions
    sendSessionReminders().catch(() => {});
    res.json({
      status: 'ok',
      db: 'connected',
      db_time: rows[0].db_time,
      uptime_s: Math.floor(process.uptime()),
    });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

// ── 404 / error handlers ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function sendSessionReminders() {
  try {
    // Find sessions starting in 25–35 min, reminder not yet sent
    const { rows: sessions } = await pool.query(`
      SELECT s.id, s.topic, s.category, s.scheduled_at
      FROM scheduled_sessions s
      WHERE s.is_active = true
        AND s.reminder_sent = false
        AND s.scheduled_at BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes'
    `);
    console.log(`[reminders] Checked — ${sessions.length} session(s) in window`);
    for (const session of sessions) {
      const { rows: users } = await pool.query(`
        SELECT u.email, u.display_name FROM session_interests si
        JOIN users u ON u.id = si.user_id WHERE si.session_id = $1
      `, [session.id]);
      for (const u of users) {
        if (u.email) {
          await sendReminder({
            to: u.email, name: u.display_name,
            topic: session.topic, category: session.category,
            scheduled_at: session.scheduled_at,
          }).catch(err => console.error(`[reminders] Reminder failed for ${u.email}:`, err.message));
        }
      }
      await pool.query('UPDATE scheduled_sessions SET reminder_sent=true WHERE id=$1', [session.id]);
      console.log(`[reminders] Sent reminders for session: ${session.topic}`);
    }

    // Host start reminder — sent at scheduled time if room not yet active
    const { rows: starting } = await pool.query(`
      SELECT s.id, s.topic, s.category, s.scheduled_at, s.created_by,
             u.email, u.display_name
      FROM scheduled_sessions s
      JOIN users u ON u.id = s.created_by
      WHERE s.is_active = true
        AND s.host_reminder_sent = false
        AND NOT EXISTS (
          SELECT 1 FROM rooms r WHERE r.room_code = s.room_code AND r.is_active = true
        )
        AND s.scheduled_at BETWEEN NOW() - INTERVAL '5 minutes' AND NOW() + INTERVAL '5 minutes'
    `);
    for (const session of starting) {
      if (session.email) {
        await sendHostStartReminder({
          to: session.email, name: session.display_name,
          topic: session.topic, category: session.category,
          scheduled_at: session.scheduled_at,
        }).catch(err => console.error(`[reminders] Host reminder failed for ${session.topic}:`, err.message));
      }
      await pool.query('UPDATE scheduled_sessions SET host_reminder_sent=true WHERE id=$1', [session.id]);
      console.log(`[reminders] Sent host start reminder: ${session.topic}`);
    }
  } catch (err) {
    console.error('[reminders] Error:', err.message);
  }
}

async function start() {
  try {
    await pool.query('SELECT 1'); // verify DB connectivity
    console.log('✓ Database connected');

    // Auto-migrate: safe to run on every boot
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS emptied_at TIMESTAMP`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT 8`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS summary TEXT`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE scheduled_sessions ADD COLUMN IF NOT EXISTS host_reminder_sent BOOLEAN DEFAULT false`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        room_code VARCHAR(10),
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Performance indexes — safe to run repeatedly
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_rooms_active      ON rooms(created_at DESC) WHERE is_active = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_rooms_created_by  ON rooms(created_by)      WHERE is_active = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_active   ON scheduled_sessions(scheduled_at ASC) WHERE is_active = true`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_interests_session ON session_interests(session_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_google      ON users(google_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email)`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'GD',
        subcategory VARCHAR(50),
        scheduled_at TIMESTAMP NOT NULL,
        created_by UUID REFERENCES users(id),
        admin_username VARCHAR(100),
        room_code VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_interests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(session_id, user_id)
      )
    `);
    console.log('✓ Schema up to date');

    const server = app.listen(PORT, () =>
      console.log(`SSBCircle backend running on port ${PORT}`)
    );

    startCleanup();

    // ── Graceful shutdown (PM2 / Docker send SIGTERM on restart/deploy) ───────
    function shutdown(signal) {
      console.log(`\n${signal} received — shutting down gracefully`);
      server.close(async () => {
        await pool.end().catch(() => {});
        console.log('Server and DB pool closed. Bye.');
        process.exit(0);
      });
      // Force-exit if graceful shutdown takes > 10 s
      setTimeout(() => process.exit(1), 10_000);
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
