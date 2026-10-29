const pool = require('../db');

// An aspirant's progress through the prep sheet, plus a per-day activity count
// for the streak. Every function is scoped to one user id.

const TODAY = `(NOW() AT TIME ZONE 'Asia/Kolkata')::date`;

// Days until the next revision, indexed by how many revisions have already
// gone well. After the last step the topic keeps coming back every 45 days.
const INTERVALS = [3, 7, 21, 45];

const FIELDS = `
  topic_id, status, starred, note,
  read_on::text AS read_on, spoken_on::text AS spoken_on,
  review_due::text AS review_due, reviews, attempt
`;

async function getAll(userId) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS} FROM prep_progress WHERE user_id = $1`,
    [userId]
  );
  return rows;
}

// The last 26 weeks — enough for the grid and any realistic streak.
async function getActivity(userId) {
  const { rows } = await pool.query(
    `SELECT day::text AS day, actions FROM prep_activity
      WHERE user_id = $1 AND day > ${TODAY} - 182
      ORDER BY day`,
    [userId]
  );
  return rows;
}

async function countTopics(userId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM prep_progress WHERE user_id = $1`,
    [userId]
  );
  return rows[0].n;
}

async function logActivity(userId) {
  await pool.query(
    `INSERT INTO prep_activity (user_id, day, actions) VALUES ($1, ${TODAY}, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET actions = prep_activity.actions + 1`,
    [userId]
  );
}

// patch may hold any of status, starred, note. Moving a topic forward stamps
// the day it happened; reaching "can speak" schedules the first revision.
// Moving it back clears what no longer holds.
async function update(userId, topicId, patch) {
  await pool.query(
    `INSERT INTO prep_progress (user_id, topic_id) VALUES ($1, $2)
     ON CONFLICT (user_id, topic_id) DO NOTHING`,
    [userId, topicId]
  );
  // Inside SET, "status" and the other columns still read the old row.
  const { rows } = await pool.query(
    `UPDATE prep_progress SET
        starred    = COALESCE($3::boolean, starred),
        note       = COALESCE($4::text, note),
        read_on    = CASE WHEN $5::int IS NULL THEN read_on
                          WHEN $5::int = 0 THEN NULL
                          WHEN read_on IS NULL THEN ${TODAY}
                          ELSE read_on END,
        spoken_on  = CASE WHEN $5::int IS NULL THEN spoken_on
                          WHEN $5::int < 2 THEN NULL
                          WHEN status < 2 THEN ${TODAY}
                          ELSE spoken_on END,
        review_due = CASE WHEN $5::int IS NULL THEN review_due
                          WHEN $5::int < 2 THEN NULL
                          WHEN status < 2 THEN ${TODAY} + ${INTERVALS[0]}
                          ELSE review_due END,
        reviews    = CASE WHEN $5::int < 2 THEN 0 ELSE reviews END,
        status     = COALESCE($5::int, status),
        updated_at = NOW()
      WHERE user_id = $1 AND topic_id = $2
      RETURNING ${FIELDS}`,
    [userId, topicId, patch.starred ?? null, patch.note ?? null, patch.status ?? null]
  );
  return rows[0];
}

// A revision of a "can speak" topic. Recalled pushes it further out; not
// recalled brings it back tomorrow and restarts the ladder.
async function review(userId, topicId, recalled) {
  const { rows } = await pool.query(
    `UPDATE prep_progress SET
        review_due = ${TODAY} + CASE WHEN $3::boolean THEN
                       (ARRAY[${INTERVALS.join(',')}])[LEAST(reviews + 2, ${INTERVALS.length})]
                     ELSE 1 END,
        reviews    = CASE WHEN $3::boolean THEN reviews + 1 ELSE 0 END,
        updated_at = NOW()
      WHERE user_id = $1 AND topic_id = $2 AND status = 2
      RETURNING ${FIELDS}`,
    [userId, topicId, recalled]
  );
  return rows[0] || null;
}

// How many AI feedback calls this aspirant has used today (IST).
async function feedbackUsedToday(userId) {
  const { rows } = await pool.query(
    `SELECT feedback_count FROM prep_activity WHERE user_id = $1 AND day = ${TODAY}`,
    [userId]
  );
  return rows[0] ? rows[0].feedback_count : 0;
}

// Counts one feedback call and one unit of activity for today.
async function logFeedback(userId) {
  await pool.query(
    `INSERT INTO prep_activity (user_id, day, actions, feedback_count) VALUES ($1, ${TODAY}, 1, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET
       actions = prep_activity.actions + 1,
       feedback_count = prep_activity.feedback_count + 1`,
    [userId]
  );
}

async function sttUsedToday(userId) {
  const { rows } = await pool.query(
    `SELECT stt_count FROM prep_activity WHERE user_id = $1 AND day = ${TODAY}`,
    [userId]
  );
  return rows[0] ? rows[0].stt_count : 0;
}

// Not counted as activity — transcribing is part of an attempt, and the
// feedback call that follows already counts it.
async function logStt(userId) {
  await pool.query(
    `INSERT INTO prep_activity (user_id, day, actions, stt_count) VALUES ($1, ${TODAY}, 0, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET stt_count = prep_activity.stt_count + 1`,
    [userId]
  );
}

// Keeps only the latest attempt per topic — enough to re-read the feedback,
// without turning the table into a recording archive.
async function saveAttempt(userId, topicId, attempt) {
  await pool.query(
    `INSERT INTO prep_progress (user_id, topic_id) VALUES ($1, $2)
     ON CONFLICT (user_id, topic_id) DO NOTHING`,
    [userId, topicId]
  );
  const { rows } = await pool.query(
    `UPDATE prep_progress SET attempt = $3::jsonb, updated_at = NOW()
      WHERE user_id = $1 AND topic_id = $2
      RETURNING ${FIELDS}`,
    [userId, topicId, JSON.stringify(attempt)]
  );
  return rows[0];
}

module.exports = {
  getAll, getActivity, countTopics, logActivity, update, review,
  feedbackUsedToday, logFeedback, saveAttempt, sttUsedToday, logStt,
};
