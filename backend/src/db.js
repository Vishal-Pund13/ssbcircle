const { Pool, types } = require('pg');

// TIMESTAMP WITHOUT TIME ZONE (OID 1114) comes back from pg without a 'Z',
// so browsers treat it as local time instead of UTC. Append 'Z' so it is
// always parsed as UTC regardless of the client's timezone.
types.setTypeParser(1114, str => str ? new Date(str + 'Z') : null);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
