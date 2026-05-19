const express = require('express');
const router  = express.Router();
const pool    = require('../db');

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
      SELECT id, title, category, summary, tags, published_at, reading_time, difficulty, ssb_relevance
      FROM articles
      WHERE ${where.join(' AND ')}
      ORDER BY published_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json({ articles: rows });
  } catch (err) {
    console.error('Articles list error:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Single article — public
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM articles WHERE id = $1 AND is_published = true',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Article not found' });
    res.json({ article: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

module.exports = router;
