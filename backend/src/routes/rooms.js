const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createRoom, getRoomByCode, getActiveRooms, closeRoom } = require('../models/Room');
const authMiddleware = require('../middleware/auth');

// Create room — requires auth
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' });
    }
    const trimmed = topic.trim();
    if (trimmed.length < 3 || trimmed.length > 255) {
      return res.status(400).json({ error: 'Topic must be between 3 and 255 characters' });
    }
    const room = await createRoom(trimmed, req.userId, req.displayName);
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

// JaaS JWT for a room — requires auth
router.get('/:code/token', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    if (!/^[A-Z0-9]{6}$/i.test(code)) {
      return res.status(400).json({ error: 'Invalid room code format' });
    }

    const appId = process.env.JAAS_APP_ID;
    const keyId = process.env.JAAS_KEY_ID;
    const privateKeyB64 = process.env.JAAS_PRIVATE_KEY_BASE64;

    if (!appId || !keyId || !privateKeyB64) {
      return res.status(503).json({ error: 'JaaS not configured on server' });
    }

    const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');

    const room = await getRoomByCode(code);
    if (!room) return res.status(404).json({ error: 'Room not found or no longer active' });

    const isModerator = room.created_by === req.userId;

    const payload = {
      iss: 'chat',
      aud: 'jitsi',
      sub: appId,
      room: '*',
      context: {
        user: {
          id: String(req.userId),
          name: req.displayName,
          moderator: isModerator,
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          'outbound-call': false,
        },
      },
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '6h',
      keyid: `${appId}/${keyId}`,
      notBefore: '-5s',
    });

    res.json({ token, appId });
  } catch (err) {
    console.error('JaaS token error:', err);
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
