// ホーム画面に追加したリンクから開くと、ブラウザの更新ボタンが使えないので、画面内に再読み込みボタンを置く
export default function ReloadButton({ className = 'reload-link' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.location.reload()}
      aria-label="ページを再読み込みする"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ marginRight: '0.3rem', verticalAlign: '-1px' }}
      >
        <path d="M21 12a9 9 0 11-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
      再読み込み
    </button>
  )
}
