import { useState } from 'react'
import SectionIcon from './SectionIcon.jsx'

// 「自己との対話」「動画一覧」など、アイコン付きの見出しで開閉できるカードの共通枠
export default function SectionCard({ icon, title, subtitle, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="section-card">
      <button
        type="button"
        className="section-card-header"
        onClick={() => setOpen(!open)}
      >
        <span className="section-card-header-left">
          <SectionIcon type={icon} size={36} />
          <span className="section-card-heading">
            <span className="section-card-title">{title}</span>
            {subtitle && <span className="section-card-sub">{subtitle}</span>}
          </span>
        </span>
        <svg
          className={`section-card-chevron${open ? ' is-open' : ''}`}
          width="16"
          height="16"
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
      {open && <div className="section-card-body">{children}</div>}
    </div>
  )
}
