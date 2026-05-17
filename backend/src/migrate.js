/**
 * Run this once before deploying: npm run migrate
 * Safe to run multiple times — all statements are idempotent.
 */
require('dotenv').config();
const pool = require('./db');

async function migrate() {
  console.log('Running migrations…');

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
  console.log('✓ users table');

  // Safe column additions (already-existing columns are silently skipped)
  const userCols = [
    `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
  ];
  for (const sql of userCols) {
    await pool.query(sql).catch(() => {});
  }
  console.log('✓ users columns');

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
  console.log('✓ rooms table');

  const roomCols = [
    `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`,
    `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100)`,
    `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GD'`,
    `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50)`,
    `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS emptied_at TIMESTAMP`,
  ];
  for (const sql of roomCols) {
    await pool.query(sql).catch(() => {});
  }
  console.log('✓ rooms columns');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scheduled_sessions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic        VARCHAR(255) NOT NULL,
      description  TEXT,
      category     VARCHAR(50) DEFAULT 'GD',
      subcategory  VARCHAR(50),
      scheduled_at TIMESTAMP NOT NULL,
      created_by   UUID REFERENCES users(id),
      admin_username VARCHAR(100),
      room_code    VARCHAR(10),
      is_active    BOOLEAN DEFAULT true,
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✓ scheduled_sessions table');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session_interests (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES scheduled_sessions(id) ON DELETE CASCADE,
      user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(session_id, user_id)
    )
  `);
  console.log('✓ session_interests table');

  console.log('\nAll migrations complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
