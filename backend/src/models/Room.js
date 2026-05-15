const { randomBytes } = require('crypto');
const pool = require('../db');

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function createRoom(topic, userId, displayName) {
  let roomCode;
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = generateRoomCode();
    const { rows } = await pool.query('SELECT id FROM rooms WHERE room_code = $1', [candidate]);
    if (rows.length === 0) { roomCode = candidate; break; }
  }
  if (!roomCode) throw new Error('Could not generate unique room code');

  const jitsiRoomName = `SSBCircle_${roomCode}`;
  const { rows } = await pool.query(
    `INSERT INTO rooms (topic, room_code, jitsi_room_name, created_by, admin_username)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [topic, roomCode, jitsiRoomName, userId || null, displayName || null]
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
  return rows;
}

async function closeRoom(code) {
  const { rows } = await pool.query(
    'UPDATE rooms SET is_active = false WHERE room_code = $1 RETURNING *',
    [code.toUpperCase()]
  );
  return rows[0] || null;
}

module.exports = { createRoom, getRoomByCode, getActiveRooms, closeRoom };
