const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const jwt     = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { authenticateToken } = require('../middleware/auth');

// Optional auth — attaches user if token present, continues if not
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  authenticateToken(req, res, next);
}

// List published articles — public
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    const params = [];
    const where  = ['is_published = true'];
    if (category && category !== 'all') {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    params.push(parseInt(limit) || 20, parseInt(offset) || 0);
    const { rows } = await pool.query(`
      SELECT a.id, a.slug, a.title, a.category, a.summary, a.tags,
             a.published_at, a.reading_time, a.difficulty, a.ssb_relevance,
             COUNT(v.id)::int          AS vote_count,
             ROUND(AVG(v.value)::numeric, 1) AS avg_rating
      FROM articles a
      LEFT JOIN article_votes v ON v.article_slug = a.slug
      WHERE ${where.join(' AND ')}
      GROUP BY a.id
      ORDER BY a.published_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ articles: rows });
  } catch (err) {
    console.error('Articles list error:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Single article — fetch by slug or UUID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const col = isUuid ? 'id' : 'slug';
    const { rows } = await pool.query(
      `SELECT a.*,
              COUNT(v.id)::int               AS vote_count,
              ROUND(AVG(v.value)::numeric, 1) AS avg_rating
       FROM articles a
       LEFT JOIN article_votes v ON v.article_slug = a.slug
       WHERE a.${col} = $1 AND a.is_published = true
       GROUP BY a.id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Article not found' });
    res.json({ article: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Vote on a card — optional auth (logged-in users stored in DB, anonymous via localStorage only)
router.post('/:slug/vote', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { value } = req.body;

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ error: 'value must be an integer 1–5' });
    }

    // Verify article exists
    const { rows: art } = await pool.query(
      'SELECT slug FROM articles WHERE slug = $1 AND is_published = true', [slug]
    );
    if (!art.length) return res.status(404).json({ error: 'Article not found' });

    // Persist for authenticated users (upsert so they can change their rating)
    if (req.user?.id) {
      await pool.query(`
        INSERT INTO article_votes (article_slug, user_id, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (article_slug, user_id) WHERE user_id IS NOT NULL
        DO UPDATE SET value = EXCLUDED.value, created_at = NOW()
      `, [slug, req.user.id, value]);
    }

    // Return updated aggregate stats
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int                    AS vote_count,
             ROUND(AVG(value)::numeric, 1)    AS avg_rating
      FROM article_votes WHERE article_slug = $1
    `, [slug]);

    res.json({
      success:    true,
      vote_count: rows[0].vote_count,
      avg_rating: rows[0].avg_rating,
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// ── Likes and comments ───────────────────────────────────────────────────────
// Reading is public; liking and commenting need an account. Same split as the
// community feed.

const MAX_COMMENT = 2000;

// A signed-in reader gets their own like state; a signed-out one still reads.
function readViewer(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET).userId || null;
  } catch {
    return null;
  }
}

function readAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET).role === 'superadmin';
  } catch {
    return false;
  }
}

async function articleExists(slug) {
  const { rows } = await pool.query(
    'SELECT 1 FROM articles WHERE slug = $1 AND is_published = true', [slug]
  );
  return rows.length > 0;
}

async function likeStats(slug, viewerId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS likes,
            COALESCE(bool_or(user_id = $2), false) AS liked
       FROM article_likes WHERE article_slug = $1`,
    [slug, viewerId]
  );
  return rows[0];
}

async function listComments(slug) {
  const { rows } = await pool.query(
    `SELECT c.id, c.body, c.created_at,
            u.id AS author_id, u.display_name AS author_name, u.avatar_url AS author_avatar
       FROM article_comments c
       LEFT JOIN users u ON u.id = c.author_id
      WHERE c.article_slug = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC`,
    [slug]
  );
  return rows;
}

router.get('/:slug/engagement', async (req, res) => {
  try {
    const { slug } = req.params;
    const [stats, comments] = await Promise.all([
      likeStats(slug, readViewer(req)),
      listComments(slug),
    ]);
    res.json({ ...stats, comments });
  } catch (err) {
    console.error('Article engagement error:', err);
    res.status(500).json({ error: 'Could not load likes and comments' });
  }
});

// Liking again takes the like back.
router.post('/:slug/like', authMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    if (!(await articleExists(slug))) return res.status(404).json({ error: 'Article not found' });

    const { rowCount } = await pool.query(
      'DELETE FROM article_likes WHERE article_slug = $1 AND user_id = $2',
      [slug, req.userId]
    );
    if (rowCount === 0) {
      await pool.query(
        'INSERT INTO article_likes (article_slug, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [slug, req.userId]
      );
    }
    res.json(await likeStats(slug, req.userId));
  } catch (err) {
    console.error('Article like error:', err);
    res.status(500).json({ error: 'Could not record your like' });
  }
});

router.post('/:slug/comments', authMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    if (!(await articleExists(slug))) return res.status(404).json({ error: 'Article not found' });

    const body = String(req.body?.body ?? '').trim().slice(0, MAX_COMMENT);
    if (!body) return res.status(400).json({ error: 'Write something first.' });

    await pool.query(
      'INSERT INTO article_comments (article_slug, author_id, body) VALUES ($1, $2, $3)',
      [slug, req.userId, body]
    );
    res.status(201).json({ comments: await listComments(slug) });
  } catch (err) {
    console.error('Article comment error:', err);
    res.status(500).json({ error: 'Could not post your comment' });
  }
});

// Authors can delete their own; the admin can delete anything. Soft delete.
router.delete('/comments/:id', async (req, res) => {
  try {
    const isAdmin = readAdmin(req);
    const userId  = readViewer(req);
    if (!isAdmin && !userId) return res.status(401).json({ error: 'Sign in first.' });

    const { rowCount } = await pool.query(
      `UPDATE article_comments SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
          AND ($2::boolean OR author_id = $3)`,
      [req.params.id, isAdmin, userId]
    );
    if (!rowCount) return res.status(403).json({ error: 'You cannot delete that comment.' });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Article comment delete error:', err);
    res.status(500).json({ error: 'Could not delete that comment' });
  }
});

// Get vote stats for a card — public
router.get('/:slug/vote', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int                    AS vote_count,
             ROUND(AVG(value)::numeric, 1)    AS avg_rating
      FROM article_votes WHERE article_slug = $1
    `, [req.params.slug]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vote stats' });
  }
});

module.exports = router;
