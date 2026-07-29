import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../config.js'

export default function VideoList() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const team = localStorage.getItem('lp_team')
  const member = localStorage.getItem('lp_member')

  const [expandedId, setExpandedId] = useState(null)
  const [feedbackByVideo, setFeedbackByVideo] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [feedbackError, setFeedbackError] = useState('')
  const rowRefs = useRef({})

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

  useEffect(() => {
    if (expandedId && rowRefs.current[expandedId]) {
      // レイアウトの再計算(閉じたカード分のズレ)が終わるのを待ってからスクロール
      requestAnimationFrame(() => {
        rowRefs.current[expandedId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [expandedId])

  function toggleExpand(video) {
    if (expandedId === video.videoID) {
      setExpandedId(null)
      return
    }
    setExpandedId(video.videoID)
    setFeedbackError('')
    if (!feedbackByVideo[video.videoID]) {
      loadFeedback(video.videoID)
    }
  }

  function loadFeedback(videoID) {
    apiGet('getFeedback', { videoID }).then((res) => {
      setFeedbackByVideo((prev) => ({ ...prev, [videoID]: res.feedback || [] }))
    })
  }

  async function handleSubmitFeedback(videoID) {
    const comment = (commentDrafts[videoID] || '').trim()
    if (!comment) return
    setSubmittingId(videoID)
    setFeedbackError('')
    try {
      await apiPost('postFeedback', { videoID, name: member, comment })
      setCommentDrafts((prev) => ({ ...prev, [videoID]: '' }))
      loadFeedback(videoID)
    } catch {
      setFeedbackError('送信に失敗しました。時間をおいて再度お試しください')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="page">
      <div style={{ textAlign: 'center', marginTop: '-2.5rem', marginBottom: '1.5rem' }}>
        <img
          src="/login-logo.png"
          alt="LOVE AND PEACE"
          style={{ width: '200px', height: '200px', objectFit: 'contain' }}
        />
      </div>

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
        <div className="video-list-vertical">
          {videos.map((v) => {
            const isOpen = expandedId === v.videoID
            const embedUrl = isOpen ? toEmbedUrl(v.url) : null
            const feedback = feedbackByVideo[v.videoID] || []

            return (
              <div
                key={v.videoID}
                ref={(el) => {
                  rowRefs.current[v.videoID] = el
                }}
                className="video-row"
              >
                <button
                  type="button"
                  className="video-row-header"
                  onClick={() => toggleExpand(v)}
                >
                  <span className="video-row-title">{v.title}</span>
                  <span className="video-row-date">{formatDate(v.postedDate)}</span>
                </button>

                {isOpen && (
                  <div className="video-row-expanded">
                    {v.description && <p className="video-row-desc">{v.description}</p>}

                    {embedUrl && (
                      <div className="video-frame-wrap">
                        <iframe
                          src={embedUrl}
                          title={v.title}
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
                            <div className="feedback-item-name">
                              {f.name}
                              <span className="feedback-item-date">
                                {formatDate(f.postedAt)}
                              </span>
                            </div>
                            <div className="feedback-item-text">{f.comment}</div>
                          </div>
                        ))}
                      </div>

                      <div className="feedback-form">
                        <p className="feedback-poster">投稿者: {member}</p>
                        <textarea
                          value={commentDrafts[v.videoID] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [v.videoID]: e.target.value,
                            }))
                          }
                          placeholder="感想やコメントを書いてください"
                        />
                        {feedbackError && <p className="error-text">{feedbackError}</p>}
                        <button
                          className="btn-primary"
                          type="button"
                          disabled={submittingId === v.videoID}
                          onClick={() => handleSubmitFeedback(v.videoID)}
                        >
                          {submittingId === v.videoID ? '送信中…' : '投稿する'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
