import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Landing from './pages/Landing'
import Authentication from './pages/Authentication'
import VideoMeet from './pages/VideoMeet'
import Home from './pages/Home'
import { AuthProvider } from './contexts/AuthContext'
import History from './pages/History'

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
            <Route path='/history' element={<History/>}></Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
