import { useEffect, useState } from 'react'
import SectionCard from './SectionCard.jsx'
import { apiGet, apiPost } from '../config.js'
import { exportDiaryPdf } from '../utils/exportDiaryPdf.js'

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateLabel(dateKey) {
  const [y, m, d] = dateKey.split('-')
  return `${y}/${m}/${d}`
}

// {date, text, updatedAt}[] -> { [date]: {text, updatedAt} }
function toEntriesMap(list) {
  const map = {}
  for (const row of list || []) {
    map[row.date] = { text: row.text, updatedAt: row.updatedAt }
  }
  return map
}

export default function DiaryCard({ team, member }) {
  const [entries, setEntries] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [draft, setDraft] = useState('')
  const [isWriting, setIsWriting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [expandedDate, setExpandedDate] = useState(null)
  const [savedMessage, setSavedMessage] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    const token = localStorage.getItem('lp_token') || ''
    apiGet('getDiary', { team, member, token }).then((res) => {
      if (cancelled) return
      if (!res.success) {
        setLoadError(res.message || '読み込みに失敗しました')
        setLoading(false)
        return
      }
      setEntries(toEntriesMap(res.entries))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [team, member])

  const today = todayKey()
  const todayEntry = entries[today]

  function startWriting() {
    setDraft(todayEntry ? todayEntry.text : '')
    setIsWriting(true)
    setSavedMessage('')
    setSaveError('')
  }

  function cancelWriting() {
    setIsWriting(false)
    setDraft('')
  }

  async function saveToday() {
    if (!draft.trim() || isSaving) return
    setIsSaving(true)
    setSaveError('')
    try {
      const res = await apiPost('saveDiary', { team, member, date: today, text: draft.trim() })
      if (!res.success) {
        setSaveError(res.message || '保存に失敗しました')
        return
      }
      setEntries((prev) => ({ ...prev, [today]: { text: draft.trim(), updatedAt: Date.now() } }))
      setIsWriting(false)
      setSavedMessage('保存しました')
      setExpandedDate(today)
    } catch {
      setSaveError('保存に失敗しました。時間をおいて再度お試しください')
    } finally {
      setIsSaving(false)
    }
  }

  function toggleDate(dateKey) {
    setExpandedDate(expandedDate === dateKey ? null : dateKey)
  }

  async function downloadDiary() {
    if (isExporting) return
    setIsExporting(true)
    try {
      await exportDiaryPdf({ member, entries, sortedDates })
    } finally {
      setIsExporting(false)
    }
  }

  const sortedDates = Object.keys(entries).sort((a, b) => (a < b ? 1 : -1))

  return (
    <SectionCard
      icon="diary"
      title="自己との対話"
      subtitle="ここに書いたことは、あなた以外には誰にも見えません"
    >
      {loading && <p className="team-tag">読み込み中…</p>}

      {!loading && loadError && <p className="error-text">{loadError}</p>}

      {!loading && !loadError && (
        <>
          {!isWriting && (
            <button className="diary-write-trigger" onClick={startWriting}>
              {todayEntry ? '今日の記録を編集する' : '今日感じたことを書く'}
            </button>
          )}

          {isWriting && (
            <div className="diary-write-box">
              <textarea
                className="diary-textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="今日感じたこと、思ったことを自由に書いてください"
                rows={6}
                autoFocus
              />
              {saveError && <p className="error-text">{saveError}</p>}
              <div className="diary-write-actions">
                <button className="btn-ghost" onClick={cancelWriting} disabled={isSaving}>
                  キャンセル
                </button>
                <button className="btn-primary" onClick={saveToday} disabled={!draft.trim() || isSaving}>
                  {isSaving ? '保存中…' : '保存する'}
                </button>
              </div>
            </div>
          )}

          {savedMessage && <p className="diary-saved-message">{savedMessage}</p>}

          {sortedDates.length > 0 && (
            <div className="diary-entry-list">
              {sortedDates.map((dateKey) => {
                const isOpen = expandedDate === dateKey
                return (
                  <div key={dateKey} className="diary-entry-row">
                    <button
                      className="diary-entry-toggle"
                      onClick={() => toggleDate(dateKey)}
                    >
                      <span>{formatDateLabel(dateKey)}</span>
                      <svg
                        className={`diary-entry-chevron${isOpen ? ' is-open' : ''}`}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="diary-entry-body">{entries[dateKey].text}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {sortedDates.length > 0 && (
            <button className="diary-download-btn" onClick={downloadDiary} disabled={isExporting}>
              {isExporting ? 'PDFを作成中…' : '自分の日記をPDFでダウンロード'}
            </button>
          )}
        </>
      )}
    </SectionCard>
  )
}
