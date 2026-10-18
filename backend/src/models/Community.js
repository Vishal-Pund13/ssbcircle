const pool = require('../db');

// Posts, comments and upvotes for the community feed.
//
// Deletes are soft. On a platform whose users are mostly sixteen to nineteen,
// an admin needs to be able to look at what was removed and why, and a hard
// delete throws that away. Nothing soft-deleted is ever returned to a reader.
//
// An official post has no author_id — the admin holds a superadmin token, not
// a user account — so author_label carries the name to display instead.

const POST_FIELDS = `
  p.id, p.title, p.body, p.category, p.is_official, p.is_pinned, p.is_locked,
  p.created_at, p.updated_at,
  COALESCE(p.author_label, u.display_name) AS author_name,
  u.id AS author_id, u.avatar_url AS author_avatar,
  (SELECT count(*)::int FROM post_votes v WHERE v.post_id = p.id) AS upvotes,
  (SELECT count(*)::int FROM post_comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count
`;

// viewerId may be null for a signed-out reader; the feed is public.
async function listPosts({ viewerId = null, limit = 30, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT ${POST_FIELDS},
            ${viewerId ? 'EXISTS (SELECT 1 FROM post_votes v2 WHERE v2.post_id = p.id AND v2.user_id = $3)' : 'false'} AS voted
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
      WHERE p.deleted_at IS NULL
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT $1 OFFSET $2`,
    viewerId ? [limit, offset, viewerId] : [limit, offset]
  );
  return rows;
}

async function getPost(id, viewerId = null) {
  const { rows } = await pool.query(
    `SELECT ${POST_FIELDS},
            ${viewerId ? 'EXISTS (SELECT 1 FROM post_votes v2 WHERE v2.post_id = p.id AND v2.user_id = $2)' : 'false'} AS voted
       FROM posts p
       LEFT JOIN users u ON u.id = p.author_id
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    viewerId ? [id, viewerId] : [id]
  );
  return rows[0] || null;
}

async function listComments(postId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.body, c.is_official, c.created_at,
            COALESCE(c.author_label, u.display_name) AS author_name,
            u.id AS author_id, u.avatar_url AS author_avatar
       FROM post_comments c
       LEFT JOIN users u ON u.id = c.author_id
      WHERE c.post_id = $1 AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC`,
    [postId]
  );
  return rows;
}

async function createPost({ authorId = null, authorLabel = null, isOfficial = false, title, body, category }) {
  const { rows } = await pool.query(
    `INSERT INTO posts (author_id, author_label, is_official, title, body, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [authorId, authorLabel, isOfficial, title, body, category]
  );
  return getPost(rows[0].id, authorId);
}

async function addComment({ postId, authorId = null, authorLabel = null, isOfficial = false, body }) {
  const { rows } = await pool.query(
    `INSERT INTO post_comments (post_id, author_id, author_label, is_official, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [postId, authorId, authorLabel, isOfficial, body]
  );
  return rows[0].id;
}

// Returns false when the row is not the caller's and the caller is not admin,
// so the route can answer 403 without a second query.
async function softDeletePost(id, { userId = null, isAdmin = false }) {
  const { rowCount } = await pool.query(
    `UPDATE posts SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
        AND ($2::boolean OR author_id = $3)`,
    [id, isAdmin, userId]
  );
  return rowCount > 0;
}

async function softDeleteComment(id, { userId = null, isAdmin = false }) {
  const { rowCount } = await pool.query(
    `UPDATE post_comments SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
        AND ($2::boolean OR author_id = $3)`,
    [id, isAdmin, userId]
  );
  return rowCount > 0;
}

// One row per person per post. Voting again takes the vote back.
async function toggleVote(postId, userId) {
  const { rowCount } = await pool.query(
    'DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2',
    [postId, userId]
  );
  if (rowCount === 0) {
    await pool.query(
      'INSERT INTO post_votes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    );
  }
  const { rows } = await pool.query(
    'SELECT count(*)::int AS upvotes FROM post_votes WHERE post_id = $1',
    [postId]
  );
  return { voted: rowCount === 0, upvotes: rows[0].upvotes };
}

async function setFlags(id, { isPinned, isLocked }) {
  const { rowCount } = await pool.query(
    `UPDATE posts
        SET is_pinned = COALESCE($2, is_pinned),
            is_locked = COALESCE($3, is_locked),
            updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL`,
    [id, isPinned == null ? null : !!isPinned, isLocked == null ? null : !!isLocked]
  );
  return rowCount > 0;
}

module.exports = {
  listPosts, getPost, listComments,
  createPost, addComment,
  softDeletePost, softDeleteComment,
  toggleVote, setFlags,
};
