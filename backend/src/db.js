const { Pool, types } = require('pg');

// TIMESTAMP WITHOUT TIME ZONE (OID 1114) is returned without 'Z', so browsers
// treat it as local time instead of UTC. Append 'Z' so all timestamps are UTC.
types.setTypeParser(1114, str => str ? new Date(str + 'Z') : null);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,                 // Neon free tier — fewer long-lived connections is better
  idleTimeoutMillis: 10000,   // Release idle connections quickly so Neon doesn't suspend
  connectionTimeoutMillis: 8000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
