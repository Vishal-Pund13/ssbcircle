const { randomBytes } = require('crypto');
const { RoomServiceClient } = require('livekit-server-sdk');
const pool = require('../db');

const lkService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

// Simple TTL cache for active rooms (avoids hammering LiveKit on every page load)
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 15_000; // 15 seconds

function invalidateCache() { _cache = null; }

// Wraps a promise with a hard timeout — LiveKit calls should never block the response
function withTimeout(promise, ms = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('LiveKit timeout')), ms)),
  ]);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
  return code;
}

async function generateUniqueRoomCode() {
  for (let attempts = 0; attempts < 10; attempts++) {
    const code = generateRoomCode();
    const { rows } = await pool.query(
      'SELECT id FROM rooms WHERE room_code=$1 UNION SELECT id FROM scheduled_sessions WHERE room_code=$1',
      [code]
    );
    if (rows.length === 0) return code;
  }
  throw new Error('Could not generate unique room code');
}

async function createRoom(title, description, category, subcategory, userId, displayName, maxParticipants = 8) {
  const roomCode = await generateUniqueRoomCode();
  return createRoomWithCode(roomCode, title, description, category, subcategory, userId, displayName, maxParticipants);
}

async function createRoomWithCode(roomCode, title, description, category, subcategory, userId, displayName, maxParticipants = 8) {
  const jitsiRoomName = `SSBCircle_${roomCode}`;
  const max = Math.min(8, Math.max(4, parseInt(maxParticipants) || 8));
  const { rows } = await pool.query(
    `INSERT INTO rooms (topic, description, category, subcategory, room_code, jitsi_room_name, created_by, admin_username, max_participants)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [title, description || null, category || 'GD', subcategory || null, roomCode, jitsiRoomName, userId || null, displayName || null, max]
  );
  invalidateCache();
  return rows[0];
}

async function getRoomByCode(code) {
  const { rows } = await pool.query(
    `SELECT r.*, u.display_name AS admin_display_name
     FROM rooms r LEFT JOIN users u ON r.created_by = u.id
     WHERE r.room_code = $1 AND r.is_active = true`,
    [code.toUpperCase()]
  );
  return rows[0] || null;
}

async function getActiveRooms() {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache;

  const { rows } = await pool.query(
    `SELECT r.*, u.display_name AS admin_display_name
     FROM rooms r LEFT JOIN users u ON r.created_by = u.id
     WHERE r.is_active = true ORDER BY r.created_at DESC`
  );

  // Fetch LiveKit data — parallel calls with a hard 3s timeout each
  try {
    const lkRooms = await withTimeout(lkService.listRooms());
    const countMap = {};
    const participantMap = {};

    await Promise.all(lkRooms.map(async lkRoom => {
      const code = lkRoom.name.replace('SSBCircle_', '');
      countMap[code] = lkRoom.numParticipants;
      try {
        const ps = await withTimeout(lkService.listParticipants(lkRoom.name));
        participantMap[code] = ps.slice(0, 4).map(p => {
          let avatar_url = null;
          try { avatar_url = JSON.parse(p.metadata || '{}').avatar_url; } catch {}
          return { name: p.name || p.identity, avatar_url };
        });
      } catch {
        participantMap[code] = [];
      }
    }));

    _cache = rows.map(r => ({
      ...r,
      participant_count: countMap[r.room_code] ?? 0,
      participants:      participantMap[r.room_code] ?? [],
    }));
  } catch {
    _cache = rows.map(r => ({ ...r, participant_count: 0, participants: [] }));
  }

  _cacheTs = Date.now();
  return _cache;
}

async function closeRoom(code) {
  const upper = code.toUpperCase();
  const { rows } = await pool.query(
    'UPDATE rooms SET is_active = false WHERE room_code = $1 RETURNING *',
    [upper]
  );
  if (rows[0]) {
    await pool.query(
      'UPDATE scheduled_sessions SET room_code = NULL, is_active = false WHERE room_code = $1',
      [upper]
    );
  }
  invalidateCache();
  return rows[0] || null;
}

module.exports = { createRoom, createRoomWithCode, generateUniqueRoomCode, getRoomByCode, getActiveRooms, closeRoom };
