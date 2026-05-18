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
      let participants;
      try {
        participants = await lkService.listParticipants(room.jitsi_room_name);
      } catch (lkErr) {
        // LiveKit unreachable or room not registered there yet — skip this cycle,
        // do NOT mark as empty (avoids false auto-close on network blip)
        console.warn(`[cleanup] LiveKit check failed for ${room.room_code}: ${lkErr.message} — skipping`);
        continue;
      }

      const isEmpty = participants.length === 0;

      if (!isEmpty) {
        // Room has people — reset the empty timer
        if (room.emptied_at) {
          await pool.query('UPDATE rooms SET emptied_at = NULL WHERE room_code = $1', [room.room_code]);
        }
      } else if (!room.emptied_at) {
        // Just became empty — record the time
        await pool.query('UPDATE rooms SET emptied_at = NOW() WHERE room_code = $1', [room.room_code]);
        console.log(`[cleanup] Room ${room.room_code} is now empty — starting 60-min timer`);
      } else {
        const emptyMs = Date.now() - new Date(room.emptied_at).getTime();
        if (emptyMs >= EMPTY_TIMEOUT_MS) {
          // Empty for 60+ minutes — close it
          await pool.query('UPDATE rooms SET is_active = false WHERE room_code = $1', [room.room_code]);
          await pool.query(
            'UPDATE scheduled_sessions SET is_active = false WHERE room_code = $1',
            [room.room_code]
          );
          await lkService.deleteRoom(room.jitsi_room_name).catch(() => {});
          console.log(`[cleanup] Closed room ${room.room_code} — empty for ${Math.round(emptyMs / 60000)} min`);
        }
      }
    }
  } catch (err) {
    console.error('[cleanup] Error:', err.message);
  }
}

function startCleanup() {
  console.log('✓ Room cleanup job started (checks every 2 min, closes after 60 min empty)');
  setInterval(runCleanup, INTERVAL_MS);
}

module.exports = { startCleanup, runCleanup };
