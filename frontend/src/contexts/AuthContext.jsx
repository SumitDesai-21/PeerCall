// setting up context API & creating auth flow
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import httpStatus from 'http-status';
import axios from "axios";

const AuthContext = createContext({});

const API_BASE_URL =
    (import.meta.env.VITE_BASE_URL || "http://localhost:8080/api/users").replace(/\/+$/, "");

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
})
export default AuthContext;

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const router = useNavigate();

    const handleRegister = async (name, email, password) => {
        try {
            let request = await client.post('/register', {
                name: name,
                email: email,
                password: password
            })

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (error) {
            throw error;
        }
    }

    // handle login here
    const handleLogin = async (email, password) => {
        try {
            localStorage.removeItem("token");
            let request = await client.post('/login', {
                email: email,
                password: password
            })

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (error) {
            throw error;
        }
    }

    // get history of users 
    const getHistoryOfUser = async () => {
        try {
            let request = await client.get('/get_all_activity', {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data;
        } catch (error) {
            throw error;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (error) {
            throw error;
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        setUserData(null);
        router("/auth");
    };

    const data = {
        userData, setUserData, handleRegister, getHistoryOfUser, addToUserHistory, handleLogin, logout
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}
