const createProducerTransport = (socket, device) => {
    return new Promise(async (resolve, reject) => {
        // ask the server to make a transport and send params
        const producerTransportParams = await socket.emitWithAck('requestTransport', { type: "producer" });
        // console.log(producerTransportParams)


        // use the device to create frontend transport to send 
        // it takes our object from requestTransport
        const producerTransport = device.createSendTransport(producerTransportParams);
        // console.log(producerTransport)

        // the transport connect event will not fired untill,
        // we call transport.produce()
        producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            // emit producerTransport 

            console.log('connect running produce...')
        });

        producerTransport.on('produce', async (parameters, callback, errback) => {
            // emit startProducing 
        });


        //send to the transport back to the main.js;

        resolve(producerTransport)
    });
};


export default createProducerTransport;