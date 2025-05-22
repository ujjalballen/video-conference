const createProducer = (localStream, producerTransport) => {
    return new Promise(async (resolve, reject) => {
        // get audio and video tracks, so we can produce

        const videoTrack = localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];

        try {
            // runing the produce method, will tell the transport 
            // connect event to fire
            const videoProducer = await producerTransport.produce({track: videoTrack})
            const audioProducer = await producerTransport.produce({track: audioTrack})
            
            resolve({videoProducer, audioProducer})
        } catch (error) {
            console.log('Error Producing: ', error)
        }

    })
};

export default createProducer;