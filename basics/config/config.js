const config = {
    port: 3030,
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

    }

};

module.exports = config;