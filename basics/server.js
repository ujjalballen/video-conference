const express = require('express');
const app = express();
const mediasoup = require('mediasoup');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const createWorkers = require('./createWorkers');
const createWebRtcTransportBothKind = require('./createWebRtcTransportBothKind');

app.use(express.static('public'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: `http://localhost:${config.port}`,
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
  console.log(socket.id + 'user connected');
  let thisClientProducerTransport = null;
  let thisClientProducer = null;
  let thisClientConsumerTransport = null;
  let thisClientConsumer = null;


  socket.on('getRtpCap', (ack) => {

    // ack is a callback to run, the will send the args
    // back to the client
    ack(router.rtpCapabilities);
  });



  socket.on('create-producer-transport', async (ack) => {
    // create a transport! A producer transport
    /*     thisClientProducerTransport = await router.createWebRtcTransport({
          enableUdp: true,
          enableTcp: true, // always used UDP unless we can't
          preferUdp: true,
          listenInfos: [
            {
              protocol: 'udp',
              ip: '127.0.0.1'  // "192.168.0.111"
            },
            {
              protocol: 'tcp',
              ip: '127.0.0.1'  // "192.168.0.111"
            }
          ]
        });
    
        // console.log(thisClientProducerTransport)
    
        // we could distructer from the thisClientProducerTransport
        // but we store them into the varibale
        const clientTrasportParams = {
          id: thisClientProducerTransport.id,
          iceParameters: thisClientProducerTransport.iceParameters,
          iceCandidates: thisClientProducerTransport.iceCandidates,
          dtlsParameters: thisClientProducerTransport.dtlsParameters
        }; */

    const { transport, clientTrasportParams } = await createWebRtcTransportBothKind(router);
    thisClientProducerTransport = transport; // store in thisClientProducerTransport variable
    ack(clientTrasportParams); // what we send back to the client
  });



  socket.on('connect-transport', async (dtlsParameters, ack) => {
    // get dtls info from the client and finish the connection
    // on success, send success, faild the error/faild
    try {
      await thisClientProducerTransport.connect(dtlsParameters); // from client it pass using object

      ack('success');

    } catch (error) {
      // something is wrong then send back and log;
      console.log(error);
      ack('error');
    }

  });


  socket.on('start-producing', async ({ kind, rtpParameters }, ack) => {
    try {
      thisClientProducer = await thisClientProducerTransport.produce({ kind, rtpParameters })

      ack(thisClientProducer.id);

    } catch (error) {
      console.log(error);
      ack('error');
    }
  });



  socket.on('create-consumer-transport', async (ack) => {
    const { transport, clientTrasportParams } = await createWebRtcTransportBothKind(router);
    thisClientConsumerTransport = transport;
    ack(clientTrasportParams);
  });



  socket.on('connect-consumer-transport', async (dtlsParameters, ack) => {
    // get dtls info from the client and finish the connection
    // on success, send success, faild the error/faild
    try {
      await thisClientConsumerTransport.connect(dtlsParameters); // from client it pass using object

      ack('success');

    } catch (error) {
      // something is wrong then send back and log;
      console.log(error);
      ack('error');
    }

  });



  socket.on('consume-media', async ({ rtpCapabilities }, ack) => {
    // we will setup our clientConsumer and send back,
    // params the client needs to the same
    // make sure there is a producer(we can't consume without one);

    if (!thisClientProducer) {
      ack('noProducer');
    } else if (!router.canConsume({ producerId: thisClientProducer.id, rtpCapabilities })) {
      ack('canNotConsume')
    } else {
      // we can consume... there is a producer and client is able.
      //proceed!

      thisClientConsumer = await thisClientConsumerTransport.consume({
        producerId: thisClientProducer.id,
        rtpCapabilities,
        paused: true // see doc, it's a usually best way to start
      });

      const consumerParams = {
        producerId: thisClientProducer.id,
        id: thisClientConsumer.id,
        kind: thisClientConsumer.kind,
        rtpParameters: thisClientConsumer.rtpParameters
      };

      ack(consumerParams);
    };
  });


  socket.on('unpauseConsumer', async(ack) => {
    await thisClientConsumer.resume();
  });

  

});


httpServer.listen(config.port, () => {
  console.log(`listening on *:${config.port}`);
})