const express = require('express');
const app = express();
const cors = require('cors')
const mediasoup = require('mediasoup');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const createWorkers = require('./utilities/createWorkers');
const updateActiveSpeakers = require('./utilities/updateActiveSpeakers');
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

    //fetch the first 0-5 activeSpeakerList
    const audioPidsToCreate = client.room.activeSpeakerList.slice(0, 5);

    //find the videoPids and make an array with matching indicies for our audioPids
    const videoPidsToCreate = audioPidsToCreate.map(aid => {
      const producingclient = client.room.clients.find(c => c?.producer?.audio?.id === aid);
      return producingclient?.producer?.video?.id;
    });

    //find userName and make an array with matching indicies for our audioPids/videoPids
    const associatedUserNames = audioPidsToCreate.map(aid => {
      const producingclient = client.room.clients.find(c => c?.producer?.audio?.id === aid);
      // console.log(producingclient)
      return producingclient?.userName;
    })




    ackCb({
      routerRtpCapabilities: client.room.router.rtpCapabilities,
      newRoom,
      audioPidsToCreate,
      videoPidsToCreate,
      associatedUserNames
    });

  });




  socket.on('requestTransport', async ({ type, audioPid }, ackCb) => {

    // weather producer or comsumer, client need params
    let clientTransportParams;

    if (type === "producer") {
      // run addClient, which is part of our Client class;
      clientTransportParams = await client.addTransport(type);

    } else if (type === "consumer") {
      // we have 1 transport per client we are streaming from
      // each transport will have an audio and a video producer/consumer
      // we know the audio pid(because it came from dominantspeaker), get the video;
      const producingClient = client.room.clients.find(c => c?.producer?.audio?.id === audioPid)
      const videoPid = producingClient?.producer?.video?.id;

      clientTransportParams = await client.addTransport(type, audioPid, videoPid)
    }
    ackCb(clientTransportParams)
  });



  socket.on('connectTransport', async ({ dtlsParameters, type, audioPid }, ackCb) => {
    if (type === "producer") {
      try {
        await client.upstreamTrasport.connect({ dtlsParameters });
        ackCb('success')

      } catch (error) {
        console.log(error)
        ackCb('error')
      }
    } else if (type === "consumer") {
      // find the right transport
      // t= transport
      try {
        const downstreamTrasport = client.downstreamTrasports.find(t => {
          return t.associatedAudioPid === audioPid
        });

        downstreamTrasport.transport.connect({ dtlsParameters });
        ackCb('success')
      } catch (error) {
        console.log(error);
        ackCb('error')
      }
    }
  });



  socket.on('startProducing', async ({ kind, rtpParameters }, ackCb) => {
    /// creae a producer with the rtpParameters we were send
    try {
      const newProducer = await client.upstreamTrasport.produce({ kind, rtpParameters });
      // add the producer to this client object
      client.addProducer(kind, newProducer);

      // PLACEHOLDER 1 - if this is an audiotrack, then this is a new possible speaker 

      if (kind === 'audio') {
        client.room.activeSpeakerList.push(newProducer.id)
      };

      // the front end is waiting for the id
      ackCb(newProducer.id);

    } catch (error) {
      console.log(error)
      ackCb('error')
    }

    // PLACEHOLDER 1 - if the room populated, then let the connected peers know someone joined

    // run updateActiveSpeakers

    const newtransportsByPeer = updateActiveSpeakers(client.room, io);

    // newTransportsByPeer is an object, each propertry is a socket.id 
    // that has transports to make. they are in an array by pid

    for (const [socketId, audioPidsToCreate] of Object.entries(newtransportsByPeer)) {
      //we have the audioPidsToCreate this socket nees to create
      // map the video pids and the username

      const videoPidsToCreate = audioPidsToCreate.map(aPid => {
        const producerClient = client.room.clients.find((c) => {
          return c?.producer?.audio?.id === aPid
        });

        return producerClient?.producer?.video?.id;
      });


      const associatedUserNames = audioPidsToCreate.map(aPid => {
        const producerClient = client.room.clients.find((c) => {
          return c?.producer?.audio?.id === aPid
        });

        return producerClient?.userName;
      });

      io.to(socketId).emit('newProducersToConsumer', {
        routerRtpCapabilities: client.room.router.rtpCapabilities,
        audioPidsToCreate,
        videoPidsToCreate,
        associatedUserNames,
        activeSpeakerList: client.room.activeSpeakerList.slice(0, 5)
      })

    };

  });



  socket.on('audioChange', typeOfChange => {
    if (typeOfChange === 'mute') {
      client?.producer?.audio?.pause()
    } else {
      client?.producer?.audio?.resume()
    }
  });


  socket.on('consumeMedia', async ({ rtpCapabilities, pid, kind }, ackCb) => {
    // will run twice for every peer to consume... once for video, once for audio

    console.log("kind", kind, " pid", pid);

    // we will set up our clientConsumer, and send back the params
    // use the right transport and add/update the consumer in client confirm canConsume

    try {
      if (!client.room.router.canConsume({ producerId: pid, rtpCapabilities })) {
        ackCb('cannotConsume')
      } else {
        // we can consume
        // t mean singel transport
        const downstreamTrasport = client.downstreamTrasports.find(t => {
          if (kind === 'audio') {
            return t.associatedAudioPid === pid;
          } else if (kind === 'video') {
            return t.associatedVideoPid === pid;
          }
        });


        // create the consumer with the transport
        const newConsumer = await downstreamTrasport.transport.consume({
          producerId: pid,
          rtpCapabilities,
          paused: true // good practice
        })

        // add this newConsumer to the client
        client.addConsumer(kind, newConsumer, downstreamTrasport)

        // response with the params
        const clientParams = {
          producerId: pid,
          id: newConsumer.id,
          kind: newConsumer.kind,
          rtpParameters: newConsumer.rtpParameters
        }

        ackCb(clientParams);

      }

    } catch (error) {
      console.log(error);
      ackCb('consumeFailed')
    }

  });


  socket.on('unpauseConsumer', async ({ pid, kind }, ackCb) => {
    const consumerToResume = client.downstreamTrasports.find(t => {
      return t?.[kind].producerId === pid
    })

    // const consumerToResume = client.downstreamTrasports;

    // console.log('WE NEED TO SEE: ', consumerToResume)
    // console.log('WE NEED TO AUDIO AND VIDEO: ', consumerToResume.audio)

    // ackCb({consumerToResume, pid})

    await consumerToResume[kind].resume()
    ackCb()

  })


});



httpServer.listen(config.port, () => {
  console.log(`listening on *:${config.port}`);
});