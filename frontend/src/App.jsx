import React from 'react'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Landing from './pages/Landing'
import Authentication from './pages/Authentication'
import { AuthProvider } from './contexts/AuthContext'
import VideoMeet from './pages/VideoMeet'
import Home from './pages/Home'

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<Landing />}></Route>
            <Route path='/auth' element={<Authentication />}></Route>
            <Route path='/home' element={<Home/>}></Route>
            <Route path='/:url' element={<VideoMeet/>}></Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
    </div>
  )
}

export default App
