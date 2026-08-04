// ページ全体にうっすら敷く、瞬く星と下部グラデーション・時々流れる流れ星の演出。
// 実際の夜空のように、瞬く星と静かに光ってるだけの星を混ぜている。
// ロゴが置かれる中央上寄りのエリアはあえて星を避け、主役を邪魔しないようにしてある。

function pickMode() {
  const roll = Math.random()
  if (roll < 0.35) return 'staccato'
  if (roll < 0.35 + 0.325) return 'twinkle'
  return 'static'
}

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
      r: 0.2 + Math.random() * 0.14,
      delay: Math.random() * 8,
      dur: 4 + Math.random() * 5,
      op: 0.75 + Math.random() * 0.25,
      sparkle: Math.random() < 0.05,
      mode: pickMode(),
    })
  }
  return stars
}

// ログイン画面・動画一覧、どちらもロゴが中央上寄りに来るので、そのゾーンは避けておく
const STARS = makeStars(280, { x1: 25, y1: 6, x2: 75, y2: 46 })

// ロゴのすぐ周りにだけ、意図的に添える小さな星
const LOGO_STARS = [
  { x: 30, y: 14, r: 0.28, delay: 0.4, dur: 5, op: 0.95, sparkle: true, mode: 'staccato' },
  { x: 70, y: 10, r: 0.24, delay: 1.8, dur: 5.6, op: 0.9, sparkle: false, mode: 'twinkle' },
  { x: 78, y: 24, r: 0.22, delay: 0.9, dur: 4.4, op: 0.85, sparkle: false, mode: 'static' },
  { x: 22, y: 28, r: 0.24, delay: 2.6, dur: 5.2, op: 0.85, sparkle: false, mode: 'twinkle' },
  { x: 50, y: 6, r: 0.2, delay: 3.4, dur: 4.8, op: 0.8, sparkle: false, mode: 'static' },
]

// 中央のロゴゾーンを避けて、ランダムな1点を選ぶ
function pickPoint(exclude) {
  let x, y
  let guard = 0
  do {
    x = Math.random() * 100
    y = Math.random() * 100
    guard++
  } while (
    exclude &&
    x > exclude.x1 &&
    x < exclude.x2 &&
    y > exclude.y1 &&
    y < exclude.y2 &&
    guard < 20
  )
  return { x, y }
}

// ポワーンと広がって消える、水面の波紋のような同心円。
// 1箇所につき数本のリングを少しずつタイミングをずらして重ね、
// 本物の波紋のように何重にも輪が広がって見えるようにしている。
const RIPPLE_ZONE = { x1: 25, y1: 6, x2: 75, y2: 46 }
const RIPPLE_RING_COUNT = 4
const RIPPLE_RING_STAGGER = 0.9 // 秒

const RIPPLES = [0, 1, 2].flatMap((i) => {
  const point = pickPoint(RIPPLE_ZONE)
  const baseDelay = i * 15
  return Array.from({ length: RIPPLE_RING_COUNT }, (_, ringIdx) => ({
    ...point,
    delay: baseDelay + ringIdx * RIPPLE_RING_STAGGER,
  }))
})

// ロゴのゾーンを避けた、流れ星の安全な経路パターン
// (画面の上端・下端・左端・右端だけを通るので、中央のロゴの裏を通らない)
// どれも「上から下」に落ちる自然な向きに統一してある
const SHOOTING_STAR_PRESETS = [
  { top: '1%', left: '-10%', dx: '82vw', dy: '3vh', rot: 4 },
  { top: '3%', left: '35%', dx: '55vw', dy: '2vh', rot: 3 },
  { top: '52%', left: '-10%', dx: '80vw', dy: '22vh', rot: 16 },
  { top: '60%', left: '20%', dx: '75vw', dy: '25vh', rot: 18 },
  { top: '50%', left: '80%', dx: '-55vw', dy: '26vh', rot: 155 },
  { top: '47%', left: '15%', dx: '70vw', dy: '30vh', rot: 23 },
]
const shootingStarPreset =
  SHOOTING_STAR_PRESETS[Math.floor(Math.random() * SHOOTING_STAR_PRESETS.length)]

// 細くまっすぐな「+」に近いスパークル
function sparklePath(cx, cy, r) {
  return `M ${cx} ${cy - r} L ${cx} ${cy + r} M ${cx - r} ${cy} L ${cx + r} ${cy}`
}

function StarShape({ s, keyPrefix, i }) {
  const className =
    s.mode === 'staccato'
      ? 'star star-staccato'
      : s.mode === 'twinkle'
      ? 'star'
      : 'star star-static'
  const style =
    s.mode === 'static'
      ? { opacity: s.op }
      : {
          '--star-dur': `${s.dur}s`,
          '--star-delay': `${s.delay}s`,
          '--op-max': s.op,
        }

  if (s.sparkle) {
    const tip = s.r * 0.9
    const dimStyle =
      s.mode === 'static'
        ? { opacity: s.op * 0.45 }
        : {
            '--star-dur': `${s.dur}s`,
            '--star-delay': `${s.delay}s`,
            '--op-max': s.op * 0.45,
          }

    return (
      <g key={`${keyPrefix}-${i}`}>
        <path
          className={className}
          d={sparklePath(s.x, s.y, tip)}
          stroke="url(#starGlow)"
          strokeWidth={s.r * 0.16}
          strokeLinecap="round"
          fill="none"
          style={style}
        />
        <path
          className={className}
          d={sparklePath(s.x, s.y, tip * 0.6)}
          stroke="url(#starGlow)"
          strokeWidth={s.r * 0.1}
          strokeLinecap="round"
          fill="none"
          style={dimStyle}
          transform={`rotate(45 ${s.x} ${s.y})`}
        />
      </g>
    )
  }
  return (
    <circle
      key={`${keyPrefix}-${i}`}
      className={className}
      cx={s.x}
      cy={s.y}
      r={s.r * 0.18}
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
            <stop offset="45%" stopColor="#FFFEF9" stopOpacity="1" />
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
      <div
        className="shooting-star"
        aria-hidden="true"
        style={{
          top: shootingStarPreset.top,
          left: shootingStarPreset.left,
          '--ss-dx': shootingStarPreset.dx,
          '--ss-dy': shootingStarPreset.dy,
          '--ss-rot': `${shootingStarPreset.rot}deg`,
        }}
      />
      {RIPPLES.map((r, i) => (
        <div
          key={`ripple-${i}`}
          className="ripple-ring"
          aria-hidden="true"
          style={{ top: `${r.y}%`, left: `${r.x}%`, animationDelay: `${r.delay}s` }}
        />
      ))}
      <div className="bg-bottom-fade" aria-hidden="true" />
    </>
  )
}
