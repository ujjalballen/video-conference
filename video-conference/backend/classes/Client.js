const config = require("../config/config")

class Client {
    constructor(userName, socket) {
        this.userName = userName
        this.socket = socket

        // instead of calling this producter trasport, call it upstreamTrasport
        // this client trasport for snigaling data;
        this.upstreamTrasport = null
        //we will have an audio and video consumer
        this.producer = {}

        // instead of calling this consumer trasport, call it downstreamTrasports
        // this client trasport for pulling data or geting data
        this.downstreamTrasports = []

        // {
        //     transport,
        //     associatedAudioPid,
        //     associatedVideoPid,
        //     audio,  // consumer
        //     video,  // consumer
        // }


        // an array of consumer, each of two parts
        // this.consumer = [] // organise the data and put it inside the downstreamTrasports

        // this.room = []
        this.room = null // it will be a room object
    };

    addTransport(type, audioPid = null, videoPid = null) {
        return new Promise(async (resove, reject) => {
            const transport = await this.room.router.createWebRtcTransport({
                enableUdp: true,
                enableTcp: true, // always used UDP unless we can't
                preferUdp: true,
                listenInfos: config.webRtcTransport.listenIps,
                initialAvailableOutgoingBitrate: config.webRtcTransport.initialAvailableOutgoingBitrate,

            });


            if (config.webRtcTransport.maxIncomingBitrate) {
                // maxIncomingBitrate limit the incoming bandwidth from this transport
                try {
                    await transport.setMaxIncomingBitrate(config.webRtcTransport.maxIncomingBitrate)

                } catch (error) {
                    console.log('Error setting bitrate:', error);
                }
            }


            // we could distructer from the transport
            // but we store them into the varibale
            const clientTrasportParams = {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            };


            if (type === "producer") {
                // set the nre transport to the client's upstreamTransport
                this.upstreamTrasport = transport;

                //Testing Connection With getStats
                // setInterval(async () => {
                //     const stats = await this.upstreamTrasport.getStats();

                //     for (const report of stats.values()) {
                //         console.log(report.type)

                //         if (report.type === 'webrtc-transport') {
                //             // console.log(report)

                //             console.log(report.bytesReceived, "...", report.rtpBytesReceived);

                //         }
                //     };

                // }, 1000)

            } else if (type === "consumer") {
                // this.downstreamTrasports = transport;
                // add the new trasport AND the 2 pids, to downstream trasport

                this.downstreamTrasports.push({
                    transport, // will handle both audio and video
                    associatedAudioPid: audioPid,
                    associatedVideoPid: videoPid,

                })

            }


            resove(clientTrasportParams);
        });
    };



    addProducer(kind, newProducer) {
        this.producer[kind] = newProducer;

        if (kind === "audio") {
            // add this to our activeSpeakerObserver
            this.room.activeSpeakerObserver.addProducer({
                producerId: newProducer.id
            });
        };
    };


    addConsumer(kind, newConsumer, downstreamTrasport) {
        downstreamTrasport[kind] = newConsumer;
    }

};

module.exports = Client;