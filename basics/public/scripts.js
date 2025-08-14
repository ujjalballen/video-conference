//Global Scope
let socket = null;
let device = null;
let localStream = null;
let producerTransport = null;
let producer = null;
let consumerTransport = null;
let consumer = null;



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
    createConsButton.disabled = false;
    disconnectButton.disabled = false;


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

        // //ask the socket server(signaling) for transport information
        // const data = await socket.emitWithAck('create-producer-transport');
        // console.log(data);

    } catch (error) {
        console.log(error)
    };

    //ask the socket server(signaling) for transport information
    const data = await socket.emitWithAck('create-producer-transport');
    const { id, iceParameters, iceCandidates, dtlsParameters } = data;
    // console.log(data);

    // make a transport on the client(producer)
    const transport = device.createSendTransport({
        id,
        iceParameters,
        iceCandidates,
        dtlsParameters
    });

    producerTransport = transport; // we can do it into oneline

    // the transport connect event will not fired untill,
    // we call transport.produce()
    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        // console.log('transport connect even has fired')
        // connect comes with local dtlsParameters. we need to send those up to server,
        // so we can finished the connection

        console.log(dtlsParameters)
        const response = await socket.emitWithAck('connect-transport', { dtlsParameters });
        console.log(response)

        if (response === 'success') {
            // calling callback simply let the app know, the server succeed
            // in connecting, so trigger the produce event
            callback();
        } else if (response === 'error') {
            // calling errback simply let the app know, the server faild/error
            // in connecting, so HALT everything
            errback();
        }

    });



    producerTransport.on('produce', async (parameters, callback, errback) => {
        console.log('transport produce even has fired')
        console.log(parameters)

        const { kind, rtpParameters } = parameters;

        const response = await socket.emitWithAck('start-producing', { kind, rtpParameters });
        // console.log(response)
        if (response === 'error') {
            //somehing is wrong when the server tried to produce
            errback();
        } else {
            // response contains a id;
            callback({ id: response });
        };

        publishButton.disabled = true;
        createConsButton.disabled = false;

    });


    createProdButton.disabled = true;
    publishButton.disabled = false;

};


// publish feed logic will be here
const publish = async () => {
    // console.log('hello')

    const videoTrack = localStream.getVideoTracks()[0];
    producer = await producerTransport.produce({
        track: videoTrack
    });

    console.log(videoTrack)

};


// create Consume transport logic is here
const createConsumer = async () => {
    const data = await socket.emitWithAck('create-consumer-transport');
    const { id, iceParameters, iceCandidates, dtlsParameters } = data;
    console.log(data);

    const transport = device.createRecvTransport({
        id,
        iceParameters,
        iceCandidates,
        dtlsParameters
    });

    consumerTransport = transport;


    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        // connect comes with local dtlsParameters. we need to send those up to server,
        // so we can finished the connection

        const response = await socket.emitWithAck('connect-consumer-transport', { dtlsParameters });
        console.log(response)

        if (response === 'success') {
            // calling callback simply let the app know, the server succeed
            // in connecting, so trigger the produce event
            callback();
        } else if (response === 'error') {
            // calling errback simply let the app know, the server faild/error
            // in connecting, so HALT everything
            errback();
        }

    });

    createConsButton.disabled = true;
    consumeButton.disabled = false;


};



const consume = async () => {
    // emit the consume media event.. This is get us back the 'stuff'
    // that we need to make a consumer and get video tracks
    const rtpCapabilities = device.rtpCapabilities;
    const consumerParams = await socket.emitWithAck('consume-media', { rtpCapabilities });
    console.log(consumerParams);
    if (consumerParams === 'noProducer') {
        console.log('There is not Producer set up to consume!')
    } else if (consumerParams === 'canNotConsume') {
        console.log('rtpCapabilities faild. Cannot consume')
    } else {
        // setup our consumer! and add the video to the video tag
        consumer = await consumerTransport.consume(consumerParams);
        const { track } = consumer;
        console.log(track)

        // see MDN on mediaStram for a Ton more of information
        remoteVideo.srcObject = new MediaStream([track]);

        console.log('The track is Live!')
        // track is ready, now need to unpaused

        await socket.emitWithAck('unpauseConsumer');
    };

};



const disconnect = async () => {
    // we want to close everything, right now!
    // send a message to the server, then closed here
    console.log('disconnect')
    const closedResp = await socket.emitWithAck('close-all');
    if (closedResp === 'closeError') {
        console.log('Somethings happend with the server!')
    }

    // it doesn't matter if the server didn't close, we are closed now!
    producerTransport?.close();
    consumerTransport?.close();
};


// socket listener here
const addSocketListener = () => {
    socket.on('connect', () => {
        connectButton.innerHTML = 'Connected';
        deviceButton.disabled = false
    });


};