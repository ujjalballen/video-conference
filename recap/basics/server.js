
import { readFileSync } from 'fs'; // we need to read our .key, part of node
import { createServer } from 'https'; // we need this for a secure express server
import express from 'express';
const app = express();
import { Server } from "socket.io";
import mediasoup from 'mediasoup';
import { createWorkers, getWorker } from './createWorkers.js';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';
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



    //RTPCap = RtpCapabilities
    socket.on('getRTPCap', (ack) => {

        //ack is a callback to run, that will send the args, 
        // back to the client
        ack(router.rtpCapabilities)
    });


    socket.on('create-producer-transport', async (ack) => {

        //create a transport / A producer transport;
        thisClientProducerTransport = await router.createWebRtcTransport({
            enableUdp: true,
            enableTcp: true, // used used UDP, unless we can't;
            preferUdp: true,
            listenInfos: [
                {
                    protocol: "udp",
                    ip: "0.0.0.0", // we can used 127.0.0.1 AND 192.168.0.111 for local test
                    // announcedAddress: "203.0.113.45" // your server’s public IP or domain

                },
                {
                    protocol: "tcp",
                    ip: "0.0.0.0", // we can used 127.0.0.1 AND 192.168.0.111 for local test
                    // announcedAddress: "203.0.113.45" // your server’s public IP or domain

                }
            ]
        });

        // const {id, iceParameters, iceCandidates, dtlsParameters} = thisClientProducerTransport;
        // console.log(id)
        // console.log(iceParameters)
        // console.log(iceCandidates)

        const clientTransportParams = {
            id: thisClientProducerTransport?.id,
            iceParameters: thisClientProducerTransport?.iceParameters,
            iceCandidates: thisClientProducerTransport?.iceCandidates,
            dtlsParameters: thisClientProducerTransport?.dtlsParameters,
            
        }


        ack(clientTransportParams) // what we send back to the client
    })
})



httpsServer.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})


