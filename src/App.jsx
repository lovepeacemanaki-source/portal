import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.jsx'
import VideoList from './pages/VideoList.jsx'
import VideoDetail from './pages/VideoDetail.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/videos" element={<VideoList />} />
        <Route path="/videos/:videoID" element={<VideoDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}
