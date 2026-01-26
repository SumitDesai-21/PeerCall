import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// MUI Icons
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import SendIcon from '@mui/icons-material/Send'
import CloseIcon from '@mui/icons-material/Close'
import defaultAvatar from '../assets/image.png'
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
  const navigate = useNavigate();
  const socketRef = useRef();
  let socketIdRef = useRef(); // we'll use in chat function

  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState(localStorage.getItem("name") || "");
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
    // cleanup function when user leaves the call

    return () => {
      if (socketRef.current) {
        socketRef.current.off('signal', gotMessageFromServer);
        socketRef.current.off('chat-message', addMessage);
        socketRef.current.off('user-left');
        socketRef.current.off('user-joined');
        socketRef.current.off('video-state');
        socketRef.current.disconnect();
      }
      // Stop all media tracks
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
      // Close all peer connections
      for (let key in connections) {
        connections[key].close();
      }
      connections = {}; // Reset global object (See point B)
    };
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

      if (window.localStream) {
        connections[id].addStream(window.localStream);
      }


      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
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
    if (screen) {
      if (window.localStream) {
        window.localStream.getAudioTracks().forEach(track => {
          track.enabled = audio;
        });
      }
      return;
    }

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
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      // Emit video state to other users
      if (socketRef.current) {
        socketRef.current.emit('video-state', video);
      }
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
                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
              }).catch(e => console.log(e));
            }).catch(e => console.log(e));
          }
        }).catch(e => console.log(e));
      }
      if (signal.ice) {
        // add ICE candidate iff remote description is set
        if (connections[fromId] && connections[fromId].remoteDescription) {
          connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
        }
      }
    }
  }

  // TODO addMessage 
  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages, { sender: sender, data: data }
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
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

      socketRef.current.on('video-state', (id, videoState) => {
        setVideos((videos) => videos.map((v) =>
          v.socketId === id ? { ...v, videoOn: videoState } : v
        ));
      });

      socketRef.current.on('user-joined', (id, clients) => {
        if (!clients) return;
        clients.forEach((socketListId) => {
          if (connections[socketListId]) return; // Skip if already connected
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
              setVideos(videos => {
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
                playsinline: true,
                videoOn: true
              }

              setVideos(videos => {
                const updatedVideos = [...videos, newVideo];
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

            if (window.localStream) {
              try {
                connections[id2].addStream(window.localStream);
              } catch (error) { }
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


  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.log(error);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      if (window.localStream) {
        connections[id].addStream(window.localStream);
      }

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
          }).catch(e => console.log(e));
      }).catch(e => console.log(e));
    }


    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false);

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

      getUserMedia();
    })
  }

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => { })
          .catch(e => console.log(e));
      }
    } else {
      // Stop screen sharing and switch back to camera
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (error) {
        console.log(error);
      }

      // Switch back to camera/mic
      if ((video && videoAvailable) || (audio && audioAvailable)) {
        navigator.mediaDevices.getUserMedia({ video, audio })
          .then(getUserMediaSuccess)
          .catch(e => console.log(e));
      } else {
        let blackSilence = (...args) => new MediaStream([blackScreen(...args), silence()]);
        window.localStream = blackSilence();
        localVideoRef.current.srcObject = window.localStream;
      }
    }
  }

  let sendMessage = () => {
    socketRef.current.emit('chat-message', window.location.href, message, username);
    setMessage("");
  }

  // handle end call here
  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    } catch (error) {

    }
    navigate('/home');
  }


  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen])

  // video & audio calls through getUserMedia()
  return (
    <div>
      {askForUsername ? (
        <div className="lobbyContainer">
          <div className="lobbyCard">
            <h1 className="lobbyTitle">Join Meeting</h1>
            <p className="lobbySubtitle">Enter your name to get started</p>

            <div className="lobbyVideoPreview">
              <video ref={localVideoRef} autoPlay muted></video>
            </div>

            <div className="lobbyForm">
              <input
                type="text"
                className="lobbyInput"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                className="joinButton"
                onClick={connect}
                disabled={!username.trim()}
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      ) : (
        // meeting screen
        <div className="meetingContainer">

          {/* Chat Panel */}
          {showModal && (
            <div className="chatPanel">
              <div className="chatHeader">
                <h3>Chat</h3>
                <button className="closeButton" onClick={() => setModal(false)}>
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              <div className="chatMessages">
                {messages.length !== 0 ? (
                  messages.map((item, index) => (
                    <div key={index} className="messageItem">
                      <p className="messageSender">{item.sender}</p>
                      <p className="messageText">{item.data}</p>
                    </div>
                  ))
                ) : (
                  <p className="noMessages">No messages yet</p>
                )}
              </div>

              <div className="chatInputArea">
                <input
                  type="text"
                  className="chatInput"
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  className="sendButton"
                  onClick={sendMessage}
                  disabled={!message.trim()}
                >
                  <SendIcon fontSize="small" />
                </button>
              </div>
            </div>
          )}

          {/* Control Bar */}
          <div className="controlBar">
            <button
              className={`controlButton ${video ? 'active' : 'inactive'}`}
              onClick={() => setVideo(!video)}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </button>

            <button className="controlButton endCall" onClick={handleEndCall}>
              <CallEndIcon />
            </button>

            <button
              className={`controlButton ${audio ? 'active' : 'inactive'}`}
              onClick={() => setAudio(!audio)}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </button>

            {screenAvailable && (
              <button
                className={`controlButton ${screen ? 'featureActive' : 'feature'}`}
                onClick={() => setScreen(!screen)}
              >
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </button>
            )}

            <div className="badgeWrapper">
              <button
                className={`controlButton ${showModal ? 'featureActive' : 'feature'}`}
                onClick={() => {
                  setModal(!showModal);
                  setNewMessages(0);
                }}
              >
                <ChatIcon />
              </button>
              {newMessages > 0 && <span className="badge">{newMessages}</span>}
            </div>
          </div>

          {/* Local Video Preview */}
          <div className="localVideo">
            {!video && (
              <div className="avatarPlaceholder">
                <img src={defaultAvatar} alt="User" className="avatarImage" />
              </div>
            )}
            <video ref={localVideoRef} autoPlay muted style={{ display: video ? 'block' : 'none' }}></video>
          </div>

          {/* Grid of Remote Videos */}
          <div className="videosGrid">
            {videos.map((video) => (
              <div key={video.socketId} className="remoteVideoCard">
                {!video.videoOn && (
                  <div className="avatarPlaceholder">
                    {/* Replaced PersonIcon with img */}
                    <img src={defaultAvatar} alt="Remote User" className="avatarImage" />
                  </div>
                )}
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream && ref.srcObject !== video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  style={{ display: video.videoOn ? 'block' : 'none' }}
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeet
