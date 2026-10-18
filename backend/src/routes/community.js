const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const Community = require('../models/Community');
const Settings = require('../models/Settings');

// Reading is public — Google search is half this site's acquisition, and a
// visitor who lands on an empty page leaves. Writing needs an account.

const WHO_CAN_POST = 'community.who_can_post';   // 'admin' | 'everyone'
const CATEGORIES = ['announcement', 'session', 'doubt', 'discussion'];

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
    res.status(201).json({ comments: await Community.listComments(post.id) });
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
