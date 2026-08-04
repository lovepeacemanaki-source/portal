// ページ全体にうっすら敷く、瞬く星と下部グラデーションの演出。
// 星は少なめ・ランダムな瞬きにして、うるさくならないようにしている。
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
      r: 0.5 + Math.random() * 1.1,
      delay: Math.random() * 6,
      dur: 2.6 + Math.random() * 3.4,
      op: 0.45 + Math.random() * 0.45,
    })
  }
  return stars
}

// ログイン画面・動画一覧、どちらもロゴが中央上寄りに来るので、そのゾーンは避けておく
const STARS = makeStars(34, { x1: 25, y1: 6, x2: 75, y2: 46 })

// ロゴのすぐ周りにだけ、意図的に添える小さな星
const LOGO_STARS = [
  { x: 30, y: 14, r: 1.1, delay: 0.4, dur: 3.2, op: 0.8 },
  { x: 70, y: 10, r: 0.9, delay: 1.8, dur: 3.8, op: 0.7 },
  { x: 78, y: 24, r: 0.7, delay: 0.9, dur: 2.8, op: 0.6 },
  { x: 22, y: 28, r: 0.8, delay: 2.6, dur: 3.4, op: 0.65 },
  { x: 50, y: 6, r: 0.6, delay: 3.4, dur: 3, op: 0.55 },
]

export default function StarField({ withLogoStars = false }) {
  return (
    <>
      <svg
        className="starfield"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {STARS.map((s, i) => (
          <circle
            key={i}
            className="star"
            cx={s.x}
            cy={s.y}
            r={s.r * 0.12}
            fill="#FFFEF9"
            style={{
              '--star-dur': `${s.dur}s`,
              '--star-delay': `${s.delay}s`,
              '--op-max': s.op,
            }}
          />
        ))}
        {withLogoStars &&
          LOGO_STARS.map((s, i) => (
            <circle
              key={`logo-${i}`}
              className="star"
              cx={s.x}
              cy={s.y}
              r={s.r * 0.14}
              fill="#FFFEF9"
              style={{
                '--star-dur': `${s.dur}s`,
                '--star-delay': `${s.delay}s`,
                '--op-max': s.op,
              }}
            />
          ))}
      </svg>
      <div className="bg-bottom-fade" aria-hidden="true" />
    </>
  )
}
