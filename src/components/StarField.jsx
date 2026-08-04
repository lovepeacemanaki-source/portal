// ページ全体にうっすら敷く、瞬く星と下部グラデーション・時々流れる流れ星の演出。
// 実際の夜空のように、瞬く星と静かに光ってるだけの星を混ぜている。
// ロゴが置かれる中央上寄りのエリアはあえて星を避け、主役を邪魔しないようにしてある。

function makeStars(count, exclude) {
  const stars = []
  let guard = 0
  while (stars.length < count && guard < count * 12) {
    guard++
    const x = Math.random() * 100
    const y = Math.random() * 100
    if (exclude && x > exclude.x1 && x < exclude.x2 && y > exclude.y1 && y < exclude.y2) continue
    stars.push({
      x,
      y,
      r: 0.3 + Math.random() * 0.5,
      delay: Math.random() * 8,
      dur: 4 + Math.random() * 5,
      op: 0.35 + Math.random() * 0.4,
      sparkle: Math.random() < 0.16,
      twinkle: Math.random() < 0.5,
    })
  }
  return stars
}

// ログイン画面・動画一覧、どちらもロゴが中央上寄りに来るので、そのゾーンは避けておく
const STARS = makeStars(100, { x1: 25, y1: 6, x2: 75, y2: 46 })

// ロゴのすぐ周りにだけ、意図的に添える小さな星
const LOGO_STARS = [
  { x: 30, y: 14, r: 0.55, delay: 0.4, dur: 5, op: 0.7, sparkle: true, twinkle: true },
  { x: 70, y: 10, r: 0.45, delay: 1.8, dur: 5.6, op: 0.6, sparkle: false, twinkle: true },
  { x: 78, y: 24, r: 0.4, delay: 0.9, dur: 4.4, op: 0.5, sparkle: false, twinkle: false },
  { x: 22, y: 28, r: 0.45, delay: 2.6, dur: 5.2, op: 0.55, sparkle: true, twinkle: true },
  { x: 50, y: 6, r: 0.35, delay: 3.4, dur: 4.8, op: 0.45, sparkle: false, twinkle: false },
]

// 細く長い十字状のスパークル
function sparklePath(cx, cy, r) {
  const tip = r
  const waist = r * 0.028
  return [
    `M ${cx} ${cy - tip}`,
    `Q ${cx + waist} ${cy - waist} ${cx + tip} ${cy}`,
    `Q ${cx + waist} ${cy + waist} ${cx} ${cy + tip}`,
    `Q ${cx - waist} ${cy + waist} ${cx - tip} ${cy}`,
    `Q ${cx - waist} ${cy - waist} ${cx} ${cy - tip}`,
    'Z',
  ].join(' ')
}

function StarShape({ s, keyPrefix, i }) {
  const className = s.twinkle ? 'star' : 'star star-static'
  const style = s.twinkle
    ? {
        '--star-dur': `${s.dur}s`,
        '--star-delay': `${s.delay}s`,
        '--op-max': s.op,
      }
    : { opacity: s.op }

  if (s.sparkle) {
    return (
      <path
        key={`${keyPrefix}-${i}`}
        className={className}
        d={sparklePath(s.x, s.y, s.r * 1.3)}
        fill="url(#starGlow)"
        style={style}
      />
    )
  }
  return (
    <circle
      key={`${keyPrefix}-${i}`}
      className={className}
      cx={s.x}
      cy={s.y}
      r={s.r * 0.17}
      fill="url(#starGlow)"
      style={style}
    />
  )
}

export default function StarField({ withLogoStars = false }) {
  return (
    <>
      <svg
        className="starfield"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFEF9" stopOpacity="1" />
            <stop offset="55%" stopColor="#FFFEF9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFEF9" stopOpacity="0" />
          </radialGradient>
        </defs>
        {STARS.map((s, i) => (
          <StarShape key={i} s={s} keyPrefix="star" i={i} />
        ))}
        {withLogoStars &&
          LOGO_STARS.map((s, i) => (
            <StarShape key={`logo-${i}`} s={s} keyPrefix="logo-star" i={i} />
          ))}
      </svg>
      <div className="shooting-star" aria-hidden="true" />
      <div className="bg-bottom-fade" aria-hidden="true" />
    </>
  )
}
