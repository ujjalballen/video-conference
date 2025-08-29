
const fs = require('fs'); // we need to read our .key, part of node
const { createServer } = require('https'); // we need this for a secure express server
const express = require('express');
const app = express();
const { Server } = require("socket.io");
const mediasoup = require('mediasoup');
const port = 3000;


app.use(express.static('public'));

const options = {
    key: fs.readFileSync('./config/cert.key'),
    cert: fs.readFileSync('./config/cert.crt')
};

const httpsServer = createServer(options, app);

const io = new Server(httpsServer, {
    cors: {
        origin: `http://localhost:${port}`,
        methods: ['GET', 'POST']
    }
})






httpsServer.listen(port, () => {
    console.log(`Server listening on port: ${port}`)
})


