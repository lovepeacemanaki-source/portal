import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../config.js'

const ADMIN_REPLY_NAME = '吉井孝'
const SESSION_MS = 10 * 60 * 1000 // 10分でセッション切れ

function AdminCard({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="admin-card">
      <button type="button" className="admin-card-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <svg
          className={`admin-card-chevron${open ? ' is-open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="#042167"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div className="admin-card-body">{children}</div>}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => {
    const loginAt = Number(localStorage.getItem('lp_admin_login_at') || 0)
    const expired = !loginAt || Date.now() - loginAt > SESSION_MS
    if (expired) {
      localStorage.removeItem('lp_admin')
      localStorage.removeItem('lp_admin_login_at')
      return false
    }
    return localStorage.getItem('lp_admin') === 'true'
  })
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [checking, setChecking] = useState(false)

  const [teams, setTeams] = useState([])
  const [allTeamVideos, setAllTeamVideos] = useState({})
  const [selectedTeam, setSelectedTeam] = useState('')
  const [teamVideos, setTeamVideos] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const [memberTeam, setMemberTeam] = useState('')
  const [memberName, setMemberName] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [memberMessage, setMemberMessage] = useState('')
  const [memberError, setMemberError] = useState('')

  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamPassword, setNewTeamPassword] = useState('')
  const [editingTeamOriginal, setEditingTeamOriginal] = useState(null)
  const [teamSubmitting, setTeamSubmitting] = useState(false)
  const [teamMessage, setTeamMessage] = useState('')
  const [teamError, setTeamError] = useState('')

  const [fbVideoId, setFbVideoId] = useState('')
  const [fbFeedback, setFbFeedback] = useState([])
  const [fbLoading, setFbLoading] = useState(false)
  const [fbReplyingId, setFbReplyingId] = useState(null)
  const [fbReplyDrafts, setFbReplyDrafts] = useState({})
  const [fbReplySubmittingId, setFbReplySubmittingId] = useState(null)
  const [fbError, setFbError] = useState('')

  // 管理画面専用の白背景テーマをbodyに適用(ログイン後のみ)
  useEffect(() => {
    if (authed) {
      document.body.classList.add('admin-theme')
    } else {
      document.body.classList.remove('admin-theme')
    }
    return () => document.body.classList.remove('admin-theme')
  }, [authed])

  // 表示中に10分を迎えたら、その場でログイン画面に戻す
  useEffect(() => {
    if (!authed) return
    const loginAt = Number(localStorage.getItem('lp_admin_login_at') || 0)
    const remaining = SESSION_MS - (Date.now() - loginAt)
    const timer = setTimeout(() => {
      localStorage.removeItem('lp_admin')
      localStorage.removeItem('lp_admin_login_at')
      setAuthed(false)
    }, Math.max(remaining, 0))
    return () => clearTimeout(timer)
  }, [authed])

  useEffect(() => {
    if (authed) {
      apiGet('getTeams').then((res) => {
        const teamList = (res.teams || []).filter((t) => t !== '管理人')
        setTeams(teamList)
        loadAllTeamVideos(teamList)
      })
    }
  }, [authed])

  function loadAllTeamVideos(teamList) {
    Promise.all(
      teamList.map((t) =>
        apiGet('getVideos', { team: t }).then((res) => ({ team: t, videos: res.videos || [] }))
      )
    ).then((results) => {
      const map = {}
      results.forEach(({ team, videos }) => {
        map[team] = videos
      })
      setAllTeamVideos(map)
    })
  }

  useEffect(() => {
    if (selectedTeam) {
      loadTeamVideos()
    } else {
      setTeamVideos([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam])

  function loadTeamVideos() {
    apiGet('getVideos', { team: selectedTeam }).then((res) => {
      setTeamVideos(res.videos || [])
    })
  }

  useEffect(() => {
    if (memberTeam) {
      loadTeamMembers()
    } else {
      setTeamMembers([])
    }
    setEditingMemberId(null)
    setMemberName('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberTeam])

  function loadTeamMembers() {
    apiGet('getMembers', { team: memberTeam }).then((res) => {
      setTeamMembers(res.members || [])
    })
  }

  function loadFbFeedback(videoID) {
    setFbLoading(true)
    apiGet('getFeedback', { videoID }).then((res) => {
      setFbFeedback(res.feedback || [])
      setFbLoading(false)
    })
  }

  async function handleFbReply(videoID, parentId) {
    const comment = (fbReplyDrafts[parentId] || '').trim()
    if (!comment) return
    setFbReplySubmittingId(parentId)
    setFbError('')
    try {
      const res = await apiPost('postFeedback', {
        videoID,
        name: ADMIN_REPLY_NAME,
        comment,
        replyTo: parentId,
      })
      if (!res.success) {
        setFbError('送信に失敗しました。時間をおいて再度お試しください')
        return
      }
      setFbReplyDrafts((prev) => ({ ...prev, [parentId]: '' }))
      setFbReplyingId(null)
      loadFbFeedback(videoID)
    } catch {
      setFbError('送信に失敗しました。時間をおいて再度お試しください')
    } finally {
      setFbReplySubmittingId(null)
    }
  }

  function toggleFbVideo(videoID) {
    if (fbVideoId === videoID) {
      setFbVideoId('')
      setFbFeedback([])
      return
    }
    setFbVideoId(videoID)
    setFbReplyingId(null)
    loadFbFeedback(videoID)
  }

  async function handleAddTeam(e) {
    e.preventDefault()
    setTeamMessage('')
    setTeamError('')
    if (!newTeamName.trim() || !newTeamPassword.trim()) {
      setTeamError('チーム名とパスワードを入力してください')
      return
    }
    setTeamSubmitting(true)
    try {
      if (editingTeamOriginal) {
        const res = await apiPost('updateTeam', {
          originalName: editingTeamOriginal,
          teamName: newTeamName.trim(),
          password: newTeamPassword.trim(),
        })
        if (res.success) {
          setTeamMessage(`「${newTeamName.trim()}」を更新しました`)
          setEditingTeamOriginal(null)
          setNewTeamName('')
          setNewTeamPassword('')
          const teamsRes = await apiGet('getTeams')
          const teamList = (teamsRes.teams || []).filter((t) => t !== '管理人')
          setTeams(teamList)
          loadAllTeamVideos(teamList)
        } else {
          setTeamError(res.message || '更新に失敗しました')
        }
        return
      }

      const res = await apiPost('postTeam', {
        teamName: newTeamName.trim(),
        password: newTeamPassword.trim(),
      })
      if (res.success) {
        setTeamMessage(`「${newTeamName.trim()}」を追加しました`)
        setNewTeamName('')
        setNewTeamPassword('')
        const teamsRes = await apiGet('getTeams')
        const teamList = (teamsRes.teams || []).filter((t) => t !== '管理人')
        setTeams(teamList)
        loadAllTeamVideos(teamList)
      } else {
        setTeamError(res.message || '追加に失敗しました')
      }
    } catch {
      setTeamError('保存に失敗しました。時間をおいて再度お試しください')
    } finally {
      setTeamSubmitting(false)
    }
  }

  function startEditTeam(teamName) {
    setEditingTeamOriginal(teamName)
    setNewTeamName(teamName)
    setNewTeamPassword('')
    setTeamMessage('')
    setTeamError('')
  }

  function cancelEditTeam() {
    setEditingTeamOriginal(null)
    setNewTeamName('')
    setNewTeamPassword('')
    setTeamError('')
  }

  async function handleDeleteTeam() {
    if (!editingTeamOriginal) return
    if (
      !window.confirm(
        `「${editingTeamOriginal}」を削除します。このチームでログインできなくなります。よろしいですか？`
      )
    )
      return
    setTeamSubmitting(true)
    setTeamError('')
    try {
      const res = await apiPost('deleteTeam', { teamName: editingTeamOriginal })
      if (!res.success) {
        setTeamError(res.message || '削除に失敗しました')
        return
      }
      setTeamMessage(`「${editingTeamOriginal}」を削除しました`)
      cancelEditTeam()
      const teamsRes = await apiGet('getTeams')
      const teamList = (teamsRes.teams || []).filter((t) => t !== '管理人')
      setTeams(teamList)
      loadAllTeamVideos(teamList)
    } catch {
      setTeamError('削除に失敗しました。時間をおいて再度お試しください')
    } finally {
      setTeamSubmitting(false)
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    setMemberMessage('')
    setMemberError('')
    if (!memberTeam || !memberName.trim()) {
      setMemberError('チームと名前を入力してください')
      return
    }
    setMemberSubmitting(true)
    try {
      if (editingMemberId) {
        const res = await apiPost('updateMember', {
          memberID: editingMemberId,
          name: memberName.trim(),
        })
        if (!res.success) {
          setMemberError(res.message || '更新に失敗しました')
          return
        }
        setMemberMessage(`「${memberName.trim()}」に更新しました`)
        setEditingMemberId(null)
      } else {
        const res = await apiPost('postMember', { team: memberTeam, name: memberName.trim() })
        if (!res.success) {
          setMemberError(res.message || '追加に失敗しました')
          return
        }
        setMemberMessage(`「${memberName.trim()}」を${memberTeam}に追加しました`)
      }
      setMemberName('')
      loadTeamMembers()
    } catch {
      setMemberError('保存に失敗しました。時間をおいて再度お試しください')
    } finally {
      setMemberSubmitting(false)
    }
  }

  function startEditMember(member) {
    setEditingMemberId(member.memberID)
    setMemberName(member.name)
    setMemberMessage('')
    setMemberError('')
  }

  function cancelEditMember() {
    setEditingMemberId(null)
    setMemberName('')
    setMemberError('')
  }

  async function handleDeleteMember() {
    if (!editingMemberId) return
    if (!window.confirm(`「${memberName}」を削除します。よろしいですか？`)) return
    setMemberSubmitting(true)
    setMemberError('')
    try {
      const res = await apiPost('deleteMember', { memberID: editingMemberId })
      if (!res.success) {
        setMemberError(res.message || '削除に失敗しました')
        return
      }
      setMemberMessage('メンバーを削除しました')
      cancelEditMember()
      loadTeamMembers()
    } catch {
      setMemberError('削除に失敗しました。時間をおいて再度お試しください')
    } finally {
      setMemberSubmitting(false)
    }
  }

  async function handleAuth(e) {
    e.preventDefault()
    setAuthError('')
    setChecking(true)
    try {
      const res = await apiGet('login', { team: '管理人', password: password.trim() })
      if (res.success) {
        localStorage.setItem('lp_admin', 'true')
        localStorage.setItem('lp_admin_login_at', String(Date.now()))
        setAuthed(true)
      } else {
        setAuthError('パスワードが違います')
      }
    } catch {
      setAuthError('通信エラーが発生しました')
    } finally {
      setChecking(false)
    }
  }

  async function handlePostVideo(e) {
    e.preventDefault()
    setMessage('')
    setFormError('')
    if (!selectedTeam || !title.trim() || !url.trim()) {
      setFormError('すべての項目を入力してください')
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        const res = await apiPost('updateVideo', {
          videoID: editingId,
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
        })
        if (!res.success) {
          setFormError(res.message || '更新に失敗しました')
          return
        }
        setMessage(`「${title.trim()}」を更新しました`)
        setEditingId(null)
      } else {
        const res = await apiPost('postVideo', {
          team: selectedTeam,
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
        })
        if (!res.success) {
          setFormError(res.message || '追加に失敗しました')
          return
        }
        setMessage(`「${title.trim()}」を${selectedTeam}に追加しました`)
      }
      setTitle('')
      setUrl('')
      setDescription('')
      loadTeamVideos()
      loadAllTeamVideos(teams)
    } catch {
      setFormError('保存に失敗しました。時間をおいて再度お試しください')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(video) {
    setEditingId(video.videoID)
    setTitle(video.title)
    setUrl(video.url)
    setDescription(video.description || '')
    setMessage('')
    setFormError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setTitle('')
    setUrl('')
    setDescription('')
    setFormError('')
  }

  async function handleDeleteVideo() {
    if (!editingId) return
    if (!window.confirm(`「${title}」を削除します。よろしいですか？`)) return
    setSubmitting(true)
    setFormError('')
    try {
      const res = await apiPost('deleteVideo', { videoID: editingId })
      if (!res.success) {
        setFormError(res.message || '削除に失敗しました')
        return
      }
      setMessage('動画を削除しました')
      cancelEdit()
      loadTeamVideos()
      loadAllTeamVideos(teams)
    } catch {
      setFormError('削除に失敗しました。時間をおいて再度お試しください')
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('lp_admin')
    localStorage.removeItem('lp_admin_login_at')
    navigate('/')
  }

  if (!authed) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-eyebrow">ADMIN</div>
          <h1 className="login-title" style={{ fontSize: '2.2rem' }}>
            管理画面
          </h1>
          <p className="login-subtitle">動画の追加はこちらから</p>
          <form className="login-form" onSubmit={handleAuth}>
            <div>
              <label className="field-label">管理者パスワード</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
              />
            </div>
            {authError && <p className="error-text">{authError}</p>}
            <button className="btn-primary" type="submit" disabled={checking}>
              {checking ? '確認中…' : '入る'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              opacity: 0.55,
              marginBottom: '0.35rem',
            }}
          >
            LOVE and PEACE
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: '1.6rem',
              margin: 0,
            }}
          >
            チーム管理画面
          </h1>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      <AdminCard title="全チームの動画一覧">
        <div className="team-overview">
          {teams.map((t) => (
            <div key={t} className="team-overview-row">
              <div className="team-overview-name">{t}</div>
              <div className="team-overview-videos">
                {(allTeamVideos[t] || []).length === 0 ? (
                  <span className="team-tag">動画なし</span>
                ) : (
                  allTeamVideos[t].map((v) => (
                    <button
                      type="button"
                      key={v.videoID}
                      className="team-overview-chip"
                      onClick={() => toggleFbVideo(v.videoID)}
                      style={{
                        borderColor:
                          fbVideoId === v.videoID ? 'var(--accent-standout)' : 'var(--line)',
                      }}
                    >
                      <span className="team-overview-chip-date">{formatDate(v.postedDate)}</span>
                      {v.title}
                    </button>
                  ))
                )}
              </div>

              {(allTeamVideos[t] || []).some((v) => v.videoID === fbVideoId) && (
                <div className="feedback-list" style={{ marginTop: '1rem' }}>
                  {fbLoading && <p className="team-tag">読み込み中…</p>}
                  {!fbLoading && fbFeedback.length === 0 && (
                    <p className="team-tag">まだフィードバックがありません</p>
                  )}
                  {!fbLoading &&
                    fbFeedback
                      .filter((f) => !f.replyTo)
                      .map((f) => {
                        const replies = fbFeedback.filter((r) => r.replyTo === f.feedbackID)
                        return (
                          <div key={f.feedbackID} className="feedback-item">
                            <div className="feedback-item-name">
                              {f.name}
                              <span className="feedback-item-date">
                                {formatDate(f.postedAt)}
                              </span>
                            </div>
                            <div className="feedback-item-text">{f.comment}</div>
                            <button
                              type="button"
                              className="feedback-reply-btn"
                              onClick={() =>
                                setFbReplyingId(
                                  fbReplyingId === f.feedbackID ? null : f.feedbackID
                                )
                              }
                            >
                              返信
                            </button>

                            {replies.map((r) => (
                              <div key={r.feedbackID} className="feedback-reply">
                                <div className="feedback-item-name">
                                  {r.name}
                                  <span className="feedback-item-date">
                                    {formatDate(r.postedAt)}
                                  </span>
                                </div>
                                <div className="feedback-item-text">{r.comment}</div>
                              </div>
                            ))}

                            {fbReplyingId === f.feedbackID && (
                              <div className="feedback-reply-form">
                                <textarea
                                  value={fbReplyDrafts[f.feedbackID] || ''}
                                  onChange={(e) =>
                                    setFbReplyDrafts((prev) => ({
                                      ...prev,
                                      [f.feedbackID]: e.target.value,
                                    }))
                                  }
                                  placeholder={`${f.name}さんへ返信（${ADMIN_REPLY_NAME}として投稿）`}
                                />
                                {fbError && <p className="error-text">{fbError}</p>}
                                <button
                                  className="btn-primary"
                                  type="button"
                                  disabled={fbReplySubmittingId === f.feedbackID}
                                  onClick={() => handleFbReply(fbVideoId, f.feedbackID)}
                                >
                                  {fbReplySubmittingId === f.feedbackID ? '送信中…' : '返信する'}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                </div>
              )}
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="動画を追加・編集">
        <form className="admin-form" onSubmit={handlePostVideo}>
          <div>
            <label className="field-label">チーム</label>
            <select
              className="field-input"
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value)
                cancelEdit()
              }}
            >
              <option value="">選択してください</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && teamVideos.length > 0 && (
            <div>
              <label className="field-label">{selectedTeam}の動画一覧（クリックで編集）</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {teamVideos.map((v) => (
                  <button
                    type="button"
                    key={v.videoID}
                    onClick={() => startEdit(v)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      borderColor:
                        editingId === v.videoID ? 'var(--accent-standout)' : 'var(--line)',
                    }}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="field-label">新規動画タイトル</label>
            <input
              className="field-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例）7月度 練習動画"
            />
          </div>

          <div>
            <label className="field-label">YouTube URL</label>
            <input
              className="field-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="field-label">解説文（動画の上に表示されます）</label>
            <textarea
              className="field-input"
              style={{ minHeight: '90px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="この動画のポイントや練習の意図などを書いてください"
            />
          </div>

          {formError && <p className="error-text">{formError}</p>}
          {message && <p className="success-banner">{message}</p>}

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? '保存中…' : editingId ? '更新する' : '追加する'}
            </button>
            {editingId && (
              <>
                <button type="button" className="btn-ghost" onClick={cancelEdit}>
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteVideo}
                  disabled={submitting}
                >
                  削除する
                </button>
              </>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="メンバーを追加・編集">
        <form className="admin-form" onSubmit={handleAddMember}>
          <div>
            <label className="field-label">チーム</label>
            <select
              className="field-input"
              value={memberTeam}
              onChange={(e) => setMemberTeam(e.target.value)}
            >
              <option value="">選択してください</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {memberTeam && teamMembers.length > 0 && (
            <div>
              <label className="field-label">{memberTeam}の現在のメンバー（クリックで編集）</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {teamMembers.map((m) => (
                  <button
                    type="button"
                    key={m.memberID}
                    onClick={() => startEditMember(m)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      borderColor:
                        editingMemberId === m.memberID ? 'var(--accent-standout)' : 'var(--line)',
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="field-label">新規メンバー名</label>
            <input
              className="field-input"
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="例）田中"
            />
          </div>

          {memberError && <p className="error-text">{memberError}</p>}
          {memberMessage && <p className="success-banner">{memberMessage}</p>}

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button className="btn-primary" type="submit" disabled={memberSubmitting}>
              {memberSubmitting ? '保存中…' : editingMemberId ? '更新する' : 'メンバーを追加'}
            </button>
            {editingMemberId && (
              <>
                <button type="button" className="btn-ghost" onClick={cancelEditMember}>
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteMember}
                  disabled={memberSubmitting}
                >
                  削除する
                </button>
              </>
            )}
          </div>
        </form>
      </AdminCard>

      <AdminCard title="チームを追加・編集">
        <form className="admin-form" onSubmit={handleAddTeam}>
          {teams.length > 0 && (
            <div>
              <label className="field-label">既存のチーム（クリックで編集）</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {teams.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => startEditTeam(t)}
                    className="btn-ghost"
                    style={{
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      borderColor:
                        editingTeamOriginal === t ? 'var(--accent-standout)' : 'var(--line)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="field-label">新規チーム名</label>
            <input
              className="field-input"
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="例）名古屋チーム"
            />
          </div>

          <div>
            <label className="field-label">
              パスワード{editingTeamOriginal ? '（変更する場合は入力し直してください）' : ''}
            </label>
            <input
              className="field-input"
              type="text"
              value={newTeamPassword}
              onChange={(e) => setNewTeamPassword(e.target.value)}
              placeholder="このチーム用のパスワード"
            />
          </div>

          {teamError && <p className="error-text">{teamError}</p>}
          {teamMessage && <p className="success-banner">{teamMessage}</p>}

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button className="btn-primary" type="submit" disabled={teamSubmitting}>
              {teamSubmitting ? '保存中…' : editingTeamOriginal ? '更新する' : 'チームを追加'}
            </button>
            {editingTeamOriginal && (
              <>
                <button type="button" className="btn-ghost" onClick={cancelEditTeam}>
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteTeam}
                  disabled={teamSubmitting}
                >
                  削除する
                </button>
              </>
            )}
          </div>
        </form>
      </AdminCard>
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return String(value)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}/${mm}/${dd}`
}
