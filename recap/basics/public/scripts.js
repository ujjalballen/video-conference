
let socket = null;
let device = null;
let localStream = null;
let producerTransport = null;



const initConnect = () => {


    socket = io('https://localhost:3000/');
    connectButton.innerHTML = 'connecting...'
    connectButton.disabled = true;


    // keep the socket listener in there own place;
    addSocketListener()

    console.log('connected..')
}



const deviceSetup = async () => {

    try {

        device = new mediasoupClient.Device(); // deprecated

        //  await mediasoupClient.Device.factory()

        // get routerRtpCapabilities from server via socket
        const routerRtpCapabilities = await socket.emitWithAck("getRTPCap");

        console.log(routerRtpCapabilities)

        // you MUST load the device with router capabilities
        await device.load({ routerRtpCapabilities });

        // console.log("Device created:", device);
        // console.log(device.loaded)

        deviceButton.disabled = true;
        createProdButton.disabled = false;

    } catch (err) {
        if (err.name === "UnsupportedError") {
            console.warn("Browser not supported");
        } else {
            console.error("Error creating Device:", err);
        }
    }
};


const createProducer = async () => {
    // console.log('create producer')

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        localVideo.srcObject = localStream;


    } catch (error) {
        console.log('Get User media error: ', error)
    }

    // ask the socket.io server(signaling) for transport infomation
    const data = await socket.emitWithAck('create-producer-transport');
    console.log('thisClientProducerTransport: ', data)

};



// this socket.on('connect) is only for client connect
function addSocketListener() {
    socket.on('connect', () => {

        connectButton.innerHTML = 'Connected'
        deviceButton.disabled = false;
    })
}