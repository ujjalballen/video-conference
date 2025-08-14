const express = require('express');
const app = express();
const cors = require('cors')
const mediasoup = require('mediasoup');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const createWorkers = require('./utilities/createWorkers');
const Client = require('./classes/Client');
const Room = require('./classes/Room');
const getWorker = require('./utilities/getWorker');

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

// router is now managed by the Room Object

// master rooms array that contains all our Room Object
const rooms = [];

const initMediasoup = async () => {
  workers = await createWorkers(); // function call
  // console.log(workers)


};

initMediasoup(); // build our mediasoup server/sfu


io.on('connection', (socket) => {
  // this is where this user/client/socket lives!

  let client; // this client object available to all our socket listeners

  const handshake = socket.handshake // socket.handshake is where auth and query lives;
  // you could now check handshake for password, auth, etc;
  socket.on('joinRoom', async ({ userName, roomName, router }, ackCb) => {
    let newRoom = false;
    client = new Client(userName, socket);

    let requestedRoom = rooms.find(room => room.roomName === roomName);
    if (!requestedRoom) {
      newRoom = true;
      //make the new room, add a worker, add a router
      const workerToUse = await getWorker(workers);
      requestedRoom = new Room(roomName, workerToUse);
      await requestedRoom.createRouter(io);
      rooms.push(requestedRoom);
      // console.log('Requested Room: ', requestedRoom)
    };

    // add the room to the client
    client.room = requestedRoom;
    // console.log('adc: ', client )

    // add the client to the room clients
    client.room.addClient(client);

    // add this socket to the socket room

    socket.join(client.room.roomName);


    // PLACEHOLDER.. Eventually, we will need to get all current producers... come back to this!
    ackCb({
      routerRtpCapabilities: client.room.router.rtpCapabilities,
      newRoom
    });

  });




  socket.on('requestTransport', async ({ type }, ackCb) => {

    // weather producer or comsumer, client need params
    let clientTransportParams;

    if (type === "producer") {
      // run addClient, which is part of our Client class;
      clientTransportParams = await client.addTransport(type);

    } else if (type === "consumer") {

    }
    ackCb(clientTransportParams)
  });



  socket.on('connectTransport', async ({ dtlsParameters, type }, ackCb) => {
    if (type === "producer") {
      try {
        await client.upstreamTrasport.connect({ dtlsParameters });
        ackCb('success')

      } catch (error) {
        console.log(error)
        ackCb('error')
      }
    } else if (type === "consumer") {

    }
  });



  socket.on('startProducing', async ({ kind, rtpParameters }, ackCb) => {
    /// creae a producer with the rtpParameters we were send
    try {
      const newProducer = await client.upstreamTrasport.produce({ kind, rtpParameters });
      // add the producer to this client object
      client.addProducer(kind, newProducer)

      // the front end is waiting for the id
      ackCb(newProducer.id);

    } catch (error) {
      console.log(error)
      ackCb('error')
    }

    // PLACEHOLDER 1 - if this is an audiotrack, then this is a new possible speaker 
    // PLACEHOLDER 1 - if the room populated, then let the connected peers know someone joined
  });


  socket.on('audioChange', typeOfChange => {
    if (typeOfChange === 'mute') {
      client?.producer?.audio?.pause()
    } else {
      client?.producer?.audio?.resume()
    }
  })


});



httpServer.listen(config.port, () => {
  console.log(`listening on *:${config.port}`);
});