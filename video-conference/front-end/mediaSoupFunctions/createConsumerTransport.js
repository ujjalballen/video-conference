const createConsumerTransport = (consumerTransportParams, device, socket, audioPid) => {
    // make a downstream transport for ONE producer/peer/client (with audio and video producer)

    const consumerTransport = device.createRecvTransport(consumerTransportParams)

    consumerTransport.on('connectionstatechange', state => {
        console.log('===connectionstatechange====');
        console.log(state)
    });


    consumerTransport.on('icegatheringstatechange', state => {
        console.log('===icegatheringstatechange====');
        console.log(state)
    });


    // transport connect listener.... fires on  .consume()
    consumerTransport.on('connect', async({dtlsParameters}, callback, errback) => {
        console.log("Transport connect event has firred!")

        //connect comes with local dtlsParameters, we need
        // to send these up to the server, so we can finish the connection

        const connectResp = await socket.emitWithAck('connectTransport', {dtlsParameters, type: 'consumer', audioPid })

        console.log(connectResp, 'connectResp is Back');

        if(connectResp === 'success'){
            callback(); // it will finished our wait consume
        }else{
            errback()
        }
    })


    return consumerTransport;


};

export default createConsumerTransport;