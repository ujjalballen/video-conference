import './style.css'
import { Device, Transport } from 'mediasoup-client';
import { io } from "socket.io-client";
import buttons from '../uiStuff/uiButtons';
import createProducerTransport from '../mediaSoupFunctions/createProducerTransport';

let device = null;
let localStream = null;
let producerTransport = null;

const socket = io('http://localhost:3031'); // server URL
socket.on('connect', () => {
  console.log('socket connected!')
});

// joinRoom Logic

const joinRoom = async () => {
  const userName = document.getElementById('username').value;
  const roomName = document.getElementById('room-input').value;
  const joinRoomResp = await socket.emitWithAck('joinRoom', { userName, roomName });
  // console.log(joinRoomResp);

  device = new Device();

  await device.load({ routerRtpCapabilities: joinRoomResp.routerRtpCapabilities });

  console.log(device)

  // PLACEHOLDER... Start making the transports for current speakers
  buttons.control.classList.remove('d-none');
};


// enableFeed logic

const enableFeed = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  buttons.localMediaLeft.srcObject = localStream;

  // button disabled and endabled
  buttons.enableFeed.disabled = true;
  buttons.sendFeed.disabled = false;
  buttons.muteBtn.disabled = false;
};


// sendFeed logic

const sendFeed = async () => {
  // create a trasport for THIS cliet's upstream
  // it will hand both audio and video producer
producerTransport = await createProducerTransport(socket);
};


buttons.joinRoom.addEventListener('click', joinRoom);
buttons.enableFeed.addEventListener('click', enableFeed);
buttons.sendFeed.addEventListener('click', sendFeed);