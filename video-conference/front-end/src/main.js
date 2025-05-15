import './style.css'
import button from '../uiStuff/uiButtons';


const joinRoom = () => {
  const userName = document.getElementById('username').value;
  const roomName = document.getElementById('room-input').value;

  console.log(userName, roomName);
};

button.joinRoom.addEventListener('click', joinRoom);