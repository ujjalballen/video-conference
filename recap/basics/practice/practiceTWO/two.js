/* Step 2) Use it from your server (create the router when the first client joins)
In server.js, wire a simple “join” that creates the router and returns its RtpCapabilities to the client: */


// server.js
import { readFileSync } from 'fs';
import { createServer } from 'https';
import express from 'express';
const app = express();
import { Server } from "socket.io";
import mediasoup from 'mediasoup';
import { createWorkers } from './createWorkers.js';
import { getOrCreateRoom } from './rooms.js';

const port = 3000;

app.use(express.static('public'));

const options = {
  key: readFileSync('./config/cert.key'),
  cert: readFileSync('./config/cert.crt')
};

const httpsServer = createServer(options, app);

const io = new Server(httpsServer, {
  cors: {
    origin: [`https://localhost:${port}`],
    methods: ['GET', 'POST']
  }
});

async function initMediaSoup() {
  await createWorkers(); // spins up all workers; we'll use getWorker() inside rooms.js
  console.log('mediasoup workers ready');
}

// Wait for workers before we start serving traffic
(async () => {
  await initMediaSoup();

  io.on('connection', (socket) => {
    socket.on('join', async ({ roomId }, cb) => {
      try {
        const room = await getOrCreateRoom(roomId);
        // Send the Router RTP capabilities so the client can load its Device
        cb({ routerRtpCapabilities: room.router.rtpCapabilities });
      } catch (err) {
        console.error('join error', err);
        cb({ error: err.message });
      }
    });
  });

  httpsServer.listen(port, () => {
    console.log(`Server listening on https://localhost:${port}`);
  });
})();