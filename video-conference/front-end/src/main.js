import './style.css'
import { Device, Transport } from 'mediasoup-client';
import { io } from "socket.io-client";
import buttons from '../uiStuff/uiButtons';
import createProducerTransport from '../mediaSoupFunctions/createProducerTransport';
import createProducer from '../mediaSoupFunctions/createProducer';


let device = null;
let localStream = null;
let producerTransport = null;
let videoProducer = null;
let audioProducer = null;

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

  console.log('all devices', device)

  // PLACEHOLDER... Start making the transports for current speakers
  buttons.control.classList.remove('d-none');
};


// enableFeed logic

const enableFeed = async () => {
try {
    localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  buttons.localMediaLeft.srcObject = localStream;

  // button disabled and endabled
  buttons.enableFeed.disabled = true;
  buttons.sendFeed.disabled = false;
  buttons.muteBtn.disabled = false;
  
} catch (error) {
  console.log(error)
}
};


// sendFeed logic

const sendFeed = async () => {
  // create a trasport for THIS cliet's upstream
  // it will hand both audio and video producer
  producerTransport = await createProducerTransport(socket, device);
  // console.log('Have producer transport, Time to produce')

  // create our producers
  const producers = await createProducer(localStream, producerTransport)
  videoProducer = producers.videoProducer;
  audioProducer = producers.audioProducer;
  console.log(producers);
  buttons.hangUp.disabled = false;
};


const muteAudio = () => {
// mute at the producer level, to keep the transport, and all
// other mechanism in place;
if(audioProducer.paused){
  // currently paused. user wants to unpause;
  audioProducer.resume();
  buttons.muteBtn.innerHTML = 'Audio On';
  buttons.muteBtn.classList.add('btn-success');
  buttons.muteBtn.classList.remove('btn-danger');

  // unpause on the server;
  socket.emit('audioChange', 'unmute');
}else{
  audioProducer.pause();
  buttons.muteBtn.innerHTML = 'Audio Muted';
  buttons.muteBtn.classList.remove('btn-success');
  buttons.muteBtn.classList.add('btn-danger');

  // pause/mute on the server;
  socket.emit("audioChange", "mute")
}

};


buttons.joinRoom.addEventListener('click', joinRoom);
buttons.enableFeed.addEventListener('click', enableFeed);
buttons.sendFeed.addEventListener('click', sendFeed);
buttons.muteBtn.addEventListener('click', muteAudio);