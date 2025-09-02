
// createWorkers.js
import os from 'os';
import mediasoup from 'mediasoup';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';

const totalThreads = os.cpus().length;
const MAX_RESTARTS = 5;
const RESTART_WINDOW = 10000;
const RESTART_DELAY = 2000;

const workers = [];
let nextWorkerIndex = 0;
const restartCounts = new Map();

// create a single worker with safe restart
const createSingleWorker = async (isRestart = false) => {
  const worker = await mediasoup.createWorker({
    rtcMinPort: mediasoupConfig.workerSettings.rtcMinPort,
    rtcMaxPort: mediasoupConfig.workerSettings.rtcMaxPort,
    logLevel: mediasoupConfig.workerSettings.logLevel,
    logTags: mediasoupConfig.workerSettings.logTags,
  });

  console.log(`Worker PID ${worker.pid} created${isRestart ? ' (restarted)' : ''}`);

  worker.on('died', async () => {
    console.error(`Worker ${worker.pid} died`);

    // Remove from pool
    const index = workers.indexOf(worker);
    if (index !== -1) workers.splice(index, 1);

    // Track restarts in time window
    const now = Date.now();
    let restarts = restartCounts.get(worker.pid) || [];
    restarts = restarts.filter(ts => now - ts < RESTART_WINDOW);
    restarts.push(now);
    restartCounts.set(worker.pid, restarts);

    if (restarts.length > MAX_RESTARTS) {
      console.error(`Worker crashed too often, exiting.`);
      process.exit(1);
    }

    // Restart after delay
    setTimeout(async () => {
      try {
        const newWorker = await createSingleWorker(true);
        workers.push(newWorker);
        console.log(`Worker restarted, new PID: ${newWorker.pid}`);
      } catch (err) {
        console.error(`Failed to restart worker: ${err.message}`);
        if (workers.length === 0) process.exit(1);
      }
    }, RESTART_DELAY);
  });

  return worker;
};

// create all workers
export const createWorkers = async () => {
  console.log(`Creating ${totalThreads} workers...`);
  for (let i = 0; i < totalThreads; i++) {
    const worker = await createSingleWorker();
    workers.push(worker);
  }
  console.log(`${workers.length}/${totalThreads} workers ready`);
  return workers;
};

// round-robin worker selector
export const getWorker = () => {
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
};






/* import os from 'os';
import mediasoup from 'mediasoup';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';

const totalThreads = os.cpus().length; // maxium bumber of allowed workers

// console.log(totalThreads)

const createWorkers = async () => {
    const workers = [];

    // loop to create each worker

    for (let i = 0; i < totalThreads; i++) {
        const worker = await mediasoup.createWorker({
            rtcMinPort: mediasoupConfig.workerSettings.rtcMinPort,
            rtcMaxPort: mediasoupConfig.workerSettings.rtcMaxPort,
            logLevel: mediasoupConfig.workerSettings.logLevel,
            logTags: mediasoupConfig.workerSettings.logTags,
        });

        worker.on('died', () => {
            // this should never happen, but if it does, do...x

            console.log('Worker has died');
            process.exit(1);
        });

        workers.push(worker);
    }

    return workers;
};

export default createWorkers;

 */







// Restart the worker when it died
// we used recursion for handling the restart

/*


import os from 'os';
import mediasoup from 'mediasoup';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';

const totalThreads = os.cpus().length;

const createWorkers = async () => {
  const workers = [];

  // Helper to create a single worker and set up its 'died' handler
  const createSingleWorker = async () => {
    const worker = await mediasoup.createWorker({
      rtcMinPort: mediasoupConfig.workerSettings.rtcMinPort,
      rtcMaxPort: mediasoupConfig.workerSettings.rtcMaxPort,
      logLevel: mediasoupConfig.workerSettings.logLevel,
      logTags: mediasoupConfig.workerSettings.logTags,
    });

    console.log(`Worker PID ${worker.pid} created`);

    // If worker dies, restart it
    worker.on('died', async () => {
      console.error(`Worker ${worker.pid} died, restarting...`);

      // Remove the dead worker from array
      const index = workers.indexOf(worker);
      if (index !== -1) workers.splice(index, 1);

      try {
        const newWorker = await createSingleWorker();
        workers.push(newWorker);
      } catch (err) {
        console.error('Failed to restart worker:', err);
        process.exit(1);
      }
    });

    return worker;
  };

  // Create all workers at startup
  for (let i = 0; i < totalThreads; i++) {
    const worker = await createSingleWorker();
    workers.push(worker);
  }

  console.log(`All ${totalThreads} workers created`);

  return workers;
};

export default createWorkers;


*/







// handle the rapitadive look if the worker die more

/* 


import os from 'os';
import mediasoup from 'mediasoup';
import mediasoupConfig from './mediasoupConfig/mediasoupConfig.js';

const totalThreads = os.cpus().length;
const MAX_RESTARTS = 5;      // max restarts in the window
const RESTART_WINDOW = 10000; // 10 seconds window
const RESTART_DELAY = 2000;   // 2 seconds delay before restart

const createWorkers = async () => {
  const workers = [];
  const restartCounts = new Map(); // track restarts per worker

  const createSingleWorker = async (isRestart = false) => {
    try {
      const worker = await mediasoup.createWorker({
        rtcMinPort: mediasoupConfig.workerSettings.rtcMinPort,
        rtcMaxPort: mediasoupConfig.workerSettings.rtcMaxPort,
        logLevel: mediasoupConfig.workerSettings.logLevel,
        logTags: mediasoupConfig.workerSettings.logTags,
      });

      console.log(`Worker PID ${worker.pid} created${isRestart ? ' (restarted)' : ''}`);

      worker.on('died', async () => {
        console.error(`Worker ${worker.pid} died`);

        // Remove dead worker from array
        const index = workers.indexOf(worker);
        if (index !== -1) {
          workers.splice(index, 1);
          console.log(`Removed dead worker ${worker.pid}. Active workers: ${workers.length}`);
        }

        // Track restarts with sliding window
        const now = Date.now();
        let restarts = restartCounts.get(worker.pid) || [];
        
        // Remove timestamps older than the window
        restarts = restarts.filter(timestamp => now - timestamp < RESTART_WINDOW);
        restarts.push(now);
        restartCounts.set(worker.pid, restarts);

        console.log(`Worker ${worker.pid} restarts in last ${RESTART_WINDOW/1000}s: ${restarts.length}/${MAX_RESTARTS}`);

        if (restarts.length > MAX_RESTARTS) {
          console.error(`🚨 Worker ${worker.pid} crashed ${restarts.length} times in ${RESTART_WINDOW/1000}s. Exiting server to prevent infinite loop.`);
          process.exit(1); // Critical safety stop
        }

        // Wait before restarting
        console.log(`Restarting worker in ${RESTART_DELAY/1000}s...`);
        setTimeout(async () => {
          try {
            const newWorker = await createSingleWorker(true);
            workers.push(newWorker);
            console.log(`✅ Worker restarted successfully. New PID: ${newWorker.pid}`);
          } catch (err) {
            console.error('❌ Failed to restart worker:', err.message);
            
            // Only exit if we have no workers left
            if (workers.length === 0) {
              console.error('💀 No workers remaining. Exiting process.');
              process.exit(1);
            }
          }
        }, RESTART_DELAY);
      });

      return worker;

    } catch (error) {
      console.error('Failed to create worker:', error.message);
      throw error;
    }
  };

  // Create all workers at startup
  console.log(`Creating ${totalThreads} workers...`);
  
  for (let i = 0; i < totalThreads; i++) {
    try {
      const worker = await createSingleWorker();
      workers.push(worker);
      console.log(`Worker ${i+1}/${totalThreads} created (PID: ${worker.pid})`);
    } catch (error) {
      console.error(`Failed to create worker ${i+1}:`, error.message);
      // Continue with partial pool if some workers fail
    }
  }

  console.log(`✅ All ${workers.length}/${totalThreads} workers created successfully`);
  return workers;
};

export default createWorkers;

*/