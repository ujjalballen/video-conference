// joinRoomResp = consumeData

import createConsumer from "./createConsumer";
import createConsumerTransport from "./createConsumerTransport";

const requestTransportToConsumre = (consumeData, socket, device, consumers) => {
    // how many transports? one for each cosumer?
    // or one that handles all comsumers?
    // if er do one for eevery consumer, it will mean we can do
    // POSITIVE: more fine grained networking control
    // it also means if one transport is lost or unstable,
    // the others are ok.
    // NEGATIVE: But it's confusing!
    //if we have one tansport and all the consumers use it,
    // POSITIVE: this makes our code much eaier to manage
    // and is poentially more efficient for the server
    //NEGATIVE: we have on fine conrol and a single point of failure
    // This means every peer has a upstream transport and a 
    // downstream one, so the server will have 2nd transports open,
    // where in is the number of peers

    consumeData.audioPidsToCreate.forEach(async (audioPid, index) => {
        const videoPid = consumeData.videoPidsToCreate[index];
        //expact back transport params for THIS Pids, maybe 5 times, maybe 0
        const consumerTransportParams = await socket.emitWithAck('requestTransport', { type: 'consumer', audioPid })

        console.log('consumerTransportParams', consumerTransportParams)

        const consumerTransport = createConsumerTransport(consumerTransportParams, device, socket, audioPid);

        const [audioConsumer, videoConsumer] = await Promise.all([
            createConsumer(consumerTransport, audioPid, device, socket, 'audio', index),
            createConsumer(consumerTransport, videoPid, device, socket, 'video', index)
        ])


        console.log('audioConsumer', audioConsumer)
        console.log('videoConsumer', videoConsumer)
        console.log("index; ", index)


        // create a new mediaStream on the client with both tracks
        // this is why we have gone through all this pain

        const combinedStream = new MediaStream([audioConsumer?.track, videoConsumer?.track])
        const remoteVideo = document.getElementById(`remote-video-${index}`)
        remoteVideo.srcObject = combinedStream

        console.log('hope this work')

        consumers[audioPid] = {
            combinedStream,
            userName: consumeData.associatedUserNames[index],
            consumerTransport,
            audioConsumer,
            videoConsumer
        }
    })


};

export default requestTransportToConsumre;