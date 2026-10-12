const pool = require('../db');

// The aspirant's Personal Information Questionnaire, one per user.
//
// The paper form has four repeating tables — education, sports, extra-curricular
// activities and previous interviews — on top of roughly thirty flat fields.
// Modelling that relationally would mean six tables for a document that is only
// ever read and written whole, so it lives as a single JSONB blob keyed by user.
//
// This row holds sensitive personal data: religion, category, date of birth,
// family income and addresses. It must never be joined into a public query or
// returned by any endpoint other than the owner's own. Every function here is
// scoped to one user id for that reason — there is deliberately no "list all".

async function getForUser(userId) {
  const { rows } = await pool.query(
    `SELECT data, updated_at FROM piq WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

async function saveForUser(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO piq (user_id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET data = EXCLUDED.data, updated_at = NOW()
     RETURNING data, updated_at`,
    [userId, JSON.stringify(data)]
  );
  return rows[0];
}

// A real delete, not a flag. The welcome screen and this form both promise the
// aspirant can remove what they gave us, and a soft delete would not honour it.
async function removeForUser(userId) {
  const { rowCount } = await pool.query(`DELETE FROM piq WHERE user_id = $1`, [userId]);
  return rowCount > 0;
}

module.exports = { getForUser, saveForUser, removeForUser };
