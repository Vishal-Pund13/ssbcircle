require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const roomsRouter = require('./routes/rooms');
const authRouter  = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/admin', adminRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Migrations for existing users table
    await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`).catch(() => {});
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);

    // Rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic VARCHAR(255) NOT NULL,
        room_code VARCHAR(10) UNIQUE NOT NULL,
        jitsi_room_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        participant_count INT DEFAULT 0,
        created_by UUID REFERENCES users(id),
        admin_username VARCHAR(100)
      )
    `);

    // Safe migrations for existing rooms table
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100)`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GD'`);
    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50)`);

    app.listen(PORT, () => console.log(`SSBCircle backend running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
