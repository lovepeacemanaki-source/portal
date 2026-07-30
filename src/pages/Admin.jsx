import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../config.js'

const ADMIN_REPLY_NAME = '吉井孝'

export default function Admin() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(
    () => localStorage.getItem('lp_admin') === 'true'
  )
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
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [memberMessage, setMemberMessage] = useState('')
  const [memberError, setMemberError] = useState('')

  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamPassword, setNewTeamPassword] = useState('')
  const [teamSubmitting, setTeamSubmitting] = useState(false)
  const [teamMessage, setTeamMessage] = useState('')
  const [teamError, setTeamError] = useState('')

  const [fbTeam, setFbTeam] = useState('')
  const [fbVideoId, setFbVideoId] = useState('')
  const [fbFeedback, setFbFeedback] = useState([])
  const [fbLoading, setFbLoading] = useState(false)
  const [fbReplyingId, setFbReplyingId] = useState(null)
  const [fbReplyDrafts, setFbReplyDrafts] = useState({})
  const [fbReplySubmittingId, setFbReplySubmittingId] = useState(null)
  const [fbError, setFbError] = useState('')

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
      await apiPost('postFeedback', {
        videoID,
        name: ADMIN_REPLY_NAME,
        comment,
        replyTo: parentId,
      })
      setFbReplyDrafts((prev) => ({ ...prev, [parentId]: '' }))
      setFbReplyingId(null)
      loadFbFeedback(videoID)
    } catch {
      setFbError('送信に失敗しました。時間をおいて再度お試しください')
    } finally {
      setFbReplySubmittingId(null)
    }
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
      setTeamError('追加に失敗しました。時間をおいて再度お試しください')
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
      await apiPost('postMember', { team: memberTeam, name: memberName.trim() })
      setMemberMessage(`「${memberName.trim()}」を${memberTeam}に追加しました`)
      setMemberName('')
      loadTeamMembers()
    } catch {
      setMemberError('追加に失敗しました。時間をおいて再度お試しください')
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
        await apiPost('updateVideo', {
          videoID: editingId,
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
        })
        setMessage(`「${title.trim()}」を更新しました`)
        setEditingId(null)
      } else {
        await apiPost('postVideo', {
          team: selectedTeam,
          title: title.trim(),
          url: url.trim(),
          description: description.trim(),
        })
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

  function handleLogout() {
    localStorage.removeItem('lp_admin')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 className="admin-heading">全チームの動画一覧</h1>
        <button className="btn-ghost" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      <div className="team-overview">
        {teams.map((t) => (
          <div key={t} className="team-overview-row">
            <div className="team-overview-name">{t}</div>
            <div className="team-overview-videos">
              {(allTeamVideos[t] || []).length === 0 ? (
                <span className="team-tag">動画なし</span>
              ) : (
                allTeamVideos[t].map((v) => (
                  <span key={v.videoID} className="team-overview-chip">
                    <span className="team-overview-chip-date">{formatDate(v.postedDate)}</span>
                    {v.title}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'var(--line)', margin: '2.5rem 0' }} />

      <h1 className="admin-heading" style={{ marginBottom: '1.5rem' }}>フィードバックを見る・返信する</h1>

      <div className="admin-form" style={{ marginBottom: '1.5rem' }}>
        <div>
          <label className="field-label">チーム</label>
          <select
            className="field-input"
            value={fbTeam}
            onChange={(e) => {
              setFbTeam(e.target.value)
              setFbVideoId('')
              setFbFeedback([])
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

        {fbTeam && (
          <div>
            <label className="field-label">動画</label>
            <select
              className="field-input"
              value={fbVideoId}
              onChange={(e) => {
                setFbVideoId(e.target.value)
                if (e.target.value) loadFbFeedback(e.target.value)
                else setFbFeedback([])
              }}
            >
              <option value="">選択してください</option>
              {(allTeamVideos[fbTeam] || []).map((v) => (
                <option key={v.videoID} value={v.videoID}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {fbVideoId && (
        <div className="feedback-list" style={{ marginBottom: '1rem' }}>
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
                      <span className="feedback-item-date">{formatDate(f.postedAt)}</span>
                    </div>
                    <div className="feedback-item-text">{f.comment}</div>
                    <button
                      type="button"
                      className="feedback-reply-btn"
                      onClick={() =>
                        setFbReplyingId(fbReplyingId === f.feedbackID ? null : f.feedbackID)
                      }
                    >
                      返信
                    </button>

                    {replies.map((r) => (
                      <div key={r.feedbackID} className="feedback-reply">
                        <div className="feedback-item-name">
                          {r.name}
                          <span className="feedback-item-date">{formatDate(r.postedAt)}</span>
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

      <div style={{ height: '1px', background: 'var(--line)', margin: '2.5rem 0' }} />

      <h1 className="admin-heading" style={{ marginBottom: '1.5rem' }}>動画を追加・編集</h1>

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
                    borderColor: editingId === v.videoID ? 'var(--accent-gold)' : 'var(--line)',
                  }}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="field-label">動画タイトル</label>
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
            <button type="button" className="btn-ghost" onClick={cancelEdit}>
              キャンセル
            </button>
          )}
        </div>
      </form>

      <div style={{ height: '1px', background: 'var(--line)', margin: '2.5rem 0' }} />

      <h1 className="admin-heading" style={{ marginBottom: '1.2rem' }}>メンバーを追加</h1>

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
            <label className="field-label">{memberTeam}の現在のメンバー</label>
            <p className="team-tag">{teamMembers.map((m) => m.name).join('、')}</p>
          </div>
        )}

        <div>
          <label className="field-label">名前</label>
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

        <button className="btn-primary" type="submit" disabled={memberSubmitting}>
          {memberSubmitting ? '追加中…' : 'メンバーを追加'}
        </button>
      </form>

      <div style={{ height: '1px', background: 'var(--line)', margin: '2.5rem 0' }} />

      <h1 className="admin-heading" style={{ marginBottom: '1.2rem' }}>チームを追加</h1>

      <form className="admin-form" onSubmit={handleAddTeam}>
        <div>
          <label className="field-label">チーム名</label>
          <input
            className="field-input"
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="例）名古屋チーム"
          />
        </div>

        <div>
          <label className="field-label">パスワード</label>
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

        <button className="btn-primary" type="submit" disabled={teamSubmitting}>
          {teamSubmitting ? '追加中…' : 'チームを追加'}
        </button>
      </form>
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
