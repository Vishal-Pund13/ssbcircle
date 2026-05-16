require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const pool    = require('./db');
const { authLimiter, createRoomLimiter, generalLimiter } = require('./middleware/rateLimit');
const roomsRouter = require('./routes/rooms');
const authRouter  = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Trust proxy (Render / Railway / Heroku sit behind one) ───────────────────
// Needed so rate-limiter reads the real client IP, not the proxy IP
app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS db_time');
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
async function start() {
  try {
    await pool.query('SELECT 1'); // verify DB connectivity — migrations run separately
    console.log('✓ Database connected');

    const server = app.listen(PORT, () =>
      console.log(`SSBCircle backend running on port ${PORT}`)
    );

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
