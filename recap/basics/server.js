
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

};

initMediaSoup(); // build our mediasoup server/sfu



io.on('connection', (socket) => {
    console.log('socket ID: ', socket.id)

    //RTPCap = RtpCapabilities

    socket.on('getRTPCap', (cb) => {

        //cb is a callback to run, that will send the args, 
        // back to the client
        cb(router.rtpCapabilities)
    })
})



httpsServer.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})


