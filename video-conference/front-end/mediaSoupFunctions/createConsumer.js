//pid = could be video or audio pid
//kind = audio or video type stuff
//slot = index

const createConsumer = (consumerTransport, pid, device, socket, kind, slot) => {
    return new Promise(async (resolve, reject) => {

        // consume from the basics, emit the consumeMedia event, we take
        // the params we get back, and run .consume(). That gives us our track

        const consumerParams = await socket.emitWithAck('consumeMedia', { rtpCapabilities: device.rtpCapabilities, pid, kind });

        console.log('consumerParams', consumerParams)

        if (consumerParams === 'cannotConsume') {
            console.log('Can not Consume');
            resolve();

        } else if (consumerParams === 'consumeFailed') {
            console.log('Consume Failed....');
            resolve();

        } else {
            // we got valid params.. used them to consume
            const consumer = await consumerTransport.consume(consumerParams);
            console.log('consume().. has been finised')

            const { track } = consumer;

            // add track event
            // unpause

            // const getValue = await socket.emitWithAck('unpauseConsumer', { pid, kind })
            // console.log('getValue', getValue)

            await socket.emitWithAck('unpauseConsumer', { pid, kind })
            resolve(consumer)

            // console.log('pid need: ', pid, kind)
        }
    });
};

export default createConsumer;