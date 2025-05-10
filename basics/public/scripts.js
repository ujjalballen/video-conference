//Global Scope
let socket = null;
let device = null;
let localStream = null;
let producerTransport = null;


const initConnect = () => {
    socket = io();
    console.log(socket)

    // came from the uiStuff, where we declear our all btns
    connectButton.innerHTML = 'Connecting....'
    connectButton.disabled = true;

    addSocketListener();
};


//deviceSetup event logic

const deviceSetup = async () => {
    console.log(mediasoupClient);

    device = new mediasoupClient.Device();

    const routerRtpCapabilities = await socket.emitWithAck('getRtpCap');
    console.log(routerRtpCapabilities);
    await device.load({ routerRtpCapabilities });

    // console.log(device.loaded)
    deviceButton.disabled = true;
    createProdButton.disabled = false;


};


// createProducer event logic

const createProducer = async () => {
    // console.log('hello there')
    try {

        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });

        localVideo.srcObject = localStream;

        //ask the socket server(signaling) for transport information
        const data = await socket.emitWithAck('create-producer-transport');
        console.log(data);


    } catch (error) {
        console.log(error)
    }

};


// socket listener here
const addSocketListener = () => {
    socket.on('connect', () => {
        connectButton.innerHTML = 'Connected';
        deviceButton.disabled = false
    });


};