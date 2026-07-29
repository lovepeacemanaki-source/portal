import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiGet } from '../config.js'

export default function VideoList() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const team = localStorage.getItem('lp_team')
  const member = localStorage.getItem('lp_member')

  useEffect(() => {
    if (!team || !member) {
      navigate('/')
      return
    }
    apiGet('getVideos', { team }).then((res) => {
      setVideos(res.videos || [])
      setLoading(false)
    })
  }, [team, member, navigate])

  function handleLogout() {
    localStorage.removeItem('lp_team')
    localStorage.removeItem('lp_member')
    navigate('/')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>動画一覧</h1>
          <div className="team-tag">{team} ・ {member} さん</div>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      {loading && <p className="team-tag">読み込み中…</p>}

      {!loading && videos.length === 0 && (
        <div className="empty-state">まだ動画が投稿されていません</div>
      )}

      {!loading && videos.length > 0 && (
        <div className="video-grid">
          {videos.map((v) => (
            <Link
              key={v.videoID}
              to={`/videos/${v.videoID}`}
              state={{ video: v }}
              className="video-card"
            >
              <p className="video-card-title">{v.title}</p>
              <p className="video-card-date">{formatDate(v.postedDate)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}
