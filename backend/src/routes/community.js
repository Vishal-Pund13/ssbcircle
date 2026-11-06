const express = require('express');
const pool = require('../db');
const { notify, notifySubscribers } = require('../notify');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const Community = require('../models/Community');
const Settings = require('../models/Settings');

// Reading is public — Google search is half this site's acquisition, and a
// visitor who lands on an empty page leaves. Writing needs an account.

const WHO_CAN_POST = 'community.who_can_post';   // 'admin' | 'everyone'
// experience: a past SSB · ssb_date: an upcoming SSB, to find batchmates
const CATEGORIES = ['announcement', 'session', 'experience', 'ssb_date', 'doubt', 'discussion'];

const MAX_TITLE = 200;
const MAX_BODY  = 8000;
const MAX_COMMENT = 4000;

// The admin signs in with a separate superadmin token rather than a user
// account, so routes that both roles can reach have to check for either.
function readAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET).role === 'superadmin';
  } catch {
    return false;
  }
}

// Same idea for the reader: a signed-in user gets their own vote state, a
// signed-out one still gets the feed.
function readViewer(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

async function everyoneMayPost() {
  return (await Settings.get(WHO_CAN_POST, 'admin')) === 'everyone';
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

// ── Read ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const posts  = await Community.listPosts({ viewerId: readViewer(req), limit, offset });
    res.json({ posts, can_post: await everyoneMayPost() });
  } catch (err) {
    console.error('Community list error:', err);
    res.status(500).json({ error: 'Could not load the community' });
  }
});

// What is happening on the site, for the home page: real counts and the
// latest things people did. First names only. Cached for a minute.
let pulseCache = { at: 0, data: null };
router.get('/pulse', async (_req, res) => {
  try {
    if (Date.now() - pulseCache.at < 60_000) return res.json(pulseCache.data);
    const first = `split_part(COALESCE(u.display_name, 'Someone'), ' ', 1)`;
    const [{ rows: [stats] }, { rows: events }] = await Promise.all([
      pool.query(`
        SELECT (SELECT count(*)::int FROM users WHERE is_banned = false) AS members,
               (SELECT count(*)::int FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS joined_week,
               (SELECT count(*)::int FROM post_comments WHERE deleted_at IS NULL AND created_at > NOW() - INTERVAL '7 days') AS replies_week,
               (SELECT count(DISTINCT uid)::int FROM (
                  SELECT author_id AS uid FROM posts WHERE created_at > NOW() - INTERVAL '7 days'
                  UNION SELECT author_id FROM post_comments WHERE created_at > NOW() - INTERVAL '7 days'
                  UNION SELECT user_id FROM session_interests WHERE created_at > NOW() - INTERVAL '7 days'
                  UNION SELECT created_by FROM rooms WHERE created_at > NOW() - INTERVAL '7 days'
               ) a WHERE uid IS NOT NULL) AS active_week`),
      pool.query(`
        SELECT * FROM (
          (SELECT 'reply' AS kind, ${first} AS name, u.avatar_url AS avatar, p.title AS topic, '/community/' || p.id AS link, c.created_at AS at
             FROM post_comments c JOIN posts p ON p.id = c.post_id AND p.deleted_at IS NULL
             JOIN users u ON u.id = c.author_id
            WHERE c.deleted_at IS NULL AND u.is_banned = false ORDER BY c.created_at DESC LIMIT 8)
          UNION ALL
          (SELECT 'post', ${first}, u.avatar_url, p.title, '/community/' || p.id, p.created_at
             FROM posts p JOIN users u ON u.id = p.author_id
            WHERE p.deleted_at IS NULL AND u.is_banned = false ORDER BY p.created_at DESC LIMIT 4)
          UNION ALL
          (SELECT 'going', ${first}, u.avatar_url, s.topic, '/?tab=upcoming', si.created_at
             FROM session_interests si JOIN scheduled_sessions s ON s.id = si.session_id
             JOIN users u ON u.id = si.user_id
            WHERE u.is_banned = false ORDER BY si.created_at DESC LIMIT 4)
          UNION ALL
          (SELECT 'room', ${first}, u.avatar_url, r.topic, '/?tab=live', r.created_at
             FROM rooms r JOIN users u ON u.id = r.created_by
            WHERE u.is_banned = false ORDER BY r.created_at DESC LIMIT 4)
          UNION ALL
          (SELECT 'join', ${first}, u.avatar_url, NULL, NULL, u.created_at
             FROM users u WHERE u.is_banned = false ORDER BY u.created_at DESC LIMIT 6)
        ) e ORDER BY at DESC LIMIT 8`),
    ]);
    pulseCache = { at: Date.now(), data: { stats, events } };
    res.json(pulseCache.data);
  } catch (err) {
    console.error('Community pulse error:', err);
    res.status(500).json({ error: 'Could not load activity' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Community.getPost(req.params.id, readViewer(req));
    if (!post) return res.status(404).json({ error: 'That post is not available.' });
    res.json({ post, comments: await Community.listComments(post.id) });
  } catch (err) {
    console.error('Community post error:', err);
    res.status(500).json({ error: 'Could not load that post' });
  }
});

// ── Write ────────────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!(await everyoneMayPost()))
      return res.status(403).json({ error: 'Only the SSBCircle team can post at the moment.' });

    const title = clean(req.body?.title, MAX_TITLE);
    const body  = clean(req.body?.body, MAX_BODY);
    if (title.length < 5) return res.status(400).json({ error: 'Give your post a title of at least five characters.' });
    if (!body)            return res.status(400).json({ error: 'Write something in the post.' });

    const category = CATEGORIES.includes(req.body?.category) ? req.body.category : 'discussion';
    // Aspirants cannot post announcements — that label means it came from us.
    const safeCategory = category === 'announcement' ? 'discussion' : category;

    const post = await Community.createPost({ authorId: req.userId, title, body, category: safeCategory });
    res.status(201).json({ post });

    notifySubscribers({
      type: 'new_post', actorId: req.userId, groupKey: `new-post:${post.id}`,
      title: `New post: "${title.length > 70 ? title.slice(0, 67) + '…' : title}"`,
      body: `${(post.author_name || 'An aspirant').split(' ')[0]} posted in the community. Tap to read and reply.`,
      link: `/community/${post.id}`,
    });
  } catch (err) {
    console.error('Community create error:', err);
    res.status(500).json({ error: 'Could not publish your post' });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Community.getPost(req.params.id);
    if (!post) return res.status(404).json({ error: 'That post is not available.' });
    if (post.is_locked) return res.status(403).json({ error: 'Comments are closed on this post.' });

    const body = clean(req.body?.body, MAX_COMMENT);
    if (!body) return res.status(400).json({ error: 'Write something first.' });

    await Community.addComment({ postId: post.id, authorId: req.userId, body });
    const comments = await Community.listComments(post.id);
    res.status(201).json({ comments });

    // Tell the post's author and everyone else in the thread
    const me = comments.filter(c => c.author_id === req.userId).pop();
    const actor = (me?.author_name || 'Someone').split(' ')[0];
    const topic = post.title.length > 60 ? post.title.slice(0, 57) + '…' : post.title;
    notify({
      userIds: [post.author_id, ...comments.map(c => c.author_id)],
      actorId: req.userId, kind: 'reply', type: 'reply', groupKey: `post:${post.id}`,
      title: uid => uid === post.author_id ? `${actor} replied to your post "${topic}"` : `${actor} replied on "${topic}"`,
      bundleTitle: n => `${n} new replies on "${topic}"`,
      body: body.length > 140 ? body.slice(0, 137) + '…' : body,
      link: `/community/${post.id}`,
    });
  } catch (err) {
    console.error('Community comment error:', err);
    res.status(500).json({ error: 'Could not post your comment' });
  }
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const post = await Community.getPost(req.params.id);
    if (!post) return res.status(404).json({ error: 'That post is not available.' });
    res.json(await Community.toggleVote(post.id, req.userId));
  } catch (err) {
    console.error('Community vote error:', err);
    res.status(500).json({ error: 'Could not record your vote' });
  }
});

// ── Remove ───────────────────────────────────────────────────────────────────
// Authors can delete their own; the admin can delete anything. Both are soft,
// so a moderator can still see what was taken down.
router.delete('/:id', async (req, res) => {
  try {
    const isAdmin = readAdmin(req);
    const userId  = readViewer(req);
    if (!isAdmin && !userId) return res.status(401).json({ error: 'Sign in first.' });

    const ok = await Community.softDeletePost(req.params.id, { userId, isAdmin });
    if (!ok) return res.status(403).json({ error: 'You cannot delete that post.' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Community delete error:', err);
    res.status(500).json({ error: 'Could not delete that post' });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    const isAdmin = readAdmin(req);
    const userId  = readViewer(req);
    if (!isAdmin && !userId) return res.status(401).json({ error: 'Sign in first.' });

    const ok = await Community.softDeleteComment(req.params.id, { userId, isAdmin });
    if (!ok) return res.status(403).json({ error: 'You cannot delete that comment.' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Community comment delete error:', err);
    res.status(500).json({ error: 'Could not delete that comment' });
  }
});

module.exports = router;
module.exports.WHO_CAN_POST = WHO_CAN_POST;
module.exports.CATEGORIES = CATEGORIES;
