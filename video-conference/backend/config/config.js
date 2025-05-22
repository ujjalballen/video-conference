const config = {
    port: 3031,
    workerSettings: {

        // rtcMinPort and rtcMaxPort are just arbitray port for our traffics
        // usefull for firewall and networking rules
        rtcMinPort: 40000,
        rtcMaxPort: 41000,

        // log level you want to set
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'strp',
            'rtcp'
        ]

    },
    routerMediaCodecs: [
        {
            kind: "audio",
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2
        },
        {
            kind: "video",
            mimeType: "video/H264",
            clockRate: 90000,
            parameters:
            {
                "packetization-mode": 1,
                "profile-level-id": "42e01f",
                "level-asymmetry-allowed": 1
            }
        },
        {
            kind: "video",
            mimeType: "video/VP8",
            clockRate: 90000,
            parameters: {}
        }
    ],

    webRtcTransport: {
        listenIps: [
            {
                protocol: 'udp',
                ip: '127.0.0.1'  // "192.168.0.111" or 0.0.0.0
                // announcedAddress : 'site address'
            },
            {
                protocol: 'tcp',
                ip: '127.0.0.1'  // "192.168.0.111" or 0.0.0.0
                // announcedAddress : 'site address'
            }
        ],

        //For a typical video stream with HD quality, you might set maxIncoingbitrate
        // around 5 Mbps(5000 kbps) to balance quality and bandwidth
        // 4k Ultra HD: 15 Mbps to 25 Mbps
        maxIncomingBitrate: 5000000, // 5 Mbps, default is INF
        initialAvailableOutgoingBitrate: 5000000 // 5Mbps, default is 6000000

    },



};

module.exports = config;