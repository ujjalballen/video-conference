import './style.css'
import button from '../uiStuff/uiButtons';
import { Device, Transport } from 'mediasoup-client';
import { io } from "socket.io-client";

const socket = io('http://localhost:3031'); // server URL
socket.on('connect', () => {
  console.log('socket connected!')
});

const joinRoom = async() => {
  const userName = document.getElementById('username').value;
  const roomName = document.getElementById('room-input').value;
  const joinRoomResp = await socket.emitWithAck('joinRoom', {userName, roomName});
  console.log(joinRoomResp);
};

button.joinRoom.addEventListener('click', joinRoom);