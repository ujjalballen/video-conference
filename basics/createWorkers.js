const os = require('os'); // os is a built-in module in Node.js that provides operating system-related utility methods and properties
const mediasoup = require('mediasoup');
const totalThreads = os.cpus().length; // get the number of CPU cores available on the system
// maximum number of allowed workers
console.log(`Total Threads: ${totalThreads}`); // log the number of CPU cores
const config = require('./config/config');

const createWorkers = async () => {
    let workers = [];

    for (let i = 0; i < totalThreads; i++) {
        const worker = await mediasoup.createWorker({

            // rtcMinPort and rtcMaxPort are just arbitray port for our traffics
            // usefull for firewall and networking rules
            rtcMinPort: config.workerSettings.rtcMinPort,
            rtcMaxPort: config.workerSettings.rtcMaxPort,
            logLevel: config.workerSettings.logLevel,
            logTags: config.workerSettings.logTags
        });

        worker.on('died', ()=> {
            //this should never happend, but if it does, do x.....
            console.log('Worker has died')
            process.exit(1); // kill the node program
        });

        workers.push(worker);
    };


    return workers;
};

module.exports = createWorkers;