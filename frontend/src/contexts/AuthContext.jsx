// setting up context API & creating auth flow

import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import httpStatus from 'http-status';
import axios from "axios";

const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:8080/api/users"
})
export default AuthContext;

export const AuthProvider = ({ children }) =>{
    const [userData, setUserData] = useState(null);
    const router = useNavigate();
    
    const handleRegister = async (name, email, password) =>{
        try {
            let request = await client.post('/register', {
                name: name,
                email: email,
                password: password
            })

            if(request.status === httpStatus.CREATED){
                return request.data.message;
            }
        } catch (error) {
            throw error;
        }
    }

    // handle login here
    const handleLogin = async (email, password) =>{
        try {
            let request = await client.post('/login', {
                email: email,
                password: password
            })

            if(request.status === httpStatus.OK){
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (error) {
            throw error;
        }
    }

    const data = {
        userData, setUserData, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}
