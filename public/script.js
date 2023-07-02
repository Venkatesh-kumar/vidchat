const socket = io("/");

/*Some Styling*/
const videoGrid = document.getElementById("video-grid");
const videoGrid1 = document.getElementById("video-grid1");
const myVideo = document.createElement("video");

const otherVideo = document.createElement("video");
const mediaSource = new MediaSource();

videoGrid1.append(otherVideo)

myVideo.muted = true;

// let random = Math.round(Math.random())
// let user
// if(random == 1)
// {
//   user = 'male'
// }
// else
// {
//   user = 'female'
// }
const user = prompt("Enter your gender 'male' or 'female'");

/*Peer Configuration*/
var peer = new Peer({
  host: '127.0.0.1',
  port: 3000,
  path: '/peerjs',
  config: {
    'iceServers': [
      { url: 'stun:stun01.sipphone.com' },
      { url: 'stun:stun.ekiga.net' },
      { url: 'stun:stunserver.org' },
      { url: 'stun:stun.softjoys.com' },
      { url: 'stun:stun.voiparound.com' },
      { url: 'stun:stun.voipbuster.com' },
      { url: 'stun:stun.voipstunt.com' },
      { url: 'stun:stun.voxgratia.org' },
      { url: 'stun:stun.xten.com' },
      {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
      {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      }
    ]
  },

  debug: 3
});
/*Peer Configuration*/

let myVideoStream;

//Collecting user audio and video
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => { //If video and audio access granted
    myVideoStream = stream;
    addVideoStream(myVideo, stream); //Show video in display

    //Joining the call and adding video stream to the call
    peer.on("call", (call) => {
      console.log('someone call me');
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream1(video, userVideoStream);
      });
    });

    //Joined call successfully
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log('I call someone' + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream1(video, userVideoStream);
  });

};

//calling another user
peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", id,user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};
const addVideoStream1 = (video, stream) => {
  otherVideo.srcObject = stream
  otherVideo.addEventListener("loadedmetadata", () => {
    otherVideo.play();
  });
};
const removeVideoStream1 = () =>{
  otherVideo.pause()
  otherVideo.removeAttribute('srcObject')
  // otherVideo.load()
}


let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");


inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
    }</span> </b>
        <span>${message}</span>
    </div>`;
});

socket.on("lost",()=>{
  removeVideoStream1()
})
