import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../contexts/AuthContext';
import videoIcon from '../assets/video.png';
import './Authentication.css';

export default function Authentication() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    
    const { handleRegister, handleLogin } = useContext(AuthContext);
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (isSignUp) {
                const result = await handleRegister(formData.name, formData.email, formData.password);
                toast.success(result);
                resetForm();
                setIsSignUp(false);
            } else {
                await handleLogin(formData.email, formData.password);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="authPageContainer">
            <nav className="authNav">
                <Link to="/" className='navHeader'>
                    <img className='logoMark' src={videoIcon} alt="PeerCall logo" />
                    <h2>Peer<span>Call</span></h2>
                </Link>
            </nav>

            <div className="authContainer">
                <div className="authCard">
                    <div className="authHeader">
                        <h1>Welcome {isSignUp ? 'to PeerCall' : 'back'}</h1>
                        <p>{isSignUp ? 'Create your account to get started' : 'Sign in to continue your journey'}</p>
                    </div>

                    <div className="authTabs">
                        <button 
                            className={!isSignUp ? 'authTab active' : 'authTab'} 
                            onClick={() => { setIsSignUp(false); resetForm(); }}
                        >
                            Sign In
                        </button>
                        <button 
                            className={isSignUp ? 'authTab active' : 'authTab'} 
                            onClick={() => { setIsSignUp(true); resetForm(); }}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form className="authForm" onSubmit={handleSubmit}>
                        {isSignUp && (
                            <div className="inputGroup">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        )}

                        <div className="inputGroup">
                            <label>Email</label>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="inputGroup">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button type="submit" className="authButton">
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}