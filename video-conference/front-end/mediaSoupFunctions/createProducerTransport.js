const createProducerTransport = (socket) => {
    return new Promise(async (resolve, reject) => {
        // ask the server to make a transport and send params
        const producerTransportParams = await socket.emitWithAck('requestTransport', {type: "producer"} )
    });
};


export default createProducerTransport;