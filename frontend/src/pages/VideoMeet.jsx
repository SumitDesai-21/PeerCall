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

  const getPermissions = async () =>{
    try { 
      // video permission
      const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});
      if(videoPermission) setVideoAvailable(true);
      else setVideoAvailable(false);

      // audio permission
      const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});
      if(audioPermission) setAudioAvailable(true);
      else setAudioAvailable(false)


      // screen sharing but no need of permission 
      const screenSharing = navigator.mediaDevices.getDisplayMedia;
      if(screenSharing){
        setScreenAvailable(true);
      }
      else setScreenAvailable(false);


      if(videoAvailable || audioAvailable){
        const userMediaStream =  await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable});

        if(userMediaStream){
          window.localStream = userMediaStream; // if available then show on local computer
          if(localVideoRef.current){
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
  let getUserMediaSuccess = (stream)=>{

  }

  // getUserMedia
  let getUserMedia = () =>{
    if((video && videoAvailable) || (audio && audioAvailable)){
      navigator.mediaDevices.getUserMedia({ video, audio})
      .then(getUserMediaSuccess()) // Todo: getUserMediaSuccess
      .then((stream) => {})
      .catch((e)=>console.log(e));
    }
    else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track)=> track.stop())
      } catch (error) {
        
      }
    }
  }


  useEffect(()=>{
    if(video && audio){
      getUserMedia();
    }
  }, [audio, video]);   

  // TODO
  let gotMessageFromServer = (fromId, message) =>{

  }

  // TODO addMessage 
  let addMessage = () =>{

  }

  let connectToSocketServer = () =>{
    const token = localStorage.getItem("token");
    socketRef.current = io(server_url, {
      secure: false,
      auth: {
        token,
      },
    });
    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('connect', ()=>{
      socketRef.current.emit('join-call', window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on('chat-message', addMessage);
      socketRef.current.on('user-left', (id)=>{
        setVideos((videos)=> videos.filter((video)=>video.socketId !== id));
      })

      socketRef.current.on('user-joined', (id, clients)=>{
        
      })
    })
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect_error:', err?.message || err);
    });
  }

  let getMedia = () =>{
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer(); // connect to socket server 
  }

  // connection logic
  let connect = () =>{
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
      </div> : <></>
      
      }
    </div>
  )
}

export default VideoMeet
