const socket = io('http://localhost:8000');

const configs = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

let peerConnection = null;

const constraints = {
    video: { facingMode: "user" },
    audio: true
};
const localVideo = document.querySelector('#local_video');
const receivedVideo = document.querySelector('#received_video');
const callButton = document.querySelector('#call');
const acceptButton = document.querySelector('#answer');
const startButton = document.querySelector('#start');
const input = document.querySelector('#id');
const inputTo = document.querySelector('#toid');

// starting

startButton.addEventListener('click', () => {
    socket.on('offer', answerHandler);
});


// inviting

callButton.addEventListener('click', async () => {

    try {
        localVideo.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
        console.log(e);
        console.log('cannot get media!');
    }

    const peerConnection = new RTCPeerConnection(configs);

    let stream = localVideo.srcObject;
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
        console.log(track);
    });

    peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    // a "candidate" will be automatically sent (after setLocalDescription get finished)
    // to remote peer for geting remote candidate
    .then(() => {
        socket.emit('offer', {
            id: inputTo.value, 
            description: peerConnection.localDescription
        });
    });

    socket.on('answer', ({id, description}) => {
        peerConnection.setRemoteDescription(description);
    });
    
    
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("candidate", {id, candidate: event.candidate});
        }
    };
});


// answering

const answerHandler = ({id, description}) => {
    
    peerConnection = new RTCPeerConnection(configs);

    peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit('answer', {id, description: peerConnection.localDescription});
    });


    console.log('answering 5...');
    peerConnection.ontrack = event => {
        console.log(event);
        if (event.streams && event.streams[0]) {
            console.log('ok');
            receivedVideo.srcObject = event.streams[0];
            receivedVideo.muted = false;
        }
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("candidate", {id, candidate: event.candidate});
        }
    };

    socket.on("candidate", ({id, candidate}) => {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(e => console.error(e));
    });
    
};


