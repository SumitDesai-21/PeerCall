import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client';
import '../styles/VideoComponent.css';
// define URL server
const server_url = "http://localhost:8080"; // backend server
var connections = {};

// used stun server from public STUN server list
const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
}

// Video component
const VideoMeet = () => {
  const socketRef = useRef();
  let socketIdRef = useRef(); // we'll use in chat function

  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState();
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState();
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState();
  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // WebRTC works on chromium based browser mostly all browsers are chromium based.
  // TODO
  // if(!isChrome()) 

  const getPermissions = async () => {
    try {
      // video permission
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) setVideoAvailable(true);
      else setVideoAvailable(false);

      // audio permission
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) setAudioAvailable(true);
      else setAudioAvailable(false)


      // screen sharing but no need of permission 
      const screenSharing = navigator.mediaDevices.getDisplayMedia;
      if (screenSharing) {
        setScreenAvailable(true);
      }
      else setScreenAvailable(false);


      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });

        if (userMediaStream) {
          window.localStream = userMediaStream; // if available then show on local computer
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getPermissions(); // audio, video permissions
  }, []);

  // get user media success
  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream)
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
        }).catch(e => console.log(e));
      }).catch(e => console.log(e));
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (error) {
        console.log(e);
      }

      // TODO BlackSilence
      let blackSilence = (...args) => new MediaStream([blackScreen(...args), silence()]);
      window.localStream = blackSilence;
      localVideoRef.current.srcObject = window.localStream;



      for (let id in connections) {
        connections[id].addStream(window.localStream)
        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description).then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ "sdp": connections[id].localDescription }));
          }).catch(e => console.log(e));
        })
      }
    })
  }

  let silence = () => {
    let context = new AudioContext();
    let oscillator = context.createOscillator();

    let destination = oscillator.connect(context.createMediaStreamDestination());
    oscillator.start();
    context.resume();
    return Object.assign(destination.stream.getAudioTracks()[0], { enabled: false });
  }

  let blackScreen = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();

    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  }

  // getUserMedia
  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video, audio })
        .then(getUserMediaSuccess) // Todo: getUserMediaSuccess
        .then((stream) => { })
        .catch((e) => console.log(e));
    }
    else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop())
      } catch (error) {

      }
    }
  }


  useEffect(() => {
    if (video && audio) {
      getUserMedia();
    }
  }, [audio, video]);

  // important function 
  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketIdRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
              }).catch(e => console.log(e));
            }).catch(e => console.log(e));
          }
        }).catch(e => console.log(e));
      }
      if (signal.ice) {
        // interactive connectivity establishment
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
      }
    }
  }

  // TODO addMessage 
  let addMessage = () => {

  }

  let connectToSocketServer = () => {
    const token = localStorage.getItem("token");
    socketRef.current = io(server_url, {
      secure: false,
      auth: {
        token,
      },
    });
    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on('chat-message', addMessage);
      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      })

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {
          // Creating our Peer Connection here
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
            }
          }
          connections[socketListId].onaddstream = (event) => {
            // check if video exists
            let videoExists = videoRef.current.find(video => video.socketId === socketListId);

            if (videoExists) {
              setVideo(videos => {
                const updatedVideos = videos.map(video =>
                  video.socketId === socketListId ? { ...video, stream: event.stream } : video
                )
                videoRef.current = updatedVideos;
                return updatedVideos
              })
            }
            else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true,
                playsinline: true
              }

              setVideos(videos => {
                const updatedVideos = [...video, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              })
            };

            if (window.localStream !== undefined && window.localStream !== null) {
              connections[socketListId].addStream(window.localStream);
            }
            else {
              // Todo black silence 
              let blackSilence = (...args) => new MediaStream([blackScreen(...args), silence()]);
              window.localStream = blackSilence;
              connections[socketListId].addStream(Window.localStream);
            }
          }
        })


        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (error) {

            }

            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
                })
                .catch(e => console.log(e));
            })
          }
        }
      })
    })
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect_error:', err?.message || err);
    });
  }

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer(); // connect to socket server 
  }

  // connection logic
  let connect = () => {
    setAskForUsername(false);
    getMedia();
  }

  // video & audio calls through getUserMedia()
  return (
    <div>
      {askForUsername ?
        <div>
          <h2>Enter into lobby</h2>
          <br />
          <textarea name="username" id="" value={username}></textarea>
          <button className='btn' onClick={connect}>Connect</button>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div> : <>
          <video ref={localVideoRef} autoPlay muted></video>
          
          {videos.map((video)=>(
            <div key={video.socketId}>
              
            </div>
          ))}
        </>

      }
    </div>
  )
}

export default VideoMeet
