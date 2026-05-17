const express = require('express');
const router = express.Router();
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const pool = require('../db');
const { createRoom, getRoomByCode, getActiveRooms, closeRoom } = require('../models/Room');
const authMiddleware = require('../middleware/auth');
const { createRoomLimiter } = require('../middleware/rateLimit');

const VALID_CATEGORIES = ['GD', 'PPDT', 'Lecturette', 'IO Practice'];
const GD_SUBCATEGORIES = ['Defence', 'International Relations', 'Society', 'Economy', 'Science & Tech', 'Environment', 'Sports & Awards'];

function lkService() {
  return new RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );
}

async function checkBanned(userId) {
  const { rows } = await pool.query('SELECT is_banned FROM users WHERE id=$1', [userId]);
  return rows[0]?.is_banned || false;
}

// Create room — requires auth + per-user rate limit
router.post('/', authMiddleware, createRoomLimiter, async (req, res) => {
  try {
    if (await checkBanned(req.userId))
      return res.status(403).json({ error: 'Your account has been suspended.' });

    const { title, description, category, subcategory, max_participants } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 5)
      return res.status(400).json({ error: 'Room title must be at least 5 characters' });
    if (title.trim().length > 100)
      return res.status(400).json({ error: 'Room title must be under 100 characters' });
    if (!description || typeof description !== 'string' || description.trim().length < 10)
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    if (description.trim().length > 500)
      return res.status(400).json({ error: 'Description must be under 500 characters' });
    if (!category || !VALID_CATEGORIES.includes(category))
      return res.status(400).json({ error: 'Invalid category' });
    if (subcategory && category === 'GD' && !GD_SUBCATEGORIES.includes(subcategory))
      return res.status(400).json({ error: 'Invalid subcategory' });

    const maxP = Math.min(8, Math.max(2, parseInt(max_participants) || 8));

    // One active room per user
    const { rows: existing } = await pool.query(
      'SELECT room_code, topic FROM rooms WHERE created_by=$1 AND is_active=true LIMIT 1',
      [req.userId]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'You already have an active room. Close it before creating a new one.',
        existing_room: existing[0],
      });
    }

    // Platform-wide limit: max 8 active rooms
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) FROM rooms WHERE is_active=true'
    );
    if (parseInt(countRows[0].count) >= 8) {
      return res.status(429).json({
        error: 'The platform currently has 8 active rooms — the maximum allowed. Please join an existing room or wait for one to close.',
        platform_limit: true,
      });
    }

    const room = await createRoom(
      title.trim(), description.trim(), category, subcategory || null,
      req.userId, req.displayName, maxP
    );
    res.status(201).json({ room });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Active rooms — public
router.get('/active', async (_req, res) => {
  try {
    const rooms = await getActiveRooms();
    res.json({ rooms });
  } catch (err) {
    console.error('Get active rooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Kick participant (host only)
router.post('/:code/kick', authMiddleware, async (req, res) => {
  try {
    const { identity } = req.body;
    if (!identity) return res.status(400).json({ error: 'identity required' });

    const room = await getRoomByCode(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.created_by !== req.userId) return res.status(403).json({ error: 'Only the host can remove participants' });

    await lkService().removeParticipant(room.room_code, identity);
    res.json({ success: true });
  } catch (err) {
    console.error('Kick error:', err);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// LiveKit token — requires auth, checks ban + room capacity
router.get('/:code/token', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    if (!/^[A-Z0-9]{6}$/i.test(code))
      return res.status(400).json({ error: 'Invalid room code format' });

    if (await checkBanned(req.userId))
      return res.status(403).json({ error: 'Your account has been suspended.' });

    const apiKey    = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url       = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !url)
      return res.status(503).json({ error: 'LiveKit not configured on server' });

    const room = await getRoomByCode(code);
    if (!room) return res.status(404).json({ error: 'Room not found or no longer active' });

    const isModerator = room.created_by === req.userId;

    // Enforce max participant limit (host can always join)
    if (!isModerator) {
      const participants = await lkService().listParticipants(room.jitsi_room_name).catch(() => []);
      if (participants.length >= (room.max_participants || 8)) {
        return res.status(403).json({ error: 'Room is full', full: true });
      }
    }

    // Fetch avatar to embed in participant metadata (used by room card previews)
    const { rows: uRows } = await pool.query('SELECT avatar_url FROM users WHERE id=$1', [req.userId]);
    const avatarUrl = uRows[0]?.avatar_url || null;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(req.userId),
      name:     req.displayName,
      ttl:      '6h',
      metadata: JSON.stringify({ avatar_url: avatarUrl }),
    });

    at.addGrant({
      room:           room.room_code,
      roomJoin:       true,
      canPublish:     true,
      canSubscribe:   true,
      canPublishData: true,
      roomAdmin:      isModerator,
    });

    const token = await at.toJwt();
    res.json({ token, url, room });
  } catch (err) {
    console.error('LiveKit token error:', err);
    res.status(500).json({ error: 'Failed to generate meeting token' });
  }
});

// Get room by code — requires auth
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    if (!/^[A-Z0-9]{6}$/i.test(code))
      return res.status(400).json({ error: 'Invalid room code format' });
    const room = await getRoomByCode(code);
    if (!room) return res.status(404).json({ error: 'Room not found or no longer active' });
    res.json({ room });
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Close room — requires auth
router.delete('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    if (!/^[A-Z0-9]{6}$/i.test(code))
      return res.status(400).json({ error: 'Invalid room code format' });
    const room = await closeRoom(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room closed', room });
  } catch (err) {
    console.error('Close room error:', err);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

module.exports = router;
