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

        // an array of consumer, each of two parts
        this.consumer = []

        // this.room = []
        this.room = null // it will be a room object
    };

    addTransport(type) {
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


            if(type === "producer"){
                // set the nre transport to the client's upstreamTransport
                this.upstreamTrasport = transport
            }else if(type === "consumer"){
                // this.downstreamTrasports = transport;
            }


            resove({clientTrasportParams});
        });
    };
};

module.exports = Client;