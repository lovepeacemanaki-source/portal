// ログイン画面の背景に浮かべる、点と線の"つながり"モチーフ。
// 地域を越えたメンバー同士のつながりを、夜空の星座に見立てている。
const POINTS = [
  [8, 15], [22, 8], [40, 22], [58, 10], [75, 20], [92, 12],
  [15, 40], [35, 45], [55, 38], [78, 48], [95, 42],
  [10, 68], [30, 72], [50, 65], [70, 75], [90, 70],
  [20, 92], [45, 88], [65, 95], [85, 90],
]

const LINES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [1, 7], [2, 8], [4, 9], [5, 10],
  [6, 7], [7, 8], [8, 9], [9, 10],
  [6, 11], [7, 12], [8, 13], [9, 14], [10, 15],
  [11, 12], [12, 13], [13, 14], [14, 15],
  [11, 16], [12, 17], [13, 18], [15, 19],
  [16, 17], [17, 18], [18, 19],
]

export default function ConstellationBg() {
  return (
    <svg
      className="constellation-bg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {LINES.map(([a, b], i) => (
        <line
          key={i}
          x1={POINTS[a][0]}
          y1={POINTS[a][1]}
          x2={POINTS[b][0]}
          y2={POINTS[b][1]}
          stroke="#FFFEF9"
          strokeOpacity="0.08"
          strokeWidth="0.15"
        />
      ))}
      {POINTS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 0.55 : 0.35}
          fill={i % 5 === 0 ? '#F0B429' : '#FFFEF9'}
          fillOpacity={i % 5 === 0 ? 0.7 : 0.35}
        />
      ))}
    </svg>
  )
}
