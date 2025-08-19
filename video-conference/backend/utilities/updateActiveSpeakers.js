const updateActiveSpeakers = (room, io) => {
    // this function is called on newDominentSpeaker, or a new peer producers
    // mutes existing consumers/producer if below 5, for all peers in room upmutes existing consumers/producer if in top 5,
    // for all peers in room return new transports by peer
    // called by either activeSpeakerObserver(newDominantSpeaker)  or startProducing


    const activeSpeakers = room.activeSpeakerList.slice(0, 5);
    const mutedSpeakers = room.activeSpeakerList.slice(5);
    const newtransportsByPeer = {};

    // loop through all connected clients in the room
    room.clients.array.forEach(client => {
        // loop through all clients to mute
        mutedSpeakers.forEach(pid => {

            // pid is the producer id we want to mure

            if (client?.producer?.audio?.id === pid) {
                // this client is the producer, mute the producer
                client?.producer?.audio.pause();
                client?.producer?.video.pause();

                return;
            };

            const downstreamToStop = client.downstreamTrasports.find(t => {
                return t?.audio?.producerId === pid;
            });

            if (downstreamToStop) {
                //found the audio, mute both
                downstreamToStop.audio.pause();
                downstreamToStop.video.pause();
            } // no else. do nothing if no match

        });
    });

};

module.exports = updateActiveSpeakers;