import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../config.js'
import ConstellationBg from '../components/ConstellationBg.jsx'

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
      const res = await apiGet('login', { team: '管理人', password: password.trim() })
      if (res.success) {
        if (team.trim() === '管理人') {
          localStorage.setItem('lp_admin', 'true')
          navigate('/admin')
          return
        }
        const membersRes = await apiGet('getMembers', { team: team.trim() })
        setMembers(membersRes.members || [])
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
      <ConstellationBg />
      <div className="login-card">
        <div className="login-eyebrow">LOVE AND PEACE</div>
        <h1 className="login-title">Love and Peace</h1>
        <p className="login-subtitle">ポータルサイト</p>

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
