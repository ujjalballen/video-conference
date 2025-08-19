const updateActiveSpeakers = (room, io) => {
    // this function is called on newDominentSpeaker, or a new peer producers
    // mutes existing consumers/producer if below 5, for all peers in room upmutes existing consumers/producer if in top 5,
    // for all peers in room return new transports by peer
    // called by either activeSpeakerObserver(newDominantSpeaker)  or startProducing


    const activeSpeakers = room.activeSpeakerList.slice(0, 5);
    const mutedSpeakers = room.activeSpeakerList.slice(5);
    const newtransportsByPeer = {};

    // loop through all connected clients in the room
    room.clients.forEach(client => {
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



        // store all the pid's this client is not yet consuming
        const newSpeakersToThisClient = [];

        activeSpeakers.forEach((pid) => {
            if (client?.producer?.audio?.id === pid) {
                // this client is the producer, resume the producer
                client?.producer?.audio.resume();
                client?.producer?.video.resume();

                return;
            };

            // can grab pid from the audio.producerId like above, or use our own associatedAudioPid
            const downstreamToStart = client.downstreamTrasports.find(t => {
                return t?.associatedAudioPid === pid
            });

            if (downstreamToStart) {
                // we have a match. just resume;
                downstreamToStart?.audio.resume();
                downstreamToStart?.video.resume();
            } else {
                // this client is not consuming... start the process
                newSpeakersToThisClient.push(pid);

            }
        });


        if (newSpeakersToThisClient.length) {
            // this client has at least 1 new consumer/transport to make
            // at socket.id key, put the array of newspeakers to make
            // if there were no newSpeakers, then there will be no key for that client

            newtransportsByPeer[client.socket.id] = newSpeakersToThisClient;

        };
    });

    // client loop is done. we have muted or unmuted all producers/consumers
    // based on the new activeSpeakerList. now, send out the consumers that need to be made

    io.to(room.roomName).emit('updateActiveSpeakers', activeSpeakers);

    return newtransportsByPeer;

};

module.exports = updateActiveSpeakers;