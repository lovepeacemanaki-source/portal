// セクション見出し用の円形アイコン(動画=再生ボタン、日記=本+星)
export default function SectionIcon({ type, size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 放射状の光線 */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16
        const rad = (angle * Math.PI) / 180
        const r1 = 40
        const r2 = 48
        const x1 = 50 + r1 * Math.cos(rad)
        const y1 = 50 + r1 * Math.sin(rad)
        const x2 = 50 + r2 * Math.cos(rad)
        const y2 = 50 + r2 * Math.sin(rad)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.45"
          />
        )
      })}

      {/* 外枠の円 */}
      <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />

      {/* 上下左右の軸線 */}
      <line x1="50" y1="2" x2="50" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="50" y1="86" x2="50" y2="98" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="2" y1="50" x2="16" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="84" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.6" />

      {/* 軸の先端の輪 */}
      <circle cx="50" cy="8" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <circle cx="50" cy="92" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <circle cx="9" cy="50" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <circle cx="91" cy="50" r="3" stroke="currentColor" strokeWidth="1" opacity="0.7" />

      {/* 上の点線 */}
      <circle cx="50" cy="17" r="1.1" fill="currentColor" opacity="0.6" />
      <circle cx="50" cy="21" r="1.1" fill="currentColor" opacity="0.6" />
      <circle cx="50" cy="25" r="1.1" fill="currentColor" opacity="0.6" />
      {/* 下の点線 */}
      <circle cx="50" cy="75" r="1.1" fill="currentColor" opacity="0.6" />
      <circle cx="50" cy="79" r="1.1" fill="currentColor" opacity="0.6" />
      <circle cx="50" cy="83" r="1.1" fill="currentColor" opacity="0.6" />

      {type === 'video' ? (
        <>
          <circle cx="50" cy="50" r="22" fill="currentColor" opacity="0.12" />
          <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <path d="M45 40 L62 50 L45 60 Z" fill="currentColor" />
        </>
      ) : (
        <>
          <path
            d="M50 36 C47 33 40 31 33 32 C32 32 31 33 31 34 L31 58 C31 59 32 60 33 60 C40 59 47 61 50 64 C53 61 60 59 67 60 C68 60 69 59 69 58 L69 34 C69 33 68 32 67 32 C60 31 53 33 50 36 Z"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <line x1="50" y1="36" x2="50" y2="64" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <path
            d="M50 22 L52 28 L58 28 L53 32 L55 38 L50 34 L45 38 L47 32 L42 28 L48 28 Z"
            fill="currentColor"
          />
        </>
      )}
    </svg>
  )
}
