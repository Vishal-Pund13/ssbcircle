const { randomBytes } = require('crypto');
const { RoomServiceClient } = require('livekit-server-sdk');
const pool = require('../db');

const lkService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function createRoom(title, description, category, subcategory, userId, displayName, maxParticipants = 8) {
  let roomCode;
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = generateRoomCode();
    const { rows } = await pool.query('SELECT id FROM rooms WHERE room_code = $1', [candidate]);
    if (rows.length === 0) { roomCode = candidate; break; }
  }
  if (!roomCode) throw new Error('Could not generate unique room code');

  const jitsiRoomName = `SSBCircle_${roomCode}`;
  const max = Math.min(8, Math.max(2, parseInt(maxParticipants) || 8));
  const { rows } = await pool.query(
    `INSERT INTO rooms (topic, description, category, subcategory, room_code, jitsi_room_name, created_by, admin_username, max_participants)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [title, description || null, category || 'GD', subcategory || null, roomCode, jitsiRoomName, userId || null, displayName || null, max]
  );
  return rows[0];
}

async function getRoomByCode(code) {
  const { rows } = await pool.query(
    `SELECT r.*, u.display_name AS admin_display_name
     FROM rooms r
     LEFT JOIN users u ON r.created_by = u.id
     WHERE r.room_code = $1 AND r.is_active = true`,
    [code.toUpperCase()]
  );
  return rows[0] || null;
}

async function getActiveRooms() {
  const { rows } = await pool.query(
    `SELECT r.*, u.display_name AS admin_display_name
     FROM rooms r
     LEFT JOIN users u ON r.created_by = u.id
     WHERE r.is_active = true
     ORDER BY r.created_at DESC`
  );

  // Merge with LiveKit participant counts (single API call)
  try {
    const lkRooms = await lkService.listRooms();
    const countMap = {};
    for (const r of lkRooms) {
      const code = r.name.replace('SSBCircle_', '');
      countMap[code] = r.numParticipants;
    }
    return rows.map(r => ({ ...r, participant_count: countMap[r.room_code] ?? 0 }));
  } catch {
    return rows.map(r => ({ ...r, participant_count: null }));
  }
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
  return rows[0] || null;
}

module.exports = { createRoom, getRoomByCode, getActiveRooms, closeRoom };
