const jwt = require('jsonwebtoken');
const webpush = require('web-push');
const pool = require('./db');
const { sendNotificationEmail } = require('./email');
const { hourIST } = require('./time');

// Notifications: one call, three channels.
//
//   notify({ userIds, actorId, type, groupKey, title, body, link, email })
//
// Every recipient (never the actor) gets a row in `notifications`, shown in
// the bell. Rows for the same thing — replies on one post — are bundled:
// within BUNDLE_MS an unread row is updated ("3 new replies…") instead of a
// new one being added. On top of the bell:
//
//   - phone push, unless it is quiet hours in India (23:00–07:00), the person
//     turned it off, or they are looking at that very page right now;
//   - email, at most once per bundle and only if they are not on the site.
//
// Called after the HTTP response is sent; failures are logged, never thrown.

const BUNDLE_MS = 60 * 60 * 1000;          // replies within an hour share one notification
const PUSH_GAP_MS = 10 * 60 * 1000;        // at most one push per bundle every 10 minutes
const QUIET = h => h >= 23 || h < 7;       // IST hours with no phone alerts

const PUSH_READY = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (PUSH_READY) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@ssbcircle.com',
    process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
} else {
  console.log('[notify] VAPID keys not set — phone push is off; bell and email still work');
}

// Preference keys stored in users.notify_prefs; missing means on
const PREF = { reply: 'replies', room: 'rooms' };
const wants = (prefs, type, channel) => (prefs || {})[`${PREF[type] || type}_${channel}`] !== false;

function unsubscribeUrl(userId) {
  const t = jwt.sign({ uid: userId, purpose: 'email-unsub' }, process.env.JWT_SECRET, { expiresIn: '180d' });
  return `${process.env.API_PUBLIC_URL || 'https://ssbcircle.onrender.com'}/api/notifications/unsubscribe?t=${t}`;
}

async function sendPush(userId, payload) {
  if (!PUSH_READY) return false;
  const { rows: subs } = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [userId]);
  let sent = false;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' });
      sent = true;
      pool.query('UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = $1', [s.id]).catch(() => {});
    } catch (err) {
      // 404/410: the browser dropped this subscription — forget it
      if (err.statusCode === 404 || err.statusCode === 410) {
        pool.query('DELETE FROM push_subscriptions WHERE id = $1', [s.id]).catch(() => {});
      } else {
        console.error('[notify] push failed:', err.statusCode || err.message);
      }
    }
  }
  return sent;
}

async function notifyOne({ userId, actorId, kind, type, groupKey, title, bundleTitle, body, link, email, force }) {
  // Bundle into an unread row for the same thing from the last hour, if any
  const { rows: [existing] } = await pool.query(`
    SELECT id, count, pushed_at, emailed_at FROM notifications
    WHERE user_id = $1 AND group_key = $2 AND read_at IS NULL AND updated_at > NOW() - ($3 || ' milliseconds')::interval
    ORDER BY updated_at DESC LIMIT 1`, [userId, groupKey, String(BUNDLE_MS)]);

  let row;
  if (existing) {
    const count = existing.count + 1;
    const { rows } = await pool.query(`
      UPDATE notifications SET count = $2, title = $3, body = $4, actor_id = $5, updated_at = NOW()
      WHERE id = $1 RETURNING *`, [existing.id, count, bundleTitle ? bundleTitle(count) : title, body, actorId || null]);
    row = rows[0];
  } else {
    const { rows } = await pool.query(`
      INSERT INTO notifications (user_id, actor_id, kind, group_key, title, body, link)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [userId, actorId || null, kind, groupKey, title, body, link]);
    row = rows[0];
  }

  const { rows: [user] } = await pool.query(`
    SELECT u.email, u.display_name, u.notify_prefs,
           (SELECT p.path FROM presence p WHERE p.user_id = u.id AND p.last_seen > NOW() - INTERVAL '90 seconds'
            ORDER BY p.last_seen DESC LIMIT 1) AS online_path
    FROM users u WHERE u.id = $1`, [userId]);
  if (!user) return;
  const online = !!user.online_path;
  const onThisPage = online && user.online_path === link.split('?')[0];

  const pushedRecently = row.pushed_at && Date.now() - new Date(row.pushed_at) < PUSH_GAP_MS;
  if (force || (!onThisPage && !pushedRecently && !QUIET(hourIST()) && wants(user.notify_prefs, type, 'push'))) {
    const ok = await sendPush(userId, { title: row.title, body: row.body || '', url: link, tag: groupKey });
    if (ok) await pool.query('UPDATE notifications SET pushed_at = NOW() WHERE id = $1', [row.id]);
  }

  if (email && !online && !row.emailed_at && user.email && wants(user.notify_prefs, type, 'email')) {
    await sendNotificationEmail({ to: user.email, name: (user.display_name || '').split(' ')[0], title: row.title,
      body: row.body, link, unsubscribeUrl: unsubscribeUrl(userId) });
    await pool.query('UPDATE notifications SET emailed_at = NOW() WHERE id = $1', [row.id]);
  }
}

// type: 'reply' | 'room' (which preference governs it); kind: finer label for the bell icon
// force: skip quiet hours and the on-this-page check (the Profile test button only)
function notify({ userIds, actorId, kind, type, groupKey, title, bundleTitle, body, link, email = true, force = false }) {
  const targets = [...new Set(userIds)].filter(id => id && id !== actorId);
  Promise.all(targets.map(userId =>
    notifyOne({ userId, actorId, kind, type, groupKey, title: typeof title === 'function' ? title(userId) : title,
      bundleTitle, body, link, email, force })
      .catch(err => console.error('[notify] failed:', err.message))
  )).catch(() => {});
}

module.exports = { notify, PUSH_READY };
