import './style.css'
import button from '../uiStuff/uiButtons';
import { Device, Transport } from 'mediasoup-client';
import { io } from "socket.io-client";
import uiButtons from '../uiStuff/uiButtons';

let device = null;

const socket = io('http://localhost:3031'); // server URL
socket.on('connect', () => {
  console.log('socket connected!')
});

const joinRoom = async () => {
  const userName = document.getElementById('username').value;
  const roomName = document.getElementById('room-input').value;
  const joinRoomResp = await socket.emitWithAck('joinRoom', { userName, roomName });
  // console.log(joinRoomResp);

  device = new Device();

  await device.load({ routerRtpCapabilities: joinRoomResp.routerRtpCapabilities });

  console.log(device)

  // PLACEHOLDER... Start making the transports for current speakers
  uiButtons.control.classList.remove('d-none');
};

button.joinRoom.addEventListener('click', joinRoom);