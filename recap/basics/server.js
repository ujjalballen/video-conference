
import { readFileSync } from 'fs'; // we need to read our .key, part of node
import { createServer } from 'https'; // we need this for a secure express server
import express from 'express';
const app = express();
import { Server } from "socket.io";
import mediasoup from 'mediasoup';
import { createWorkers, getWorker } from './createWorkers.js';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';
import createWebRtcTransportBothkind from './createWebRtcTransportBothkind.js';
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
})

// it's where our mediasoup workers will live(probably one, because we used null, instead [])
let workers = null

let router = null;

// initMediaSoup gets mediasoup ready to do things
const initMediaSoup = async () => {
    workers = await createWorkers();

    router = await workers[0].createRouter({ mediaCodecs: mediasoupConfig.routerMediaCodecs })

    // console.log('router: ', router.appData)
    // console.log('routerAppData: ', router)

};

initMediaSoup(); // build our mediasoup server/sfu



io.on('connection', (socket) => {
    console.log('socket ID: ', socket.id)

    let thisClientProducerTransport = null;
    let thisClientProducer = null;
    let thisClientConsumerTransport = null;
    let thisClientConsumer = null;



    //RTPCap = RtpCapabilities
    socket.on('getRTPCap', (ack) => {

        //ack is a callback to run, that will send the args, 
        // back to the client
        ack(router.rtpCapabilities)
    });


    socket.on('create-producer-transport', async (ack) => {

        const { transport, params } = await createWebRtcTransportBothkind(router)

        thisClientProducerTransport = transport;

        ack(params) // what we send back to the client
    });


    // connect-transport mean producerTransport connect event
    socket.on('connect-transport', async (dtlsParameters, ack) => {
        // get the dtlsParameters from the client and finish the connection

        try {

            // there thisCLientProducerTransport mean webRtcTransport
            // (which we already created using createWebRtcTransport)
            await thisClientProducerTransport.connect(dtlsParameters);
            ack('success');

        } catch (error) {
            console.log(error)
            ack('error')
        }
    });



    socket.on('start-producing', async ({ kind, rtpParameters }, ack) => {
        try {

            thisClientProducer = await thisClientProducerTransport.produce({ kind, rtpParameters });
            ack(thisClientProducer.id)
        } catch (error) {
            console.log(error);
            ack('error')
        }
    });



    // Consumer stuff

    socket.on('create-consumer-transport', async (ack) => {
        const { transport, params } = await createWebRtcTransportBothkind(router);

        thisClientConsumerTransport = transport;

        ack(params)
    });



    socket.on('connect-consumer-transport', async (dtlsParameters, ack) => {
        try {

            await thisClientConsumerTransport.connect(dtlsParameters)
            ack('success')
        } catch (error) {
            ack('error')
        }

    })





})



httpsServer.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})


