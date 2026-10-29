const pool = require('../db');

// The moderator programme: who opted in, how their trial is going, and who is
// quietly doing the work without having applied.
//
// Everyone is scored the same way from what they actually do on the platform.
// The weights and targets are shown to aspirants on /moderators, so keep the
// two in step (frontend/src/data/moderatorProgram.js).

const TRIAL_DAYS = 14;

const WEIGHTS = { hosted: 10, posts: 5, replies: 2, upvotes: 1, reports: 5, feedback: 3, im_in: 2, active_days: 1 };
const CAPS    = { reports: 5, feedback: 5 };   // so nobody farms points by spamming either
const TARGETS = { hosted: 2, replies: 8, active_days: 7, score: 60 };

// Activity since a moment, for everyone (or only the given users), best first.
// Older tables (rooms, sessions, reports, interests) hold naive UTC times.
async function activity({ since, userIds = null, limit = 50 }) {
  const { rows } = await pool.query(`
    WITH s AS (SELECT $1::timestamptz AS t),
    hosted AS (
      SELECT created_by AS u, count(DISTINCT room_code)::int AS n FROM (
        SELECT created_by, room_code, created_at FROM rooms
        UNION ALL SELECT created_by, room_code, created_at FROM scheduled_sessions
      ) x, s WHERE created_by IS NOT NULL AND x.created_at >= (s.t AT TIME ZONE 'UTC') GROUP BY 1
    ),
    posted AS (SELECT author_id AS u, count(*)::int AS n FROM posts, s
               WHERE author_id IS NOT NULL AND deleted_at IS NULL AND created_at >= s.t GROUP BY 1),
    replies AS (SELECT c.author_id AS u, count(*)::int AS n FROM post_comments c JOIN posts p ON p.id = c.post_id, s
                 WHERE c.author_id IS NOT NULL AND c.deleted_at IS NULL AND c.author_id IS DISTINCT FROM p.author_id
                   AND c.created_at >= s.t GROUP BY 1),
    upvotes AS (SELECT p.author_id AS u, count(*)::int AS n FROM post_votes v JOIN posts p ON p.id = v.post_id, s
                 WHERE p.author_id IS NOT NULL AND v.user_id <> p.author_id AND v.created_at >= s.t GROUP BY 1),
    reports AS (SELECT reporter_id AS u, count(*)::int AS n FROM user_reports, s
                 WHERE reporter_id IS NOT NULL AND created_at >= (s.t AT TIME ZONE 'UTC') GROUP BY 1),
    feedback AS (SELECT user_id AS u, count(*)::int AS n FROM platform_feedback, s WHERE created_at >= s.t GROUP BY 1),
    im_in AS (SELECT user_id AS u, count(*)::int AS n FROM session_interests, s
               WHERE created_at >= (s.t AT TIME ZONE 'UTC') GROUP BY 1),
    days AS (
      SELECT u, count(DISTINCT d)::int AS n FROM (
        SELECT user_id u, (created_at AT TIME ZONE 'Asia/Kolkata')::date d FROM app_events, s WHERE user_id IS NOT NULL AND created_at >= s.t
        UNION SELECT user_id, day FROM prep_activity, s WHERE day >= (s.t AT TIME ZONE 'Asia/Kolkata')::date
        UNION SELECT user_id, (created_at AT TIME ZONE 'Asia/Kolkata')::date FROM tat_attempts, s WHERE created_at >= s.t
        UNION SELECT author_id, (created_at AT TIME ZONE 'Asia/Kolkata')::date FROM posts, s WHERE author_id IS NOT NULL AND created_at >= s.t
        UNION SELECT author_id, (created_at AT TIME ZONE 'Asia/Kolkata')::date FROM post_comments, s WHERE author_id IS NOT NULL AND created_at >= s.t
      ) a GROUP BY u
    ),
    people AS (
      SELECT u FROM hosted UNION SELECT u FROM posted UNION SELECT u FROM replies UNION SELECT u FROM upvotes
      UNION SELECT u FROM reports UNION SELECT u FROM feedback UNION SELECT u FROM im_in UNION SELECT u FROM days
    )
    SELECT usr.id AS user_id, usr.display_name, usr.email, usr.phone, usr.avatar_url,
           coalesce(usr.is_moderator, false) AS is_moderator, usr.created_at AS joined_at,
           coalesce(h.n, 0) AS hosted, coalesce(p.n, 0) AS posts, coalesce(r.n, 0) AS replies,
           coalesce(v.n, 0) AS upvotes, coalesce(rp.n, 0) AS reports, coalesce(f.n, 0) AS feedback,
           coalesce(i.n, 0) AS im_in, coalesce(d.n, 0) AS active_days
      FROM people pe
      JOIN users usr ON usr.id = pe.u
      LEFT JOIN hosted h ON h.u = pe.u   LEFT JOIN posted p ON p.u = pe.u   LEFT JOIN replies r ON r.u = pe.u
      LEFT JOIN upvotes v ON v.u = pe.u  LEFT JOIN reports rp ON rp.u = pe.u LEFT JOIN feedback f ON f.u = pe.u
      LEFT JOIN im_in i ON i.u = pe.u    LEFT JOIN days d ON d.u = pe.u
     WHERE coalesce(usr.is_banned, false) = false
       AND ($2::uuid[] IS NULL OR usr.id = ANY($2::uuid[]))
  `, [since, userIds]);

  return rows
    .map(r => ({ ...r, score: scoreOf(r), on_track: meetsTargets(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function scoreOf(r) {
  return Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * Math.min(r[k] || 0, CAPS[k] ?? Infinity), 0);
}

function meetsTargets(r) {
  return r.hosted >= TARGETS.hosted && r.replies >= TARGETS.replies
    && r.active_days >= TARGETS.active_days && scoreOf(r) >= TARGETS.score;
}

const daysAgo = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function getApplication(userId) {
  const { rows } = await pool.query(`SELECT * FROM moderator_applications WHERE user_id = $1`, [userId]);
  return rows[0] || null;
}

// The aspirant's own view: status, and activity since their trial began
// (or over the last two weeks if they have not opted in).
async function mine(userId) {
  const app = await getApplication(userId);
  const since = app?.trial_started_at && ['trial', 'invited'].includes(app.status) ? app.trial_started_at : daysAgo(TRIAL_DAYS);
  const [act] = await activity({ since, userIds: [userId], limit: 1 });
  const { rows } = await pool.query(`SELECT coalesce(is_moderator, false) AS is_moderator FROM users WHERE id = $1`, [userId]);
  return {
    application: app,
    is_moderator: rows[0]?.is_moderator || false,
    activity: act || { hosted: 0, posts: 0, replies: 0, upvotes: 0, reports: 0, feedback: 0, im_in: 0, active_days: 0, score: 0, on_track: false },
    weights: WEIGHTS, caps: CAPS, targets: TARGETS, trial_days: TRIAL_DAYS,
  };
}

async function apply(userId, { motivation, availability }) {
  const { rows } = await pool.query(`
    INSERT INTO moderator_applications (user_id, status, motivation, availability, trial_started_at, trial_ends_at)
    VALUES ($1, 'trial', $2, $3, NOW(), NOW() + make_interval(days => ${TRIAL_DAYS}))
    ON CONFLICT (user_id) DO UPDATE
      SET status = 'trial', motivation = EXCLUDED.motivation, availability = EXCLUDED.availability,
          trial_started_at = NOW(), trial_ends_at = NOW() + make_interval(days => ${TRIAL_DAYS}),
          decided_at = NULL, updated_at = NOW()
    RETURNING *`, [userId, motivation, availability]);
  return rows[0];
}

async function withdraw(userId) {
  await pool.query(`UPDATE moderator_applications SET status = 'withdrawn', updated_at = NOW() WHERE user_id = $1`, [userId]);
}

// ── Admin ────────────────────────────────────────────────────────────────────

async function adminOverview() {
  const { rows: apps } = await pool.query(`
    SELECT a.*, u.display_name, u.email, u.phone, u.avatar_url
      FROM moderator_applications a JOIN users u ON u.id = a.user_id
     ORDER BY CASE a.status WHEN 'trial' THEN 0 WHEN 'review' THEN 1 WHEN 'invited' THEN 2 ELSE 3 END, a.updated_at DESC`);

  // Each applicant scored over their own trial window
  const scored = await Promise.all(apps.map(async a => {
    const since = a.trial_started_at || daysAgo(TRIAL_DAYS);
    const [act] = await activity({ since, userIds: [a.user_id], limit: 1 });
    return { ...a, activity: act || null };
  }));

  // Rising contributors: the last two weeks, everyone who has not applied
  const applied = new Set(apps.map(a => a.user_id));
  const rising = (await activity({ since: daysAgo(TRIAL_DAYS), limit: 60 }))
    .filter(r => !applied.has(r.user_id) && !r.is_moderator && r.score > 0)
    .slice(0, 20);

  const { rows: mods } = await pool.query(`
    SELECT id AS user_id, display_name, email, phone, moderator_since FROM users WHERE is_moderator ORDER BY moderator_since DESC NULLS LAST`);

  return { applications: scored, rising, moderators: mods, weights: WEIGHTS, targets: TARGETS };
}

// status: approved | declined | review | invited
async function decide(userId, status, note) {
  await pool.query(`
    INSERT INTO moderator_applications (user_id, status, admin_note, decided_at, trial_started_at, trial_ends_at)
    VALUES ($1, $2, $3, CASE WHEN $2 IN ('approved', 'declined') THEN NOW() END,
            CASE WHEN $2 = 'invited' THEN NOW() END,
            CASE WHEN $2 = 'invited' THEN NOW() + make_interval(days => ${TRIAL_DAYS}) END)
    ON CONFLICT (user_id) DO UPDATE
      SET status = EXCLUDED.status, admin_note = coalesce(EXCLUDED.admin_note, moderator_applications.admin_note),
          decided_at = EXCLUDED.decided_at, updated_at = NOW()`, [userId, status, note || null]);
  if (status === 'approved') {
    await pool.query(`UPDATE users SET is_moderator = true, moderator_since = coalesce(moderator_since, NOW()) WHERE id = $1`, [userId]);
  }
}

async function removeModerator(userId) {
  await pool.query(`UPDATE users SET is_moderator = false WHERE id = $1`, [userId]);
  await pool.query(`UPDATE moderator_applications SET status = 'removed', updated_at = NOW() WHERE user_id = $1`, [userId]);
}

module.exports = { activity, mine, apply, withdraw, adminOverview, decide, removeModerator, WEIGHTS, TARGETS, TRIAL_DAYS };
