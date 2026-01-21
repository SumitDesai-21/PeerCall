import React from 'react';
import '../styles/Home.css';
import mobileImg from '../assets/mobilecall.png';
import videoIcon from '../assets/video.png';
import { Link, useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <img className='logoMark' src={videoIcon} alt="PeerCall logo" />
          <h2>Peer<span>Call</span></h2>
        </div>
        <div className='navlist'>
          <span className="navLink">Join As Guest</span>
          <button onClick={() => navigate('/auth')} className='loginBtn'>Login</button>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div className="heroContent">
          <h1 className='heroTitle'>
            Video calls for <br />
            <span className='accent'>everyone, everywhere.</span>
          </h1>
          <p className='heroSubtitle'>
            Experience clear video quality and seamless connection. 
            Bridging the gap between you and your loved ones, one call at a time.
          </p>
          <div className="ctaGroup">
            <Link className='btn' to={'/auth'}>Get Started</Link>
          </div>
        </div>
        <div className="heroImage">
          <img src={mobileImg} alt="Mobile preview" />
        </div>
      </div>
    </div> 
  );
}

export default Landing;