class Client {
    constructor(userName, socket) {
        this.userName = userName
        this.socket = socket

        // instead of calling this producter trasport, call it upSteamTransport
        // this client trasport for snigaling data;
        this.upsteamTrasport = null
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
};
 
module.exports = Client;