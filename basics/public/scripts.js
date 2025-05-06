let socket = null;

const initConnect = () => {
    socket = io();
    console.log(socket)

    // came from the uiStuff, where we declear our all btns
    connectButton.innerHTML = 'Connecting....'
    connectButton.disabled = true;

    addSocketListener();
};


// socket listener here
const addSocketListener = () => {
    socket.on('connect', () => {
        connectButton.innerHTML = 'Connected';
        deviceButton.disabled = false
    });
};