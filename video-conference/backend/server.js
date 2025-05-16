const express = require('express');
const app = express();
const cors = require('cors')
const mediasoup = require('mediasoup');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const createWorkers = require('./createWorkers');
const Client = require('./classes/Client');
const Room = require('./classes/Room');

app.use(express.json());
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: `http://localhost:5173`,
    // methods: ["GET", "POST"],
    // allowedHeaders: ["my-custom-header"],
    // credentials: true
  }
});


// our global
// init workers, it's where our mediasoup workers will live
let workers = null;
//init router, its where only 1 router will live
let router = null;


const initMediasoup = async () => {
  workers = await createWorkers(); // function call
  // console.log(workers)

  // we just take only one workers ==> we can run a forEach loop for all workers
  router = await workers[0].createRouter({
    mediaCodecs: config.routerMediaCodecs
  })
};

initMediasoup(); // build our mediasoup server/sfu


io.on('connection', (socket) => {
  // this is where this user/client/socket lives!

  let client; // this client object available to all our socket listeners

  const handshake = socket.handshake // socket.handshake is where auth and query lives;
  // you could now check handshake for password, auth, etc;
  socket.on('joinRoom', async ({ userName, roomName, router }, ack) => {
    client = new Client(userName, socket, router);


  });

});



httpServer.listen(config.port, () => {
  console.log(`listening on *:${config.port}`);
});