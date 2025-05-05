const express = require('express');
const app = express();
const mediasoup = require('mediasoup');
const {createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const createWorkers = require('./createWorkers');

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

// init workers, it's where our mediasoup workers will live
let workers = null;

const initMediasoup = async() => {
  workers = await createWorkers(); // function call
  console.log(workers)
};

initMediasoup(); // build our mediasoup server/sfu



httpServer.listen(config.port, () => {
    console.log(`listening on *:${config.port}`);
})