let socket = null;
let device = null;

const initConnect = () => {
    socket = io();
    console.log(socket)

    // came from the uiStuff, where we declear our all btns
    connectButton.innerHTML = 'Connecting....'
    connectButton.disabled = true;

    addSocketListener();
};


const deviceSetup = async() => {
    console.log(mediasoupClient)

    device = new mediasoupClient.Device();

    const routerRtpCapabilities = await socket.emitWithAck('getRtpCap');
    console.log(routerRtpCapabilities)
    await device.load({routerRtpCapabilities })

    console.log(device.loaded)

};


// socket listener here
const addSocketListener = () => {
    socket.on('connect', () => {
        connectButton.innerHTML = 'Connected';
        deviceButton.disabled = false
    });


};