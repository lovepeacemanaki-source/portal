import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../config.js'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: チーム+パスワード, 2: 名前選択
  const [teams, setTeams] = useState([])
  const [team, setTeam] = useState('')
  const [password, setPassword] = useState('')
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet('getTeams').then((res) => {
      setTeams(res.teams || [])
    })
  }, [])

  async function handleTeamSubmit(e) {
    e.preventDefault()
    setError('')
    if (!team.trim() || !password.trim()) {
      setError('チーム名とパスワードを入力してください')
      return
    }
    setLoading(true)
    try {
      if (team.trim() === '管理人') {
        const res = await apiGet('login', { team: team.trim(), password: password.trim() })
        if (res.success) {
          localStorage.setItem('lp_admin', 'true')
          navigate('/admin')
          return
        }
        setError(res.message || 'ログインに失敗しました')
        setLoading(false)
        return
      }

      const res = await apiGet('loginWithMembers', { team: team.trim(), password: password.trim() })
      if (res.success) {
        setMembers(res.members || [])
        setStep(2)
      } else {
        setError(res.message || 'ログインに失敗しました')
      }
    } catch {
      setError('通信エラーが発生しました。時間をおいて再度お試しください')
    } finally {
      setLoading(false)
    }
  }

  function handleMemberSubmit(e) {
    e.preventDefault()
    if (!selectedMember) {
      setError('お名前を選択してください')
      return
    }
    localStorage.setItem('lp_team', team.trim())
    localStorage.setItem('lp_member', selectedMember)
    navigate('/videos')
  }

  return (
    <div className="login-screen">
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
              >
                <option value="">選択してください</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">パスワード</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? '確認中…' : 'ログイン'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="login-form" onSubmit={handleMemberSubmit}>
            <div>
              <label className="field-label">お名前</label>
              <select
                className="field-input"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">選択してください</option>
                {members.map((m) => (
                  <option key={m.memberID} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn-primary" type="submit">
              ログインする
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
