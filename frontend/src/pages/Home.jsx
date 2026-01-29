import { useState, useContext } from 'react'
import withAuth from '../utils/withAuth';
import { IconButton, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestoreIcon from '@mui/icons-material/Restore';
import mobileCall from '../assets/homeCall.png';
import videoIcon from '../assets/video.png';
import AuthContext from '../contexts/AuthContext';
import "../styles/Home.css";

const Home = () => {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode]  = useState("");
  const {addToUserHistory} = useContext(AuthContext);
  let handleJoinVideoCall = async() =>{
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  }

  return (
    <div className="homeBg">
      <div className="navBar">
        <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
          <img className='logoMark' src={videoIcon} alt="PeerCall logo" />
          <h2 style={{margin: 0}}>Peer<span style={{color: "#2563eb"}}>Call</span></h2>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto"}}>
          <IconButton onClick={()=>{
            navigate('/history');
          }} size="small" style={{background: "#f3f4f6"}}>
            <RestoreIcon/> <span style={{fontSize: "1rem", color: "#555", paddingLeft: "5px"}}>History</span>
          </IconButton>
        
          <Button 
            size="small"
            variant="outlined"
            style={{borderRadius: 20, color: "#2563eb", borderColor: "#2563eb"}}
            onClick={()=>{
              const prompt = confirm("Are you sure you want to logout ?");
              if(prompt){
                localStorage.removeItem("token");
                navigate("/auth");
              }
            }}>
            Logout
          </Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div className="meetCard">
            <h2 style={{marginBottom: 16, fontWeight: 600, color: "#2563eb"}}>Quality Video Calls</h2>
            <p style={{marginBottom: 24, color: "#555"}}>Connect instantly with a meeting code. Simple, secure, and fast.</p>
            <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
              <TextField 
                onChange={e=>setMeetingCode(e.target.value)}
                placeholder="Enter meeting code"
                size="small"
                style={{background: "#fff", borderRadius: 8}}
              />
              <Button 
                onClick={handleJoinVideoCall} 
                variant='contained'
                style={{borderRadius: 20, background: "#2563eb"}}
              >
                Join
              </Button>
            </div>
          </div>
        </div>

        <div className='rightPanel'>
          <img src={mobileCall} alt="mobile call"/>
        </div>
      </div>
    </div>
  )
}


export default withAuth(Home);
