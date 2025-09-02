
let socket = null;
let device = null;


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

    } catch (err) {
        if (err.name === "UnsupportedError") {
            console.warn("Browser not supported");
        } else {
            console.error("Error creating Device:", err);
        }
    }
};



// this socket.on('connect) is only for client connect
function addSocketListener() {
    socket.on('connect', () => {

        connectButton.innerHTML = 'Connected'
        deviceButton.disabled = false;
    })
}