/* Step 1) Add a tiny room manager that creates/returns a Router
Create a new file rooms.js: */


// rooms.js
import { getWorker } from './createWorkers.js';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';

const rooms = new Map(); // roomId -> { id, router, peers? }

export async function getOrCreateRoom(roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);

  const worker = getWorker();

  // Use your config if present, otherwise default to audio-only OPUS (good for voice rooms)
  const mediaCodecs =
    mediasoupConfig?.router?.mediaCodecs ?? [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: { useinbandfec: 1, usedtx: 1 }
      }
    ];

  const router = await worker.createRouter({ mediaCodecs });

  const room = { id: roomId, router, peers: new Map() };
  rooms.set(roomId, room);

  console.log(`Router created for room ${roomId} on worker PID ${worker.pid}`);

  router.observer.on('close', () => rooms.delete(roomId));
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function deleteRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.router.close();
  rooms.delete(roomId);
}