const pool = require('../db');

// Everything the v2 admin dashboard shows, for the last N days, in one call.
//
// Days are Indian days: a chart bar for "29 Oct" means 29 Oct in IST. Tables
// from v2 store TIMESTAMPTZ; older ones (users, rooms, sessions) store naive
// UTC timestamps, so the two need different conversions.

const istTz    = col => `(${col} AT TIME ZONE 'Asia/Kolkata')::date`;
const istNaive = col => `((${col} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date`;
const SINCE    = `((NOW() AT TIME ZONE 'Asia/Kolkata')::date - ($1::int - 1))`;   // first IST day in range

const q = (sql, params) => pool.query(sql, params).then(r => r.rows);
const one = (sql, params) => q(sql, params).then(rows => rows[0] || {});

async function overview(days) {
  const p = [days];

  const [
    totals, daily, sections, sectionDaily,
    tat, tatVerdicts, tatPictures, piq, prep, news, topArticles, community, rooms,
    eligibility, events, llmByFeature, llmByModel, llmErrors, llmDaily,
    feedbackByFeature, feedbackRecent, funnel,
  ] = await Promise.all([
    // ── Headline numbers ──
    one(`
      SELECT
        (SELECT count(*)::int FROM users) AS users_total,
        (SELECT count(*)::int FROM users WHERE ${istNaive('created_at')} >= ${SINCE}) AS users_new,
        (SELECT count(DISTINCT visitor_id)::int FROM app_events WHERE ${istTz('created_at')} >= ${SINCE}) AS visitors,
        (SELECT count(*)::int FROM app_events WHERE event = 'page_view' AND ${istTz('created_at')} >= ${SINCE}) AS page_views,
        (SELECT count(*)::int FROM llm_calls WHERE ${istTz('created_at')} >= ${SINCE}) AS llm_calls,
        (SELECT count(*)::int FROM llm_calls WHERE NOT ok AND ${istTz('created_at')} >= ${SINCE}) AS llm_failed,
        (SELECT count(*)::int FROM ai_feedback WHERE ${istTz('created_at')} >= ${SINCE}) AS feedback_total,
        (SELECT count(*)::int FROM ai_feedback WHERE helpful AND ${istTz('created_at')} >= ${SINCE}) AS feedback_helpful,
        (SELECT count(DISTINCT u)::int FROM (
           SELECT user_id u FROM app_events WHERE user_id IS NOT NULL AND ${istTz('created_at')} >= ${SINCE}
           UNION SELECT user_id FROM tat_attempts WHERE ${istTz('created_at')} >= ${SINCE}
           UNION SELECT user_id FROM piq WHERE ${istTz('updated_at')} >= ${SINCE}
           UNION SELECT user_id FROM prep_activity WHERE day >= ${SINCE}
         ) a) AS users_active
    `, p),

    // ── One row per day ──
    q(`
      WITH d AS (SELECT generate_series(${SINCE}, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, '1 day')::date AS day)
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
        (SELECT count(DISTINCT visitor_id)::int FROM app_events WHERE ${istTz('created_at')} = d.day) AS visitors,
        (SELECT count(*)::int FROM app_events WHERE event = 'page_view' AND ${istTz('created_at')} = d.day) AS page_views,
        (SELECT count(*)::int FROM users WHERE ${istNaive('created_at')} = d.day) AS signups,
        (SELECT count(*)::int FROM tat_attempts WHERE ${istTz('created_at')} = d.day) AS tat,
        (SELECT count(*)::int FROM llm_calls WHERE feature = 'piq' AND ok AND ${istTz('created_at')} = d.day) AS piq_analyses,
        (SELECT coalesce(sum(actions), 0)::int FROM prep_activity WHERE day = d.day) AS prep_actions,
        (SELECT count(*)::int FROM llm_calls WHERE ${istTz('created_at')} = d.day) AS llm_calls
      FROM d ORDER BY d.day
    `, p),

    // ── Sections: where people spend their visits ──
    q(`
      SELECT section, count(*)::int AS views, count(DISTINCT visitor_id)::int AS visitors,
             count(DISTINCT user_id)::int AS users
        FROM app_events
       WHERE event = 'page_view' AND ${istTz('created_at')} >= ${SINCE}
       GROUP BY section ORDER BY views DESC
    `, p),
    q(`
      SELECT section, to_char(${istTz('created_at')}, 'YYYY-MM-DD') AS day, count(*)::int AS views
        FROM app_events
       WHERE event = 'page_view' AND ${istTz('created_at')} >= ${SINCE}
       GROUP BY 1, 2
    `, p),

    // ── Features ──
    one(`
      SELECT count(*)::int AS attempts, count(DISTINCT user_id)::int AS users,
             coalesce(round(avg(array_length(regexp_split_to_array(trim(story), '\\s+'), 1))), 0)::int AS avg_words,
             count(*) FILTER (WHERE analysis ? 'from_your_life')::int AS with_piq,
             (SELECT count(*)::int FROM tat_attempts) AS all_time
        FROM tat_attempts WHERE ${istTz('created_at')} >= ${SINCE}
    `, p),
    q(`
      SELECT coalesce(analysis->'picture_fit'->>'verdict', 'none') AS verdict, count(*)::int AS n
        FROM tat_attempts WHERE ${istTz('created_at')} >= ${SINCE} GROUP BY 1 ORDER BY n DESC
    `, p),
    q(`
      SELECT picture_id, count(*)::int AS n FROM tat_attempts
       WHERE ${istTz('created_at')} >= ${SINCE} GROUP BY 1 ORDER BY n DESC LIMIT 8
    `, p),
    one(`
      SELECT (SELECT count(*)::int FROM piq) AS saved_total,
             (SELECT count(*)::int FROM piq WHERE ${istTz('updated_at')} >= ${SINCE}) AS saved_in_range,
             (SELECT count(*)::int FROM piq WHERE analysis IS NOT NULL) AS with_report,
             (SELECT count(*)::int FROM llm_calls WHERE feature = 'piq' AND ok AND ${istTz('created_at')} >= ${SINCE}) AS analyses
    `, p),
    one(`
      SELECT coalesce(sum(actions), 0)::int AS actions, count(DISTINCT user_id)::int AS users,
             coalesce(sum(feedback_count), 0)::int AS speaks, coalesce(sum(stt_count), 0)::int AS transcriptions,
             (SELECT count(*)::int FROM prep_progress WHERE status = 2) AS can_speak_total,
             (SELECT count(*)::int FROM prep_progress WHERE status >= 1) AS read_total
        FROM prep_activity WHERE day >= ${SINCE}
    `, p),
    one(`
      SELECT count(*)::int AS views, count(DISTINCT visitor_id)::int AS readers,
             count(completed_at)::int AS completed
        FROM article_views WHERE ${istTz('viewed_at')} >= ${SINCE}
    `, p),
    q(`
      SELECT v.article_slug AS slug, coalesce(a.title, v.article_slug) AS title,
             count(*)::int AS views, count(v.completed_at)::int AS completed
        FROM article_views v LEFT JOIN articles a ON a.slug = v.article_slug
       WHERE ${istTz('v.viewed_at')} >= ${SINCE}
       GROUP BY 1, 2 ORDER BY views DESC LIMIT 6
    `, p),
    one(`
      SELECT (SELECT count(*)::int FROM posts WHERE deleted_at IS NULL AND ${istTz('created_at')} >= ${SINCE}) AS posts,
             (SELECT count(*)::int FROM post_comments WHERE deleted_at IS NULL AND ${istTz('created_at')} >= ${SINCE}) AS comments,
             (SELECT count(*)::int FROM post_votes) AS votes_total
    `, p),
    one(`
      SELECT (SELECT count(*)::int FROM rooms WHERE ${istNaive('created_at')} >= ${SINCE}) AS rooms_created,
             (SELECT count(*)::int FROM scheduled_sessions WHERE ${istNaive('created_at')} >= ${SINCE}) AS scheduled,
             (SELECT count(*)::int FROM session_interests WHERE ${istNaive('created_at')} >= ${SINCE}) AS im_in
    `, p),
    one(`
      SELECT count(*)::int AS checks, count(DISTINCT visitor_id)::int AS people,
             coalesce(round(avg((meta->>'eligible')::int), 1), 0) AS avg_eligible
        FROM app_events WHERE event = 'eligibility_check' AND ${istTz('created_at')} >= ${SINCE}
    `, p),
    q(`
      SELECT event, count(*)::int AS n, count(DISTINCT visitor_id)::int AS people
        FROM app_events WHERE event <> 'page_view' AND ${istTz('created_at')} >= ${SINCE}
       GROUP BY event ORDER BY n DESC
    `, p),

    // ── AI ──
    q(`
      SELECT feature, count(*)::int AS calls, count(*) FILTER (WHERE ok)::int AS ok,
             count(*) FILTER (WHERE fallback)::int AS fallbacks,
             count(DISTINCT user_id)::int AS users,
             coalesce(round(avg(latency_ms) FILTER (WHERE ok)), 0)::int AS avg_ms,
             coalesce(round(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) FILTER (WHERE ok)), 0)::int AS p95_ms,
             coalesce(sum(input_tokens), 0)::bigint AS input_tokens,
             coalesce(sum(output_tokens), 0)::bigint AS output_tokens
        FROM llm_calls WHERE ${istTz('created_at')} >= ${SINCE}
       GROUP BY feature ORDER BY calls DESC
    `, p),
    q(`
      SELECT provider, coalesce(model, '—') AS model, count(*)::int AS calls, count(*) FILTER (WHERE ok)::int AS ok,
             coalesce(sum(input_tokens), 0)::bigint AS input_tokens, coalesce(sum(output_tokens), 0)::bigint AS output_tokens
        FROM llm_calls WHERE ${istTz('created_at')} >= ${SINCE}
       GROUP BY 1, 2 ORDER BY calls DESC
    `, p),
    q(`
      SELECT error_code, count(*)::int AS n, max(created_at) AS last_at
        FROM llm_calls WHERE NOT ok AND ${istTz('created_at')} >= ${SINCE}
       GROUP BY 1 ORDER BY n DESC
    `, p),
    q(`
      WITH d AS (SELECT generate_series(${SINCE}, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, '1 day')::date AS day)
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
             count(c.id) FILTER (WHERE c.ok)::int AS ok, count(c.id) FILTER (WHERE NOT c.ok)::int AS failed
        FROM d LEFT JOIN llm_calls c ON ${istTz('c.created_at')} = d.day
       GROUP BY d.day ORDER BY d.day
    `, p),

    // ── Feedback on AI reports ──
    q(`
      SELECT feature, count(*)::int AS total, count(*) FILTER (WHERE helpful)::int AS helpful
        FROM ai_feedback WHERE ${istTz('created_at')} >= ${SINCE} GROUP BY 1
    `, p),
    // TAT stories are shown with their feedback so the prompt can be judged
    // against real output. PIQ content is not: it holds private family detail.
    q(`
      SELECT f.id, f.feature, f.helpful, f.comment, f.created_at, u.display_name,
             CASE WHEN f.feature = 'tat' THEN t.picture_id END AS picture_id,
             CASE WHEN f.feature = 'tat' THEN left(t.story, 600) END AS story,
             CASE WHEN f.feature = 'tat' THEN t.analysis->>'summary' END AS ai_summary,
             CASE WHEN f.feature = 'tat' THEN t.analysis->'picture_fit'->>'verdict' END AS verdict
        FROM ai_feedback f
        JOIN users u ON u.id = f.user_id
        LEFT JOIN tat_attempts t ON f.feature = 'tat' AND t.id::text = f.ref_id
       WHERE ${istTz('f.created_at')} >= ${SINCE}
       ORDER BY f.created_at DESC LIMIT 40
    `, p),

    // ── Funnel for people who signed up in the range ──
    one(`
      WITH n AS (SELECT id FROM users WHERE ${istNaive('created_at')} >= ${SINCE}),
      used AS (
        SELECT user_id FROM tat_attempts UNION SELECT user_id FROM piq UNION SELECT user_id FROM prep_progress
      ),
      days AS (
        SELECT user_id, ${istTz('created_at')} AS d FROM app_events WHERE user_id IS NOT NULL
        UNION SELECT user_id, ${istTz('created_at')} FROM tat_attempts
        UNION SELECT user_id, day FROM prep_activity
      ),
      back AS (SELECT user_id FROM days GROUP BY user_id HAVING count(DISTINCT d) >= 2)
      SELECT (SELECT count(*)::int FROM n) AS signed_up,
             (SELECT count(*)::int FROM n WHERE id IN (SELECT user_id FROM used)) AS used_a_tool,
             (SELECT count(*)::int FROM n WHERE id IN (SELECT user_id FROM back)) AS came_back
    `, p),
  ]);

  return {
    days, generated_at: new Date().toISOString(),
    totals, daily, sections, section_daily: sectionDaily,
    features: {
      tat: { ...tat, verdicts: tatVerdicts, pictures: tatPictures },
      piq, prep, news: { ...news, top: topArticles }, community, rooms, eligibility,
    },
    events,
    llm: { by_feature: llmByFeature, by_model: llmByModel, errors: llmErrors, daily: llmDaily },
    feedback: { by_feature: feedbackByFeature, recent: feedbackRecent },
    funnel,
  };
}

module.exports = { overview };
