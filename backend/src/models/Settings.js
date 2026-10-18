const pool = require('../db');

// Small key/value store for things an admin changes at runtime, so a switch
// like "who may post in the community" does not need a deploy.
//
// Values are JSONB, so a setting can grow from a string into an object later
// without a migration.

async function get(key, fallback = null) {
  const { rows } = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
  return rows.length ? rows[0].value : fallback;
}

async function set(key, value) {
  const { rows } = await pool.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING value`,
    [key, JSON.stringify(value)]
  );
  return rows[0].value;
}

module.exports = { get, set };
