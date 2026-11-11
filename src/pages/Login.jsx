import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiGetCached, apiPost } from '../config.js'
import StarField from '../components/StarField.jsx'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GAS側の一時的な読み込み不調に備えて、ログインだけは1回だけ自動で再試行する
async function loginWithRetry(action, params) {
  const first = await apiGet(action, params)
  if (first.success) return first
  await sleep(700)
  return apiGet(action, params)
}

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: チーム選択(管理人のみパスワードも), 2: 名前+本人パスワード
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [team, setTeam] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedMemberID, setSelectedMemberID] = useState('')
  const [memberPassword, setMemberPassword] = useState('')
  const [memberPasswordConfirm, setMemberPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 「管理人」は常に一番下に表示する
    const show = (res) => {
      const list = res.teams || []
      const sorted = [...list.filter((t) => t !== '管理人'), ...list.filter((t) => t === '管理人')]
      setTeams(sorted)
      setTeamsLoading(false)
    }
    apiGetCached('getTeams', {}, show)
      .then(show)
      .catch(() => {
        setTeamsLoading(false)
        setError('チーム一覧を読み込めませんでした。ページを再読み込みしてください')
      })
  }, [])

  const isAdminTeam = team.trim() === '管理人'
  const selectedMember = members.find((m) => m.memberID === selectedMemberID)
  const isFirstTime = !!selectedMember && !selectedMember.hasPassword

  async function handleTeamSubmit(e) {
    e.preventDefault()
    setError('')

    if (!team.trim()) {
      setError('チーム名を選択してください')
      return
    }

    if (isAdminTeam) {
      if (!adminPassword.trim()) {
        setError('パスワードを入力してください')
        return
      }
      setLoading(true)
      try {
        const res = await loginWithRetry('login', { team: team.trim(), password: adminPassword.trim() })
        if (res.success) {
          localStorage.setItem('lp_admin', 'true')
          localStorage.setItem('lp_admin_login_at', String(Date.now()))
          localStorage.setItem('lp_token', res.token || '')
          navigate('/admin')
          return
        }
        setError(res.message || 'ログインに失敗しました')
      } catch {
        setError('通信エラーが発生しました。時間をおいて再度お試しください')
      } finally {
        setLoading(false)
      }
      return
    }

    // 通常チーム: パスワードなしでメンバー一覧を取得して次へ
    setMembersLoading(true)
    try {
      const res = await apiGet('getMembers', { team: team.trim() })
      setMembers(res.members || [])
      setStep(2)
    } catch {
      setError('通信エラーが発生しました。時間をおいて再度お試しください')
    } finally {
      setMembersLoading(false)
    }
  }

  function onLoginSuccess(res) {
    localStorage.setItem('lp_team', res.team)
    localStorage.setItem('lp_member', res.member)
    localStorage.setItem('lp_login_at', String(Date.now()))
    localStorage.setItem('lp_token', res.token || '')
    navigate('/videos')
  }

  async function handleMemberSubmit(e) {
    e.preventDefault()
    setError('')
    if (!selectedMemberID) {
      setError('お名前を選択してください')
      return
    }
    if (!memberPassword.trim()) {
      setError('パスワードを入力してください')
      return
    }

    if (isFirstTime) {
      if (memberPassword.trim() !== memberPasswordConfirm.trim()) {
        setError('パスワードが一致しません')
        return
      }
      setLoading(true)
      try {
        const res = await apiPost('claimMemberPassword', {
          memberID: selectedMemberID,
          password: memberPassword.trim(),
        })
        if (res.success) {
          onLoginSuccess(res)
          return
        }
        setError(res.message || '設定に失敗しました')
      } catch {
        setError('通信エラーが発生しました。時間をおいて再度お試しください')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const res = await loginWithRetry('loginMember', {
        memberID: selectedMemberID,
        password: memberPassword.trim(),
      })
      if (res.success) {
        onLoginSuccess(res)
        return
      }
      setError(res.message || 'ログインに失敗しました')
    } catch {
      setError('通信エラーが発生しました。時間をおいて再度お試しください')
    } finally {
      setLoading(false)
    }
  }

  function backToStep1() {
    setStep(1)
    setSelectedMemberID('')
    setMemberPassword('')
    setMemberPasswordConfirm('')
    setError('')
  }

  function onSelectMember(memberID) {
    setSelectedMemberID(memberID)
    setMemberPassword('')
    setMemberPasswordConfirm('')
    setError('')
  }

  return (
    <div className="login-screen">
      <StarField withLogoStars />
      <div className="login-card">
        <img
          src="/login-logo.png"
          alt="LOVE AND PEACE ポータルサイト"
          style={{
            display: 'block',
            width: '260px',
            height: 'auto',
            margin: '0 auto 2rem',
          }}
        />

        {step === 1 && (
          <form className="login-form" onSubmit={handleTeamSubmit}>
            <div>
              <label className="field-label">チーム名</label>
              <select
                className="field-input"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                disabled={teamsLoading}
              >
                <option value="">{teamsLoading ? '読み込み中…' : '選択してください'}</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {isAdminTeam && (
              <div>
                <label className="field-label">パスワード</label>
                <input
                  className="field-input"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="パスワードを入力"
                />
              </div>
            )}
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading || teamsLoading || membersLoading}>
              {loading || membersLoading ? '確認中…' : isAdminTeam ? 'ログイン' : '次へ'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="login-form" onSubmit={handleMemberSubmit}>
            <div>
              <label className="field-label">お名前</label>
              <select
                className="field-input"
                value={selectedMemberID}
                onChange={(e) => onSelectMember(e.target.value)}
              >
                <option value="">選択してください</option>
                {members.map((m) => (
                  <option key={m.memberID} value={m.memberID}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {isFirstTime && (
              <p className="field-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
                初めてのご利用ですね。これから使うパスワードを決めてください
              </p>
            )}

            <div>
              <label className="field-label">{isFirstTime ? '新しいパスワード' : 'パスワード'}</label>
              <input
                className="field-input"
                type="password"
                value={memberPassword}
                onChange={(e) => setMemberPassword(e.target.value)}
                placeholder={isFirstTime ? '使いたいパスワードを入力' : 'ご自身のパスワードを入力'}
                autoFocus
              />
            </div>

            {isFirstTime && (
              <div>
                <label className="field-label">パスワード(確認)</label>
                <input
                  className="field-input"
                  type="password"
                  value={memberPasswordConfirm}
                  onChange={(e) => setMemberPasswordConfirm(e.target.value)}
                  placeholder="もう一度入力してください"
                />
              </div>
            )}

            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? '確認中…' : isFirstTime ? 'このパスワードで始める' : 'ログインする'}
            </button>
            <button type="button" className="btn-ghost" onClick={backToStep1} disabled={loading}>
              チームを選び直す
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
