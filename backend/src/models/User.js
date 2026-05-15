const bcrypt = require('bcrypt');
const pool = require('../db');

async function generateUniqueUsername(base) {
  const clean = base.replace(/[^a-z0-9_]/gi, '').slice(0, 18).toLowerCase() || 'user';
  let attempt = clean;
  let i = 1;
  while (true) {
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [attempt]);
    if (rows.length === 0) return attempt;
    attempt = `${clean}${i++}`;
  }
}

async function createUser(username, displayName, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, display_name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, display_name, created_at`,
    [username.toLowerCase(), displayName, passwordHash]
  );
  return rows[0];
}

async function createGoogleUser(googleId, email, displayName, avatarUrl) {
  const username = await generateUniqueUsername(email.split('@')[0]);
  const { rows } = await pool.query(
    `INSERT INTO users (username, display_name, google_id, email, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, display_name, email, avatar_url, created_at`,
    [username, displayName, googleId, email, avatarUrl]
  );
  return rows[0];
}

async function linkGoogleToUser(userId, googleId, avatarUrl) {
  const { rows } = await pool.query(
    `UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2)
     WHERE id = $3
     RETURNING id, username, display_name, email, avatar_url, created_at`,
    [googleId, avatarUrl, userId]
  );
  return rows[0];
}

async function findByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findByGoogleId(googleId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.email, u.avatar_url, u.created_at,
            COUNT(r.id)::int AS rooms_created
     FROM users u
     LEFT JOIN rooms r ON r.created_by = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );
  return rows[0] || null;
}

async function verifyPassword(plaintext, hash) {
  if (!hash) return false;
  return bcrypt.compare(plaintext, hash);
}

module.exports = {
  createUser, createGoogleUser, linkGoogleToUser,
  findByUsername, findByEmail, findByGoogleId, findById,
  verifyPassword,
};
