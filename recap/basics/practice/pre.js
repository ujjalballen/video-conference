// server.js
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import os from 'os';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const workers = [];
let nextWorkerIdx = 0;
const rooms = new Map(); // roomId -> { router, peers: Map(socketId -> peer) }

async function createWorker() {
  const worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  });
  worker.on('died', () => {
    console.error('mediasoup Worker died, exiting...');
    process.exit(1);
  });
  return worker;
}

// spin up a few workers
(async () => {
  const count = Math.max(1, Math.min(4, os.cpus().length)); // keep it simple
  for (let i = 0; i < count; i++) workers.push(await createWorker());
  httpServer.listen(3001, () => console.log('Signaling on :3001'));
})();

function getWorker() {
  const worker = workers[nextWorkerIdx];
  nextWorkerIdx = (nextWorkerIdx + 1) % workers.length;
  return worker;
}

async function getOrCreateRoom(roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);

  const worker = getWorker();
  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: { useinbandfec: 1, usedtx: 1 }
      }
    ]
  });

  const room = {
    router,
    peers: new Map(),     // socket.id -> { transports, producers, consumers }
    producers: new Map(), // producerId -> producer
  };
  rooms.set(roomId, room);
  return room;
}

async function createWebRtcTransport(router) {
  const transport = await router.createWebRtcTransport({
    listenIps: [
      { ip: '0.0.0.0', announcedIp: process.env.PUBLIC_IP || undefined }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 800000
  });
  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    }
  };
}

io.on('connection', (socket) => {
  socket.on('join', async ({ roomId, name }, cb) => {
    const room = await getOrCreateRoom(roomId);
    socket.join(roomId);
    room.peers.set(socket.id, {
      name,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map()
    });
    cb({ routerRtpCapabilities: room.router.rtpCapabilities });

    // let the newcomer know existing producers
    const existing = [...room.producers.values()].map(p => ({
      producerId: p.id,
      peerId: p.appData.peerId
    }));
    socket.emit('existingProducers', existing);
  });

  socket.on('createTransport', async ({ roomId, direction }, cb) => {
    const room = rooms.get(roomId);
    const { transport, params } = await createWebRtcTransport(room.router);
    transport.appData = { direction };
    room.peers.get(socket.id).transports.set(transport.id, transport);

    transport.on('dtlsstatechange', (state) => {
      if (state === 'closed' || state === 'failed') transport.close();
    });
    transport.on('close', () => {
      // cleanup if needed
    });
    cb(params);
  });

  socket.on('connectTransport', async ({ roomId, transportId, dtlsParameters }, cb) => {
    const transport = rooms.get(roomId)?.peers.get(socket.id)?.transports.get(transportId);
    await transport.connect({ dtlsParameters });
    cb();
  });

  socket.on('produce', async ({ roomId, transportId, kind, rtpParameters }, cb) => {
    const room = rooms.get(roomId);
    const transport = room.peers.get(socket.id).transports.get(transportId);
    const producer = await transport.produce({ kind, rtpParameters, appData: { peerId: socket.id } });

    room.peers.get(socket.id).producers.set(producer.id, producer);
    room.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      producer.close();
      room.producers.delete(producer.id);
    });

    // notify others
    socket.to(roomId).emit('newProducer', { producerId: producer.id, peerId: socket.id });
    cb({ id: producer.id });
  });

  socket.on('consume', async ({ roomId, transportId, producerId, rtpCapabilities }, cb) => {
    const room = rooms.get(roomId);
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      return cb({ error: 'cannot consume' });
    }
    const transport = room.peers.get(socket.id).transports.get(transportId);
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true
    });

    room.peers.get(socket.id).consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => consumer.close());

    cb({
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      producerPaused: false
    });
  });

  socket.on('resumeConsumer', async ({ roomId, consumerId }, cb) => {
    const consumer = rooms.get(roomId)?.peers.get(socket.id)?.consumers.get(consumerId);
    await consumer.resume();
    cb();
  });

  socket.on('disconnect', () => {
    // simple cleanup
    for (const [roomId, room] of rooms) {
      const peer = room.peers.get(socket.id);
      if (!peer) continue;

      peer.producers.forEach(p => room.producers.delete(p.id));
      peer.transports.forEach(t => t.close());
      room.peers.delete(socket.id);

      if (room.peers.size === 0) rooms.delete(roomId);
    }
  });
});