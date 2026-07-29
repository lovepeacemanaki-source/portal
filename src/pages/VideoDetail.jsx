import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { apiGet, apiPost } from '../config.js'

export default function VideoDetail() {
  const { videoID } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const team = localStorage.getItem('lp_team')
  const member = localStorage.getItem('lp_member')

  const [video, setVideo] = useState(location.state?.video || null)
  const [feedback, setFeedback] = useState([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!team || !member) {
      navigate('/')
      return
    }
    // ページ再読み込みなどでvideoの情報がない場合は、一覧から再取得して探す
    if (!video) {
      apiGet('getVideos', { team }).then((res) => {
        const found = (res.videos || []).find((v) => v.videoID === videoID)
        setVideo(found || null)
      })
    }
    loadFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadFeedback() {
    apiGet('getFeedback', { videoID }).then((res) => {
      setFeedback(res.feedback || [])
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await apiPost('postFeedback', { videoID, name: member, comment: comment.trim() })
      setComment('')
      loadFeedback()
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください')
    } finally {
      setSubmitting(false)
    }
  }

  const embedUrl = video ? toEmbedUrl(video.url) : null

  return (
    <div className="page">
      <Link to="/videos" className="back-link">
        ← 動画一覧に戻る
      </Link>

      {video && <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.5rem', margin: '0 0 1.2rem' }}>{video.title}</h1>}

      {embedUrl && (
        <div className="video-frame-wrap">
          <iframe
            src={embedUrl}
            title={video?.title || 'video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="feedback-section">
        <h2>フィードバック</h2>

        <div className="feedback-list">
          {feedback.length === 0 && (
            <p className="team-tag">まだフィードバックがありません</p>
          )}
          {feedback.map((f) => (
            <div key={f.feedbackID} className="feedback-item">
              <div className="feedback-item-name">{f.name}</div>
              <div className="feedback-item-text">{f.comment}</div>
            </div>
          ))}
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <p className="feedback-poster">投稿者: {member}</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="感想やコメントを書いてください"
          />
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? '送信中…' : '投稿する'}
          </button>
        </form>
      </div>
    </div>
  )
}

// YouTubeの通常URL／短縮URLを埋め込み用URLに変換する
function toEmbedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1)
    } else if (u.searchParams.get('v')) {
      id = u.searchParams.get('v')
    } else if (u.pathname.includes('/embed/')) {
      return url
    }
    if (!id) return null
    return `https://www.youtube.com/embed/${id}`
  } catch {
    return null
  }
}
