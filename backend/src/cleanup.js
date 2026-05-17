const { RoomServiceClient } = require('livekit-server-sdk');
const pool = require('./db');

const lkService = new RoomServiceClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

const EMPTY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const INTERVAL_MS      =  2 * 60 * 1000; // check every 2 minutes

async function runCleanup() {
  try {
    const { rows: activeRooms } = await pool.query(
      `SELECT room_code, jitsi_room_name, emptied_at FROM rooms WHERE is_active = true`
    );
    if (activeRooms.length === 0) return;

    for (const room of activeRooms) {
      try {
        const participants = await lkService.listParticipants(room.jitsi_room_name);
        const isEmpty = participants.length === 0;

        if (!isEmpty) {
          // Room has people — reset the empty timer
          if (room.emptied_at) {
            await pool.query(
              'UPDATE rooms SET emptied_at = NULL WHERE room_code = $1',
              [room.room_code]
            );
          }
        } else if (!room.emptied_at) {
          // Just became empty — record the time
          await pool.query(
            'UPDATE rooms SET emptied_at = NOW() WHERE room_code = $1',
            [room.room_code]
          );
        } else if (Date.now() - new Date(room.emptied_at).getTime() >= EMPTY_TIMEOUT_MS) {
          // Empty for 60+ minutes — close it
          await pool.query(
            'UPDATE rooms SET is_active = false WHERE room_code = $1',
            [room.room_code]
          );
          // Clear room_code on any scheduled session pointing here so the card stops showing "Live Now"
          await pool.query(
            'UPDATE scheduled_sessions SET room_code = NULL WHERE room_code = $1',
            [room.room_code]
          );
          // Also delete from LiveKit (best-effort)
          await lkService.deleteRoom(room.jitsi_room_name).catch(() => {});
          console.log(`[cleanup] Closed empty room ${room.room_code} (empty for 60+ min)`);
        }
      } catch {
        // LiveKit throws if the room doesn't exist there — treat as empty
        if (!room.emptied_at) {
          await pool.query(
            'UPDATE rooms SET emptied_at = NOW() WHERE room_code = $1',
            [room.room_code]
          );
        }
      }
    }
  } catch (err) {
    console.error('[cleanup] Error during room cleanup:', err.message);
  }
}

function startCleanup() {
  console.log('✓ Room cleanup job started (checks every 2 min, closes after 30 min empty)');
  setInterval(runCleanup, INTERVAL_MS);
}

module.exports = { startCleanup, runCleanup };
