const createProducerTransport = (socket, device) => {
    return new Promise(async (resolve, reject) => {
        // ask the server to make a transport and send params
        const producerTransportParams = await socket.emitWithAck('requestTransport', { type: "producer" });
        // console.log(producerTransportParams)


        // use the device to create frontend transport to send 
        // it takes our object from requestTransport
        const producerTransport = device.createSendTransport(producerTransportParams);
        // console.log(producerTransport)


        producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            // the transport connect event will not fired untill,
            // we call transport.produce();
            // dtlsParams are created by the broser so we can finish the other half of the connection
            // emit connectTransport 

            console.log('connect running produce...');

            const connectResp = await socket.emitWithAck('connectTransport', { dtlsParameters, type: "producer" })
            console.log(connectResp + 'connectResp is back')
            if (connectResp == "success") {
                // we are connected! move forward
                callback();
            } else if (connectResp === "error") {
                // connection faild, stopped!
                errback();
            }
        });

        producerTransport.on('produce', async (parameters, callback, errback) => {
            // emit startProducing 
            console.log('now producerTrasport on "produce" is running!')

            const { kind, rtpParameters } = parameters;
            const produceResp = await socket.emitWithAck('startProducing', { kind, rtpParameters });
            console.log(produceResp + ' produce produceResp is Back')

            if (produceResp === "error") {
                errback();
            } else {
                // only other option to the producer id
                callback({ id: produceResp.id });
            }
        });

        //Testing Connection With getStats
        
        // setInterval(async() => {
        //     const stats = await producerTransport.getStats();

        //     for(const report of stats.values()){
        //         // console.log("Report", report)

        //         if(report.type === 'outbound-rtp'){
        //             console.log(report.bytesSent, "...", report.packetsSent);

        //         }
        //     };

        // }, 1000)



        //send to the transport back to the main.js;

        resolve(producerTransport)
    });
};


export default createProducerTransport;