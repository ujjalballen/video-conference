
import { readFileSync } from 'fs'; // we need to read our .key, part of node
import { createServer } from 'https'; // we need this for a secure express server
import express from 'express';
const app = express();
import { Server } from "socket.io";
import mediasoup from 'mediasoup';
import createWorkers from './createWorkers.js';
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
let worker = null

// initMediaSoup gets mediasoup ready to do things
const initMediaSoup = async () => {
    worker = await createWorkers();
    // console.log(worker)
};

initMediaSoup(); // build our mediasoup server/sfu






httpsServer.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})


