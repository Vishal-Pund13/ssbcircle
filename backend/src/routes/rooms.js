const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const { createRoom, getRoomByCode, getActiveRooms, closeRoom } = require('../models/Room');
const authMiddleware = require('../middleware/auth');
const { createRoomLimiter } = require('../middleware/rateLimit');

const VALID_CATEGORIES = ['GD', 'PPDT', 'Lecturette', 'IO Practice'];
const GD_SUBCATEGORIES = ['Defence', 'International Relations', 'Society', 'Economy', 'Science & Tech', 'Environment', 'Sports & Awards'];

// Create room — requires auth + per-user room-creation rate limit
router.post('/', authMiddleware, createRoomLimiter, async (req, res) => {
  try {
    const { title, description, category, subcategory } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      return res.status(400).json({ error: 'Room title must be at least 5 characters' });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ error: 'Room title must be under 100 characters' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }
    if (description.trim().length > 500) {
      return res.status(400).json({ error: 'Description must be under 500 characters' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (subcategory && category === 'GD' && !GD_SUBCATEGORIES.includes(subcategory)) {
      return res.status(400).json({ error: 'Invalid subcategory' });
    }

    const room = await createRoom(title.trim(), description.trim(), category, subcategory || null, req.userId, req.displayName);
    res.status(201).json({ room });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Active rooms — public
router.get('/active', async (req, res) => {
  try {
    const rooms = await getActiveRooms();
    res.json({ rooms });
  } catch (err) {
    console.error('Get active rooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Kick participant (host only) — calls LiveKit server API
router.post('/:code/kick', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const { identity } = req.body;
    if (!identity) return res.status(400).json({ error: 'identity required' });

    const room = await getRoomByCode(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.created_by !== req.userId) return res.status(403).json({ error: 'Only the host can remove participants' });

    const { RoomServiceClient } = require('livekit-server-sdk');
    const svc = new RoomServiceClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
    await svc.removeParticipant(room.room_code, identity);
    res.json({ success: true });
  } catch (err) {
    console.error('Kick error:', err);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// LiveKit token for a room — requires auth
router.get('/:code/token', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    if (!/^[A-Z0-9]{6}$/i.test(code)) {
      return res.status(400).json({ error: 'Invalid room code format' });
    }

    const apiKey    = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url       = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      return res.status(503).json({ error: 'LiveKit not configured on server' });
    }

    const room = await getRoomByCode(code);
    if (!room) return res.status(404).json({ error: 'Room not found or no longer active' });

    const isModerator = room.created_by === req.userId;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(req.userId),
      name:     req.displayName,
      ttl:      '6h',
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
    res.json({ token, url });
  } catch (err) {
    console.error('LiveKit token error:', err);
    res.status(500).json({ error: 'Failed to generate meeting token' });
  }
});

// Get room by code — requires auth
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    if (!/^[A-Z0-9]{6}$/i.test(code)) {
      return res.status(400).json({ error: 'Invalid room code format' });
    }
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
    if (!/^[A-Z0-9]{6}$/i.test(code)) {
      return res.status(400).json({ error: 'Invalid room code format' });
    }
    const room = await closeRoom(code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room closed', room });
  } catch (err) {
    console.error('Close room error:', err);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

module.exports = router;
