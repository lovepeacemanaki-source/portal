import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetCached, apiPost, clearApiCache } from '../config.js'
import StarField from '../components/StarField.jsx'
import SectionCard from '../components/SectionCard.jsx'
import DiaryCard from '../components/DiaryCard.jsx'

export default function VideoList() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const team = localStorage.getItem('lp_team')
  const member = localStorage.getItem('lp_member')

  const [expandedId, setExpandedId] = useState(null)
  const [feedbackByVideo, setFeedbackByVideo] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [feedbackError, setFeedbackError] = useState('')
  const [replyingId, setReplyingId] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replySubmittingId, setReplySubmittingId] = useState(null)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editDrafts, setEditDrafts] = useState({})
  const [editSubmittingId, setEditSubmittingId] = useState(null)
  const [deleteSubmittingId, setDeleteSubmittingId] = useState(null)
  const [feedbackLoadingId, setFeedbackLoadingId] = useState(null)
  const rowRefs = useRef({})

  function clearSessionAndGoLogin() {
    localStorage.removeItem('lp_team')
    localStorage.removeItem('lp_member')
    localStorage.removeItem('lp_login_at')
    localStorage.removeItem('lp_token')
    clearApiCache()
    navigate('/')
  }

  useEffect(() => {
    if (!team || !member) {
      clearSessionAndGoLogin()
      return
    }

    let cancelled = false
    setLoadError('')
    apiGetCached('getVideos', { team }, (cached) => {
      if (cancelled) return
      setVideos(cached.videos || [])
      setLoading(false)
    })
      .then((res) => {
        if (cancelled) return
        setVideos(res.videos || [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('読み込みに失敗しました。電波の良い所でもう一度お試しください')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, member, navigate, reloadKey])

  function handleRetryLoad() {
    setLoading(true)
    setReloadKey((n) => n + 1)
  }

  function handleLogout() {
    localStorage.removeItem('lp_team')
    localStorage.removeItem('lp_member')
    localStorage.removeItem('lp_login_at')
    localStorage.removeItem('lp_token')
    clearApiCache()
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
      loadFeedback(video.videoID, true)
    }
  }

  // useCache: 初めて開く時だけ、前回保存した内容を先に見せる(投稿・編集の直後は使わない)
  function loadFeedback(videoID, useCache = false) {
    setFeedbackLoadingId(videoID)
    const show = (data) => {
      setFeedbackByVideo((prev) => ({ ...prev, [videoID]: data.feedback || [] }))
      setFeedbackLoadingId((current) => (current === videoID ? null : current))
    }
    const request = useCache
      ? apiGetCached('getFeedback', { videoID }, show)
      : apiGetCached('getFeedback', { videoID }, undefined, { allowStale: false })
    request.then(show).catch(() => {
      setFeedbackLoadingId((current) => (current === videoID ? null : current))
      setFeedbackError('コメントの読み込みに失敗しました。もう一度開き直してください')
    })
  }

  async function handleSubmitFeedback(videoID) {
    const comment = (commentDrafts[videoID] || '').trim()
    if (!comment) return
    setSubmittingId(videoID)
    setFeedbackError('')
    try {
      const res = await apiPost('postFeedback', { videoID, name: member, comment })
      if (!res.success) {
        setFeedbackError('送信に失敗しました。時間をおいて再度お試しください')
        return
      }
      setCommentDrafts((prev) => ({ ...prev, [videoID]: '' }))
      loadFeedback(videoID)
    } catch {
      setFeedbackError('送信に失敗しました。時間をおいて再度お試しください')
    } finally {
      setSubmittingId(null)
    }
  }

  async function handleSubmitReply(videoID, parentId) {
    const comment = (replyDrafts[parentId] || '').trim()
    if (!comment) return
    setReplySubmittingId(parentId)
    setFeedbackError('')
    try {
      const res = await apiPost('postFeedback', { videoID, name: member, comment, replyTo: parentId })
      if (!res.success) {
        setFeedbackError('送信に失敗しました。時間をおいて再度お試しください')
        return
      }
      setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }))
      setReplyingId(null)
      loadFeedback(videoID)
    } catch {
      setFeedbackError('送信に失敗しました。時間をおいて再度お試しください')
    } finally {
      setReplySubmittingId(null)
    }
  }

  function startEditComment(item) {
    setEditingCommentId(item.feedbackID)
    setEditDrafts((prev) => ({ ...prev, [item.feedbackID]: item.comment }))
    setFeedbackError('')
  }

  function cancelEditComment() {
    setEditingCommentId(null)
  }

  async function handleSaveEditComment(videoID, feedbackID) {
    const comment = (editDrafts[feedbackID] || '').trim()
    if (!comment) return
    setEditSubmittingId(feedbackID)
    setFeedbackError('')
    try {
      const res = await apiPost('updateFeedback', { feedbackID, comment })
      if (!res.success) {
        setFeedbackError('更新に失敗しました。時間をおいて再度お試しください')
        return
      }
      setEditingCommentId(null)
      loadFeedback(videoID)
    } catch {
      setFeedbackError('更新に失敗しました。時間をおいて再度お試しください')
    } finally {
      setEditSubmittingId(null)
    }
  }

  async function handleDeleteComment(videoID, feedbackID) {
    if (!window.confirm('このコメントを削除します。よろしいですか？')) return
    setDeleteSubmittingId(feedbackID)
    setFeedbackError('')
    try {
      const res = await apiPost('deleteFeedback', { feedbackID })
      if (!res.success) {
        setFeedbackError('削除に失敗しました。時間をおいて再度お試しください')
        return
      }
      loadFeedback(videoID)
    } catch {
      setFeedbackError('削除に失敗しました。時間をおいて再度お試しください')
    } finally {
      setDeleteSubmittingId(null)
    }
  }

  return (
    <div className="page">
      <StarField withLogoStars />
      <button className="logout-link" onClick={handleLogout}>
        ログアウト
      </button>
      <div style={{ textAlign: 'center', marginTop: '-2.5rem', marginBottom: '1.5rem' }}>
        <img
          src="/login-logo.png"
          alt="LOVE AND PEACE"
          style={{ width: '200px', height: '200px', objectFit: 'contain' }}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
        <div className="team-tag">{team}</div>
        <div className="team-tag">{member} さん</div>
      </div>

      <DiaryCard team={team} member={member} />

      <SectionCard icon="video" title="動画一覧">
        {loading && <p className="team-tag">読み込み中…</p>}

        {!loading && loadError && videos.length === 0 && (
          <div className="empty-state">
            <p className="error-text">{loadError}</p>
            <button type="button" className="btn-primary" onClick={handleRetryLoad}>
              もう一度読み込む
            </button>
          </div>
        )}

        {!loading && !loadError && videos.length === 0 && (
          <div className="empty-state">まだ動画が投稿されていません</div>
        )}

        {!loading && videos.length > 0 && (
          <div className="video-list-vertical">
          {videos.map((v) => {
            const isOpen = expandedId === v.videoID
            const embedUrl = isOpen ? toEmbedUrl(v.url) : null
            const feedback = feedbackByVideo[v.videoID] || []
            const isFeedbackLoading = feedbackLoadingId === v.videoID

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
                  <span className="video-row-title-wrap">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="9.5" stroke="var(--accent-btn)" strokeWidth="1.5" />
                      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="var(--accent-btn)" />
                    </svg>
                    <span className="video-row-title">{v.title}</span>
                  </span>
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
                        {isFeedbackLoading && <p className="team-tag">読み込み中…</p>}
                        {!isFeedbackLoading && feedback.length === 0 && (
                          <p className="team-tag">まだフィードバックがありません</p>
                        )}
                        {!isFeedbackLoading &&
                          feedback
                          .filter((f) => !f.replyTo)
                          .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
                          .map((f) => {
                            const replies = feedback.filter((r) => r.replyTo === f.feedbackID)
                            const isEditingThis = editingCommentId === f.feedbackID

                            return (
                              <div key={f.feedbackID} className="feedback-item">
                                <div className="feedback-item-name">
                                  {f.name}
                                  <span className="feedback-item-date">
                                    {formatDate(f.postedAt)}
                                  </span>
                                </div>

                                {isEditingThis ? (
                                  <div className="feedback-reply-form" style={{ margin: '0.4rem 0 0' }}>
                                    <textarea
                                      value={editDrafts[f.feedbackID] || ''}
                                      onChange={(e) =>
                                        setEditDrafts((prev) => ({
                                          ...prev,
                                          [f.feedbackID]: e.target.value,
                                        }))
                                      }
                                    />
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                      <button
                                        className="btn-primary"
                                        type="button"
                                        disabled={editSubmittingId === f.feedbackID}
                                        onClick={() => handleSaveEditComment(v.videoID, f.feedbackID)}
                                      >
                                        {editSubmittingId === f.feedbackID ? '保存中…' : '保存する'}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={cancelEditComment}
                                      >
                                        キャンセル
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="feedback-item-text">{f.comment}</div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                      <button
                                        type="button"
                                        className="feedback-reply-btn"
                                        onClick={() =>
                                          setReplyingId(
                                            replyingId === f.feedbackID ? null : f.feedbackID
                                          )
                                        }
                                      >
                                        返信
                                      </button>
                                      {f.name === member && (
                                        <>
                                          <button
                                            type="button"
                                            className="feedback-reply-btn"
                                            onClick={() => startEditComment(f)}
                                          >
                                            編集
                                          </button>
                                          <button
                                            type="button"
                                            className="feedback-reply-btn"
                                            disabled={deleteSubmittingId === f.feedbackID}
                                            onClick={() => handleDeleteComment(v.videoID, f.feedbackID)}
                                          >
                                            {deleteSubmittingId === f.feedbackID ? '削除中…' : '削除'}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}

                                {replies.map((r) => {
                                  const isEditingReply = editingCommentId === r.feedbackID
                                  return (
                                    <div key={r.feedbackID} className="feedback-reply">
                                      <div className="feedback-item-name">
                                        {r.name}
                                        <span className="feedback-item-date">
                                          {formatDate(r.postedAt)}
                                        </span>
                                      </div>

                                      {isEditingReply ? (
                                        <div style={{ marginTop: '0.4rem' }}>
                                          <textarea
                                            className="field-input"
                                            style={{ minHeight: '60px', marginBottom: '0.6rem' }}
                                            value={editDrafts[r.feedbackID] || ''}
                                            onChange={(e) =>
                                              setEditDrafts((prev) => ({
                                                ...prev,
                                                [r.feedbackID]: e.target.value,
                                              }))
                                            }
                                          />
                                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                                            <button
                                              className="btn-primary"
                                              type="button"
                                              disabled={editSubmittingId === r.feedbackID}
                                              onClick={() =>
                                                handleSaveEditComment(v.videoID, r.feedbackID)
                                              }
                                            >
                                              {editSubmittingId === r.feedbackID
                                                ? '保存中…'
                                                : '保存する'}
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-ghost"
                                              onClick={cancelEditComment}
                                            >
                                              キャンセル
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="feedback-item-text">{r.comment}</div>
                                          {r.name === member && (
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                              <button
                                                type="button"
                                                className="feedback-reply-btn"
                                                onClick={() => startEditComment(r)}
                                              >
                                                編集
                                              </button>
                                              <button
                                                type="button"
                                                className="feedback-reply-btn"
                                                disabled={deleteSubmittingId === r.feedbackID}
                                                onClick={() =>
                                                  handleDeleteComment(v.videoID, r.feedbackID)
                                                }
                                              >
                                                {deleteSubmittingId === r.feedbackID
                                                  ? '削除中…'
                                                  : '削除'}
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )
                                })}

                                {replyingId === f.feedbackID && (
                                  <div className="feedback-reply-form">
                                    <textarea
                                      value={replyDrafts[f.feedbackID] || ''}
                                      onChange={(e) =>
                                        setReplyDrafts((prev) => ({
                                          ...prev,
                                          [f.feedbackID]: e.target.value,
                                        }))
                                      }
                                      placeholder={`${f.name}さんへ返信`}
                                    />
                                    <button
                                      className="btn-primary"
                                      type="button"
                                      disabled={replySubmittingId === f.feedbackID}
                                      onClick={() => handleSubmitReply(v.videoID, f.feedbackID)}
                                    >
                                      {replySubmittingId === f.feedbackID ? '送信中…' : '返信する'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
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
                          placeholder="実践した上で、分からないことがありましたら、お書きください"
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
      </SectionCard>
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
