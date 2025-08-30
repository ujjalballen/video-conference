const mediasoupConfig = {
    workerSettings: {
        // rtcMinPort and max are just arbitray ports for our traffic
        // usefull for firewall or networking rules

        rtcMinPort: 10000,
        rtcMaxPort: 59999,
        logLevel: 'warn',
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'strp',
            'rtcp'
        ]
    }
};

export default mediasoupConfig;