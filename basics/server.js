const express = require('express');
const app = express();
const mediasoup = require('mediasoup');
const {createServer } = require('http');
const { Server } = require('socket.io');

app.use(express.static('public'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    // methods: ["GET", "POST"],
    // allowedHeaders: ["my-custom-header"],
    // credentials: true
  }
});



httpServer.listen(3000, () => {
    console.log('listening on *:3000');
})