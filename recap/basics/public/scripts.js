
let socket = null;
let device = null;


const initConnect = () => {
    
    socket = io('https://localhost:3000/');
    connectButton.innerHTML = 'connecting...'
    connectButton.disabled = true;


    // keep the socket listener in there own place;
    addSocketListener()

    console.log('connected..')
}


const deviceSetup = async() => {
    // console.log(mediasoupClient)
    // we don't need to pass anything on the device, the browser will handle automatically
     device = new mediasoupClient.Device();


}


function addSocketListener(){
    socket.on('connect', () => {

        connectButton.innerHTML = 'Connected'
        deviceButton.disabled = false;
    })
}