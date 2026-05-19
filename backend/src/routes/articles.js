const express = require('express');
const router  = express.Router();
const pool    = require('../db');
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
