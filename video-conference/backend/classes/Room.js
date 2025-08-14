const config = require('../config/config');
const newDominantSpeaker = require('../utilities/newDominantSpeaker');
//Rooms are not a mediaSoup thing, MS cares about mediastreams, transports things,
// like that it doesn't care, or know, about rooms.
// rooms can be inside of clients, clients inside of rooms,
// transports can belong to rooms or clients etc

class Room {
    constructor(roomName, workerToUse) {
        this.roomName = roomName
        this.worker = workerToUse
        this.router = null
        // all the client objects that are in this room
        this.clients = []

        // an array of id's with the most recent dominant speaker first
        this.activeSpeakerList = []
    
    };

    addClient(client) {
        this.clients.push(client)
    };

    createRouter(io) {
        return new Promise(async (resolve, reject) => {
            this.router = await this.worker.createRouter({
                mediaCodecs: config.routerMediaCodecs
            });

            this.activeSpeakerObserver = await this.router.createActiveSpeakerObserver({
                interval: 300
            });


            // ds mean dominantSpeaker
            this.activeSpeakerObserver.on('dominantspeaker', ds => newDominantSpeaker(ds, this, io))

            resolve();

        });
    };

};

module.exports = Room;



/* 
NEED TO KNOW
==============

this.activeSpeakerObserver where it comes from


*/