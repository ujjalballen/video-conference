const createWebRtcTransportBothKind = async (router) => {
    const transport = await router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true, // always used UDP unless we can't
        preferUdp: true,
        listenInfos: [
            {
                protocol: 'udp',
                ip: '127.0.0.1'  // "192.168.0.111"
            },
            {
                protocol: 'tcp',
                ip: '127.0.0.1'  // "192.168.0.111"
            }
        ]
    });


    // we could distructer from the transport
    // but we store them into the varibale
    const clientTrasportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
    };

    return {transport, clientTrasportParams};
};

module.exports = createWebRtcTransportBothKind;