const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getForUser, saveForUser, removeForUser } = require('../models/Piq');

// A filled PIQ is only ever read by the person who wrote it. Every route here
// takes the user id from the token, never from the request, so there is no path
// by which one aspirant can reach another's form.

// A generously sized form still comes to a few kilobytes. The cap is here to
// stop someone using this as free storage, not to constrain honest answers.
const MAX_BYTES = 48 * 1024;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const row = await getForUser(req.userId);
    res.json({ piq: row ? row.data : null, updated_at: row ? row.updated_at : null });
  } catch (err) {
    console.error('PIQ fetch error:', err);
    res.status(500).json({ error: 'Could not load your PIQ' });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const data = (req.body || {}).data;
    if (!isPlainObject(data))
      return res.status(400).json({ error: 'Nothing to save.' });

    const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (size > MAX_BYTES)
      return res.status(400).json({ error: 'That PIQ is too large to save. Please shorten your answers.' });

    const row = await saveForUser(req.userId, data);
    res.json({ piq: row.data, updated_at: row.updated_at });
  } catch (err) {
    console.error('PIQ save error:', err);
    res.status(500).json({ error: 'Could not save your PIQ' });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    const removed = await removeForUser(req.userId);
    res.json({ removed });
  } catch (err) {
    console.error('PIQ delete error:', err);
    res.status(500).json({ error: 'Could not delete your PIQ' });
  }
});

module.exports = router;
