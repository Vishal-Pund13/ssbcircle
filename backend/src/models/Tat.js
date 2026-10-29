const pool = require('../db');

// TAT practice attempts: the picture, the story the aspirant wrote, and the
// feedback it got. Kept so they can re-read feedback and see the spread of
// their stories over time — an assessor reads a whole series, not one story.
// Every query is scoped to one user; stories are personal writing.

// Attempts today, on an IST day boundary to match the aspirant's midnight.
async function usedToday(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM tat_attempts
      WHERE user_id = $1
        AND (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
    [userId]
  );
  return rows[0].n;
}

async function recent(userId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT id, picture_id, story, analysis, created_at
       FROM tat_attempts WHERE user_id = $1
      ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function save(userId, pictureId, story, analysis) {
  const { rows } = await pool.query(
    `INSERT INTO tat_attempts (user_id, picture_id, story, analysis)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, picture_id, story, analysis, created_at`,
    [userId, pictureId, story, JSON.stringify(analysis)]
  );
  return rows[0];
}

module.exports = { usedToday, recent, save };
