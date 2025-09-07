
let socket = null;
let device = null;
let localStream = null;
let producerTransport = null;
let producer = null;



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

    // console.log('thisClientProducerTransport: ', data)


    const { id, iceParameters, iceCandidates, dtlsParameters } = data;


    // make a transport on the client(producer= who will send the media stream);

    const transport = device.createSendTransport(
        {
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters
        }
    );


    producerTransport = transport;


    // transport = producerTransport

    // the transport connect event will not run until,
    // call transport.produce();
    producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        // console.log("Transport connect event has fired!");
        // connect comes with local dtlsParameters. We need
        // to send these up to the server, so we can finish the connection
        // console.log('dtlsParameters: ', dtlsParameters)

        try {
            const resp = await socket.emitWithAck('connect-transport', { dtlsParameters })
            console.log(resp)
            if (resp === 'success') {
                // calling callback simple lets the app know, the server
                // succeeded in connecting, so trigger the produce event
                callback();
            } else if (resp === 'error') {
                // calling errback simple let the app know the server
                // failed in connecting, so HALT everything
                errback()
            }

        } catch (error) {
            console.error("Transport connect error (client):", error);
            errback()
        }

    });

    producerTransport.on("produce", async (parameters, callback, errback) => {
        console.log("Transport produce event has fired!");
        console.log('producerTransport produce event: ', parameters)
        try {

            const { kind, rtpParameters } = parameters;

            const resp = await socket.emitWithAck('start-producing', { kind, rtpParameters })
            console.log(resp)


            if (resp === 'error') {
                errback();
            } else {
                callback({ id: resp })
            }


            publishButton.disabled = true;
            createConsButton.disabled = false;


        } catch (error) {
            console.log('Transport produce error: ', error)
            errback();
        }

    });


    createProdButton.disabled = true;
    publishButton.disabled = false;


};

const publish = async () => {
    // console.log('asdkjfasdkj')
    // there will be more then one track, just for now we grab only one;
    const track = localStream.getVideoTracks()[0];

    // When this fires, the transport.on('connect') event will run
    const producer = await producerTransport.produce({
        track
    })

}



// this socket.on('connect) is only for client connect
function addSocketListener() {
    socket.on('connect', () => {

        connectButton.innerHTML = 'Connected'
        deviceButton.disabled = false;
    })
}